'use client';

import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'md' | 'lg' | 'xl';
}

const modalMaxWidthMap = {
  md: '32rem',
  lg: '42rem',
  xl: '56rem',
} as const;

export function Modal({ open, onClose, title, children, maxWidth = 'lg' }: ModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: 'rgba(26, 23, 18, 0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-full bg-[var(--surface-card)] rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto modal-content border"
        style={{
          maxWidth: modalMaxWidthMap[maxWidth],
          borderColor: 'var(--border-subtle)',
          boxShadow: '0 24px 48px -8px rgba(26, 23, 18, 0.20), 0 0 0 1px rgba(229, 229, 224, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-6 border-b relative overflow-hidden">
          {/* Gradient accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ background: 'linear-gradient(90deg, var(--ember), var(--ember-light))' }}
          />
          <h2
            className="text-xl italic font-semibold"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: 'var(--ember)', lineHeight: 1.2 }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-all hover:scale-110 group"
            style={{
              color: 'var(--stone)',
              background: 'var(--surface-secondary)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-7">
          {children}
        </div>
      </div>
    </div>
  );
}
