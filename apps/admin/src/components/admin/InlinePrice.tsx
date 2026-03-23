'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updatePizzaPrice } from '@/app/dashboard/pizzas/actions';
import { Size } from '@/types';
import { toast } from 'react-hot-toast';

interface InlinePriceProps {
  pizzaId: string;
  size: Size;
  initialPrice: number;
}

export function InlinePrice({ pizzaId, size, initialPrice }: InlinePriceProps) {
  const [price, setPrice] = useState(initialPrice);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setPrice(initialPrice);
  }, [initialPrice]);

  const handleBlur = async () => {
    if (price === initialPrice) return;
    if (price < 1) {
      toast.error('Price must be at least 1');
      setPrice(initialPrice);
      return;
    }

    setStatus('saving');
    startTransition(async () => {
      try {
        await updatePizzaPrice(pizzaId, size, price);
        setStatus('saved');
        toast.success(`${size.charAt(0).toUpperCase() + size.slice(1)} price updated`);
        router.refresh();
        setTimeout(() => setStatus('idle'), 3000);
      } catch (error) {
        setStatus('error');
        toast.error('Failed to update price');
        setPrice(initialPrice);
        setTimeout(() => setStatus('idle'), 3000);
      }
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="relative group">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium mono-label"
          style={{ color: 'var(--stone)' }}
        >
          ₹
        </span>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          onBlur={handleBlur}
          className="w-[5rem] sm:w-[6rem] h-9 pl-6 pr-3 text-right font-mono rounded-lg outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            border: '1.5px solid var(--border-default)',
            background: 'var(--surface-primary)',
            color: 'var(--ink)',
            borderRadius: 'var(--radius-md)',
            transition: 'all 0.2s var(--ease-out)',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'var(--ember)';
            e.currentTarget.style.boxShadow = '0 0 0 4px var(--ember-light), 0 0 0 2px rgba(232,84,10,0.1)';
            e.currentTarget.style.background = 'var(--surface-secondary)';
          }}
          onBlurCapture={e => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.background = 'var(--surface-primary)';
          }}
        />
        {/* Hover glow effect */}
        <div
          className="absolute inset-0 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: 'radial-gradient(circle at center, var(--ember-light) 0%, transparent 70%)',
            mixBlendMode: 'soft-light'
          }}
        />
      </div>
      {status !== 'idle' && (
        <span
          className="text-xs font-semibold px-1 animate-fade-in flex items-center gap-1"
          style={{
            color: status === 'saving' ? 'var(--stone)' : status === 'saved' ? 'var(--success)' : 'var(--danger)',
          }}
        >
          {status === 'saving' && (
            <div className="w-2 h-2 rounded-full" style={{ background: 'currentColor', animation: 'pulse-subtle 1.5s infinite' }} />
          )}
          {status === 'saved' && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <path d="M9 .5L3.8 8.2.5 5C.2 4.7 0 4.7 0 5s.2.3.5.5l2.2 2.2L9 .5z" fill="currentColor"/>
            </svg>
          )}
          {status === 'error' && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <path d="M9 .5L5.5 5 1 .5.5 1 5 8 .5 9 .9 5.8 9.5 9z" fill="currentColor"/>
            </svg>
          )}
          {status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved' : 'Failed'}
        </span>
      )}
    </div>
  );
}
