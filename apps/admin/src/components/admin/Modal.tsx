'use client';

import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 backdrop-blur-sm sm:items-center sm:p-6"
      style={{ background: 'rgba(26, 23, 18, 0.4)' }}
      onClick={onClose}
    >
      <div
        data-testid="modal-panel"
        className="modal-content flex w-full max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl border bg-[var(--surface-card)] shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
        style={{
          maxWidth: modalMaxWidthMap[maxWidth],
          borderColor: 'var(--border-subtle)',
          boxShadow: '0 24px 48px -8px rgba(26, 23, 18, 0.20), 0 0 0 1px rgba(229, 229, 224, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex shrink-0 items-center justify-between overflow-hidden border-b px-5 py-5 sm:px-7 sm:py-6">
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
        <div data-testid="modal-content" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
