'use client';

import React, { useTransition } from 'react';
import { toast } from 'react-hot-toast';

interface ToggleSoldOutProps {
  id: string;
  initialSoldOut: boolean;
  onToggle: (id: string, currentState: boolean) => Promise<{ success: boolean }>;
}

export function ToggleSoldOut({ id, initialSoldOut, onToggle }: ToggleSoldOutProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await onToggle(id, initialSoldOut);
        toast.success(`Marked as ${initialSoldOut ? 'available' : 'sold out'}`);
      } catch (error) {
        toast.error('Failed to update status');
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`toggle-track ${initialSoldOut ? 'sold-out' : ''} ${isPending ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2`}
      title={initialSoldOut ? 'Mark as available' : 'Mark as sold out'}
    >
      <span className="sr-only">Toggle sold out status</span>
      <span aria-hidden="true" className="toggle-knob" />
    </button>
  );
}
