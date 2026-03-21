'use client';

import { useState, useTransition } from 'react';
import { toast } from 'react-hot-toast';

interface InlineSimplePriceProps {
  itemId: string;
  initialPrice: number;
  onSave: (id: string, price: number) => Promise<void>;
}

export default function InlineSimplePrice({ itemId, initialPrice, onSave }: InlineSimplePriceProps) {
  const [price, setPrice] = useState(initialPrice);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isPending, startTransition] = useTransition();

  const handleBlur = async () => {
    if (price === initialPrice) return;
    if (price < 0) {
      toast.error('Price cannot be negative');
      setPrice(initialPrice);
      return;
    }

    setStatus('saving');
    startTransition(async () => {
      try {
        await onSave(itemId, price);
        setStatus('saved');
        toast.success('Price updated');
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
    <div className="flex flex-col gap-0.5">
      <div className="relative">
        <span
          className="absolute left-2 top-1/2 -translate-y-1/2 text-xs"
          style={{ color: 'var(--stone)' }}
        >
          ₹
        </span>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          onBlur={handleBlur}
          className="w-16 h-8 pl-5 pr-2 text-right font-mono rounded-lg outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          style={{
            fontSize: 'var(--text-sm)',
            border: '1px solid transparent',
            background: 'transparent',
            color: 'var(--ink)',
          }}
        />
      </div>
      {status !== 'idle' && (
        <span
          className="text-xs font-bold px-1 animate-fade-in"
          style={{
            color: status === 'saving' ? 'var(--stone)' : status === 'saved' ? '#16a34a' : '#ef4444',
          }}
        >
          {status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved' : 'Failed'}
        </span>
      )}
    </div>
  );
}
