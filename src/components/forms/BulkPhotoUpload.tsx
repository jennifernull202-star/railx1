'use client';

import { useState, useCallback, useRef, DragEvent } from 'react';
import Image from 'next/image';
import { Upload, X, GripVertical, Star, Loader2, ImageIcon, AlertCircle } from 'lucide-react';

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
  maxImages?: number;
  maxFileSize?: number; // in MB
  className?: string;
}

export default function BulkPhotoUpload({
  images,
  onChange,
  folder,
  maxImages = 20,
  maxFileSize = 10,
  className = '',
}: BulkPhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragItemRef = useRef<number | null>(null);

  const generateId = () => Math.random().toString(36).substring(2, 9);

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

      // Get presigned URL
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
          folder,
          fileType: 'image',
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to get upload URL');
      }

      // Upload to S3
      const uploadResponse = await fetch(data.data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload to S3');
      }

      return { url: data.data.fileUrl };
    } catch (error) {
      return { url: '', error: error instanceof Error ? error.message : 'Upload failed' };
    }
  };

  const handleFiles = useCallback(
    async (files: FileList) => {
      const fileArray = Array.from(files).slice(0, maxImages - images.length);
      
      if (fileArray.length === 0) return;

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

      // Upload files in parallel
      const uploadPromises = fileArray.map(async (file, index) => {
        const result = await uploadFile(file);
        return { index, result };
      });

      const results = await Promise.all(uploadPromises);

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
      
      onChange(updatedImages);
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
    // If we removed the primary, make the first one primary
    if (newImages.length > 0 && !newImages.some((img) => img.isPrimary)) {
      newImages[0].isPrimary = true;
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
                    src={image.url}
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
                    <Loader2 className="w-8 h-8 text-rail-orange animate-spin" />
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
