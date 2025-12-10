/**
 * THE RAIL EXCHANGE™ — Image Upload Component
 * 
 * Premium drag-and-drop image uploader with preview, validation, and S3 integration.
 * Supports multiple images with reordering capability.
 */

'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface UploadedImage {
  url: string;
  key?: string;
  alt?: string;
  isPrimary?: boolean;
}

export interface ImageUploadProps {
  label: string;
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  maxSizeInMB?: number;
  acceptedTypes?: string[];
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  folder?: 'contractors' | 'listings' | 'documents' | 'avatars';
  subfolder?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  value = [],
  onChange,
  maxImages = 10,
  maxSizeInMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  error,
  helperText,
  required,
  disabled,
  className,
  folder = 'listings',
  subfolder,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Invalid file type. Accepted: ${acceptedTypes.map(t => t.split('/')[1]).join(', ')}`;
    }
    if (file.size > maxSizeInMB * 1024 * 1024) {
      return `File too large. Maximum size: ${maxSizeInMB}MB`;
    }
    return null;
  };

  const uploadFile = async (file: File): Promise<UploadedImage | null> => {
    try {
      // Get presigned URL with all required fields
      const presignRes = await fetch('/api/upload', {
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

      if (!presignRes.ok) {
        const errorData = await presignRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      const result = await presignRes.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to get upload URL');
      }

      const { uploadUrl, fileUrl, key } = result.data;

      // Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error('Failed to upload file');

      return {
        url: fileUrl,
        key,
        alt: file.name,
        isPrimary: value.length === 0,
      };
    } catch (err) {
      console.error('Upload error:', err);
      return null;
    }
  };

  const handleFiles = async (files: FileList | File[]) => {
    if (disabled) return;

    const fileArray = Array.from(files);
    const remainingSlots = maxImages - value.length;
    
    if (remainingSlots <= 0) {
      setUploadError(`Maximum ${maxImages} images allowed`);
      return;
    }

    const filesToUpload = fileArray.slice(0, remainingSlots);
    
    // Validate all files
    for (const file of filesToUpload) {
      const error = validateFile(file);
      if (error) {
        setUploadError(error);
        return;
      }
    }

    setUploading(true);
    setUploadError(null);

    const uploadedImages: UploadedImage[] = [];

    for (const file of filesToUpload) {
      const result = await uploadFile(file);
      if (result) {
        uploadedImages.push(result);
      }
    }

    if (uploadedImages.length > 0) {
      onChange([...value, ...uploadedImages]);
    }

    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (index: number) => {
    const newImages = value.filter((_, i) => i !== index);
    // If removed image was primary, make first image primary
    if (value[index].isPrimary && newImages.length > 0) {
      newImages[0].isPrimary = true;
    }
    onChange(newImages);
  };

  const setPrimaryImage = (index: number) => {
    const newImages = value.map((img, i) => ({
      ...img,
      isPrimary: i === index,
    }));
    onChange(newImages);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className={cn(
        "text-sm font-medium text-navy-900",
        (error || uploadError) && "text-status-error"
      )}>
        {label}
        {required && <span className="text-status-error ml-1">*</span>}
      </label>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer",
          "transition-all duration-200",
          isDragging ? "border-rail-orange bg-rail-orange/5" : "border-surface-border",
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-rail-orange/50",
          (error || uploadError) && "border-status-error"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          multiple
          onChange={handleInputChange}
          disabled={disabled || uploading}
          className="hidden"
        />
        
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-rail-orange border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-text-secondary">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center">
              <svg className="w-6 h-6 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-navy-900">
                Drop images here or <span className="text-rail-orange">browse</span>
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                {acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} up to {maxSizeInMB}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Image Previews */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
          {value.map((image, index) => (
            <div
              key={image.url}
              className={cn(
                "relative aspect-square rounded-lg overflow-hidden border-2 group",
                image.isPrimary ? "border-rail-orange" : "border-surface-border"
              )}
            >
              <Image
                src={image.url}
                alt={image.alt || `Image ${index + 1}`}
                fill
                className="object-cover"
              />
              
              {/* Primary Badge */}
              {image.isPrimary && (
                <div className="absolute top-2 left-2 bg-rail-orange text-white text-xs font-medium px-2 py-0.5 rounded">
                  Primary
                </div>
              )}

              {/* Actions Overlay */}
              <div className="absolute inset-0 bg-navy-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!image.isPrimary && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPrimaryImage(index);
                    }}
                    className="h-8 text-xs"
                  >
                    Set Primary
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Counter */}
      <div className="flex justify-between text-xs text-text-tertiary">
        <span>{value.length} of {maxImages} images</span>
      </div>

      {/* Error/Helper Text */}
      {(error || uploadError) && (
        <p className="text-sm text-status-error">{error || uploadError}</p>
      )}
      {helperText && !error && !uploadError && (
        <p className="text-sm text-text-tertiary">{helperText}</p>
      )}
    </div>
  );
};

export { ImageUpload };
