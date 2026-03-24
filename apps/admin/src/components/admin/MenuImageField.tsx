'use client';

import React, { useRef, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { uploadStorefrontAsset } from '@/app/dashboard/settings/actions';

const MAX_UPLOAD_SIZE_BYTES = 16 * 1024 * 1024;

interface MenuImageFieldProps {
  label: string;
  description: string;
  folder: string;
  bucket?: 'brand-assets' | 'menu';
  value: string | null | undefined;
  onChange: (value: string | null) => void;
}

export function MenuImageField({
  label,
  description,
  folder,
  bucket = 'brand-assets',
  value,
  onChange,
}: MenuImageFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const currentValue = value || '';

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      toast.error('Please choose an image smaller than 16 MB');
      event.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('bucket', bucket);

      const { publicUrl } = await uploadStorefrontAsset(formData);
      onChange(publicUrl);
      toast.success('Image uploaded');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload image';
      toast.error(message);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <section className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-secondary)] p-4">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium" style={{ color: 'var(--ink)' }}>
            {label}
          </label>
          {currentValue ? (
            <a
              href={currentValue}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--border-default)] bg-white px-3 py-2 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--ember)] hover:text-[var(--ember)]"
            >
              <span className="truncate">Open uploaded image</span>
            </a>
          ) : (
            <p className="text-sm" style={{ color: 'var(--stone)' }}>
              Upload an image to generate a link.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={isUploading}
            className="btn-ghost inline-flex items-center gap-2"
            style={{ borderColor: 'var(--border-default)' }}
          >
            {isUploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            <span>{currentValue ? 'Replace image' : 'Upload image'}</span>
          </button>

          {currentValue && (
            <button
              type="button"
              onClick={handleClear}
              className="btn-ghost inline-flex items-center gap-2"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <X size={15} />
              <span>Remove image</span>
            </button>
          )}
        </div>

        <p className="text-xs leading-5" style={{ color: 'var(--stone)' }}>
          {description}
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </section>
  );
}
