'use client';

import React, { useMemo, useRef, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabaseBrowser';
import { Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const MENU_IMAGE_BUCKET = 'menu';

interface MenuImageFieldProps {
  label: string;
  description: string;
  folder: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  previewAlt: string;
}

function sanitizeBaseName(name: string) {
  return name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}

function getFileExtension(name: string) {
  const match = name.match(/\.([^.]+)$/);
  return match ? `.${match[1].toLowerCase()}` : '';
}

export function MenuImageField({
  label,
  description,
  folder,
  value,
  onChange,
  previewAlt,
}: MenuImageFieldProps) {
  const supabase = useMemo(() => createSupabaseBrowser(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const currentValue = value || '';

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const safeName = sanitizeBaseName(file.name) || 'image';
      const path = `${folder}/${Date.now()}-${uniqueId}-${safeName}${getFileExtension(file.name)}`;

      const { error } = await supabase.storage
        .from(MENU_IMAGE_BUCKET)
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });

      if (error) throw error;

      const { data } = supabase.storage.from(MENU_IMAGE_BUCKET).getPublicUrl(path);
      onChange(data.publicUrl);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border-default)] bg-white"
          style={{ boxShadow: 'var(--shadow-sm)' }}
        >
          {currentValue ? (
            <img
              src={currentValue}
              alt={previewAlt}
              className="block h-full w-full max-h-full max-w-full object-cover"
              loading="lazy"
            />
          ) : (
            <ImageIcon size={26} className="text-[var(--stone)]" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: 'var(--ink)' }}>
              {label}
            </label>
            <input
              type="url"
              value={currentValue}
              onChange={(event) => onChange(event.target.value.trim() || null)}
              placeholder="Paste a public Supabase Storage URL or upload a file"
              className="input-base"
            />
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
