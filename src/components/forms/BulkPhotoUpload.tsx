'use client';

import { useState, useCallback, useRef, DragEvent } from 'react';
import Image from 'next/image';
import { Upload, X, GripVertical, Star, ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';

// #11 fix: Concurrency limiter for uploads (prevents browser overload)
async function asyncPool<T, R>(
  poolLimit: number,
  array: T[],
  iteratorFn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const ret: Promise<R>[] = [];
  const executing: Promise<void>[] = [];

  for (let i = 0; i < array.length; i++) {
    const p = Promise.resolve().then(() => iteratorFn(array[i], i));
    ret.push(p);

    if (poolLimit <= array.length) {
      const e: Promise<void> = p.then(() => {
        executing.splice(executing.indexOf(e), 1);
      });
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

export interface UploadedImage {
  id: string;
  url: string;
  isPrimary: boolean;
  order: number;
  uploading?: boolean;
  error?: string;
}

interface BulkPhotoUploadProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  folder: 'listings' | 'contractors';
  subfolder?: string; // e.g., 'images' for listing photos
  maxImages?: number;
  maxFileSize?: number; // in MB
  className?: string;
}

export default function BulkPhotoUpload({
  images,
  onChange,
  folder,
  subfolder = 'images', // Default to 'images' subfolder for secure storage
  maxImages = 20,
  maxFileSize = 10,
  className = '',
}: BulkPhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(null);
  const [truncationWarning, setTruncationWarning] = useState<string | null>(null);
  const [failedFiles, setFailedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const retryInputRef = useRef<HTMLInputElement>(null);
  const dragItemRef = useRef<number | null>(null);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  // #2.2 fix: Retry helper with exponential backoff
  const retryWithBackoff = async <T,>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000
  ): Promise<T> => {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = baseDelayMs * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  };

  const uploadFile = async (file: File): Promise<{ url: string; error?: string }> => {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return { url: '', error: 'File must be an image' };
      }

      // Validate file size
      if (file.size > maxFileSize * 1024 * 1024) {
        return { url: '', error: `File must be under ${maxFileSize}MB` };
      }

      // Get presigned URL with retry - SECURE PATH: /<folder>/<userId>/<subfolder>/
      const data = await retryWithBackoff(async () => {
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            fileSize: file.size,
            folder,
            subfolder,
            fileType: 'image',
          }),
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Failed to get upload URL');
        }
        return result;
      });

      // Upload to S3 with retry
      await retryWithBackoff(async () => {
        const uploadResponse = await fetch(data.data.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });

        if (!uploadResponse.ok) {
          throw new Error(`S3 upload failed: ${uploadResponse.status}`);
        }
      });

      // Use proxyUrl for display (works even when bucket blocks public access)
      return { url: data.data.proxyUrl || data.data.fileUrl };
    } catch (error) {
      return { url: '', error: error instanceof Error ? error.message : 'Upload failed after retries' };
    }
  };

  const handleFiles = useCallback(
    async (files: FileList) => {
      const allSelectedFiles = Array.from(files);
      const availableSlots = maxImages - images.length;
      
      // #7 fix: Show warning if files were truncated
      if (allSelectedFiles.length > availableSlots) {
        const truncatedCount = allSelectedFiles.length - availableSlots;
        setTruncationWarning(
          `${truncatedCount} photo${truncatedCount > 1 ? 's were' : ' was'} not added because the ${maxImages}-photo limit was reached.`
        );
        setTimeout(() => setTruncationWarning(null), 5000);
      }
      
      const fileArray = allSelectedFiles.slice(0, availableSlots);
      
      if (fileArray.length === 0) {
        if (availableSlots === 0) {
          setTruncationWarning(`Maximum photo limit reached: Up to ${maxImages} images allowed per listing.`);
          setTimeout(() => setTruncationWarning(null), 5000);
        }
        return;
      }

      // #6 fix: Initialize upload progress
      setUploadProgress({ completed: 0, total: fileArray.length });

      // Create placeholder entries for uploading files
      const newImages: UploadedImage[] = fileArray.map((file, index) => ({
        id: generateId(),
        url: URL.createObjectURL(file),
        isPrimary: images.length === 0 && index === 0,
        order: images.length + index,
        uploading: true,
      }));

      const allImages = [...images, ...newImages];
      onChange(allImages);

      // #11 fix: Upload files with concurrency limit (4 at a time)
      let completedCount = 0;
      const results = await asyncPool(4, fileArray, async (file, index) => {
        const result = await uploadFile(file);
        completedCount++;
        setUploadProgress({ completed: completedCount, total: fileArray.length });
        return { index, result };
      });

      // Update images with results - compute from allImages we created above
      const updatedImages = allImages.map((img, i) => {
        const resultEntry = results.find(r => images.length + r.index === i);
        if (resultEntry) {
          if (resultEntry.result.url) {
            return {
              ...img,
              url: resultEntry.result.url,
              uploading: false,
            };
          } else {
            return {
              ...img,
              uploading: false,
              error: resultEntry.result.error,
            };
          }
        }
        return img;
      });
      
      // #16 fix: Ensure at least one image is primary if images exist
      const hasValidImages = updatedImages.some(img => !img.error && !img.uploading);
      const hasPrimary = updatedImages.some(img => img.isPrimary && !img.error);
      
      if (hasValidImages && !hasPrimary) {
        const firstValidIndex = updatedImages.findIndex(img => !img.error && !img.uploading);
        if (firstValidIndex >= 0) {
          updatedImages[firstValidIndex].isPrimary = true;
        }
      }
      
      onChange(updatedImages);
      
      // Clear progress after short delay
      setTimeout(() => setUploadProgress(null), 1000);
    },
    [images, maxImages, folder, onChange]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      
      if (e.dataTransfer.files?.length) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleRemove = (id: string) => {
    const newImages = images.filter((img) => img.id !== id);
    // #16 fix: If we removed the primary, make the first valid one primary
    if (newImages.length > 0 && !newImages.some((img) => img.isPrimary && !img.error)) {
      const firstValidIndex = newImages.findIndex(img => !img.error && !img.uploading);
      if (firstValidIndex >= 0) {
        newImages[firstValidIndex].isPrimary = true;
      }
    }
    // Reorder
    newImages.forEach((img, index) => {
      img.order = index;
    });
    onChange(newImages);
  };

  const handleSetPrimary = (id: string) => {
    onChange(
      images.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      }))
    );
  };

  // Drag and drop reordering
  const handleDragStart = (index: number) => {
    dragItemRef.current = index;
  };

  const handleDragEnter = (index: number) => {
    setDragOverIndex(index);
  };

  // Retry all failed uploads
  const handleRetryFailed = useCallback(() => {
    // Get indices and remove failed images
    const failedImageIds = images.filter(img => img.error).map(img => img.id);
    const successfulImages = images.filter(img => !img.error);
    
    // Clear failed images from the list
    onChange(successfulImages.map((img, index) => ({ ...img, order: index })));
    
    // Trigger file input to allow user to re-select files
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [images, onChange]);

  // Count failed uploads for retry button
  const failedCount = images.filter(img => img.error).length;

  const handleDragEnd = () => {
    if (dragItemRef.current === null || dragOverIndex === null) {
      setDragOverIndex(null);
      return;
    }

    const newImages = [...images];
    const draggedItem = newImages[dragItemRef.current];
    newImages.splice(dragItemRef.current, 1);
    newImages.splice(dragOverIndex, 0, draggedItem);

    // Update order
    newImages.forEach((img, index) => {
      img.order = index;
    });

    onChange(newImages);
    dragItemRef.current = null;
    setDragOverIndex(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* #7 fix: Truncation Warning */}
      {truncationWarning && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{truncationWarning}</span>
          <button 
            onClick={() => setTruncationWarning(null)}
            className="ml-auto text-amber-600 hover:text-amber-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* #6 fix: Upload Progress Indicator */}
      {uploadProgress && uploadProgress.total > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          {/* Skeleton pulse loader instead of spinner */}
          <span className="w-4 h-4 bg-blue-600 rounded-full animate-pulse" />
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm text-blue-800 mb-1">
              <span>Uploading photos...</span>
              <span>{uploadProgress.completed} of {uploadProgress.total}</span>
            </div>
            <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(uploadProgress.completed / uploadProgress.total) * 100}%` }}
              />
            </div>
          </div>
          {uploadProgress.completed === uploadProgress.total && (
            <CheckCircle className="w-4 h-4 text-green-600" />
          )}
        </div>
      )}

      {/* Retry Failed Uploads Button */}
      {failedCount > 0 && !uploadProgress && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-800 flex-1">
            {failedCount} {failedCount === 1 ? 'photo' : 'photos'} failed to upload
          </span>
          <button
            onClick={handleRetryFailed}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            Remove &amp; Retry
          </button>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-rail-orange bg-rail-orange/5 scale-[1.01]'
            : 'border-slate-300 hover:border-rail-orange hover:bg-slate-50'
          }
          ${images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          disabled={images.length >= maxImages}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        
        <div className="flex flex-col items-center gap-3">
          <div className={`
            w-14 h-14 rounded-full flex items-center justify-center
            ${isDragging ? 'bg-rail-orange/20' : 'bg-slate-100'}
          `}>
            <Upload className={`w-7 h-7 ${isDragging ? 'text-rail-orange' : 'text-slate-500'}`} />
          </div>
          <div>
            <p className="text-lg font-medium text-navy-900">
              {isDragging ? 'Drop images here' : 'Drag & drop images'}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              or click to browse • Max {maxImages} images • {maxFileSize}MB each
            </p>
          </div>
          <p className="text-xs text-slate-400">
            Supports: JPG, PNG, WebP, GIF
          </p>
        </div>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-navy-900">
              {images.length} of {maxImages} images
              {images.filter(img => img.uploading).length > 0 && (
                <span className="text-slate-500 ml-2">
                  ({images.filter(img => img.uploading).length} uploading...)
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500">
              Drag to reorder • Star = Primary image
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                draggable={!image.uploading}
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`
                  relative aspect-square rounded-xl overflow-hidden bg-slate-100 group
                  transition-all duration-200
                  ${dragOverIndex === index ? 'ring-2 ring-rail-orange ring-offset-2' : ''}
                  ${image.uploading ? 'animate-pulse' : 'cursor-grab active:cursor-grabbing'}
                  ${image.error ? 'ring-2 ring-red-500' : ''}
                  ${image.isPrimary ? 'ring-2 ring-rail-orange' : ''}
                `}
              >
                {/* Image */}
                {image.url && !image.error && (
                  <Image
                    src={getImageUrl(image.url)}
                    alt={`Upload ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized={image.url.startsWith('blob:')}
                  />
                )}

                {/* Error State */}
                {image.error && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 p-2">
                    <AlertCircle className="w-8 h-8 text-red-500 mb-1" />
                    <p className="text-xs text-red-600 text-center">{image.error}</p>
                  </div>
                )}

                {/* Loading State */}
                {image.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                    {/* Skeleton pulse dots instead of spinner */}
                    <div className="flex gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rail-orange animate-pulse" style={{ animationDelay: '0ms' }} />
                      <div className="w-2.5 h-2.5 rounded-full bg-rail-orange animate-pulse" style={{ animationDelay: '150ms' }} />
                      <div className="w-2.5 h-2.5 rounded-full bg-rail-orange animate-pulse" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}

                {/* Overlay Actions */}
                {!image.uploading && !image.error && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors">
                    {/* Drag Handle */}
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-1 bg-white/90 rounded">
                        <GripVertical className="w-4 h-4 text-slate-600" />
                      </div>
                    </div>

                    {/* Primary Badge */}
                    {image.isPrimary && (
                      <div className="absolute top-2 right-10 opacity-100">
                        <span className="px-2 py-1 bg-rail-orange text-white text-xs font-medium rounded">
                          Primary
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!image.isPrimary && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetPrimary(image.id);
                          }}
                          className="p-1.5 bg-white/90 hover:bg-white rounded-lg transition-colors"
                          title="Set as primary"
                        >
                          <Star className="w-4 h-4 text-slate-600" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(image.id);
                        }}
                        className="p-1.5 bg-white/90 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Order Number */}
                    <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="px-2 py-1 bg-white/90 text-slate-700 text-xs font-medium rounded">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add More Button */}
            {images.length < maxImages && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-rail-orange hover:bg-slate-50 flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <ImageIcon className="w-8 h-8 text-slate-400" />
                <span className="text-sm text-slate-500">Add More</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
