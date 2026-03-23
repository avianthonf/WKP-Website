'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface ToggleSoldOutProps {
  id: string;
  initialSoldOut: boolean;
  onToggle: (id: string, currentState: boolean) => Promise<{ success: boolean }>;
}

export function ToggleSoldOut({ id, initialSoldOut, onToggle }: ToggleSoldOutProps) {
  const [isPending, startTransition] = useTransition();
  const [isSoldOut, setIsSoldOut] = useState(initialSoldOut);
  const router = useRouter();

  useEffect(() => {
    setIsSoldOut(initialSoldOut);
  }, [initialSoldOut]);

  const handleToggle = () => {
    const nextState = !isSoldOut;
    setIsSoldOut(nextState);
    startTransition(async () => {
      try {
        await onToggle(id, isSoldOut);
        toast.success(`Marked as ${isSoldOut ? 'available' : 'sold out'}`);
        router.refresh();
      } catch (error) {
        setIsSoldOut((current) => !current);
        toast.error('Failed to update status');
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`toggle-track ${isSoldOut ? 'sold-out' : ''} ${isPending ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2`}
      title={isSoldOut ? 'Mark as available' : 'Mark as sold out'}
    >
      <span className="sr-only">Toggle sold out status</span>
      <span aria-hidden="true" className="toggle-knob" />
    </button>
  );
}
