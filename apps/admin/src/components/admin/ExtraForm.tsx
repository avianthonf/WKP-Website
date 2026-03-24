'use client';

import { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { extraSchema, ExtraFormData } from '@/lib/validations';

interface ExtraFormProps {
  onSubmitAction: (data: ExtraFormData) => Promise<{ success: boolean }>;
  initialData?: Partial<ExtraFormData>;
  isEdit?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

export function ExtraForm({ onSubmitAction, initialData, isEdit, submitLabel, onCancel }: ExtraFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExtraFormData>({
    resolver: zodResolver(extraSchema as any),
    defaultValues: initialData || {
      name: '',
      price_small: 0,
      price_medium: 0,
      price_large: 0,
      is_veg: true,
      is_active: true,
      sort_order: 0,
    },
  });

  useEffect(() => {
    if (!initialData) return;
    reset({
      name: '',
      price_small: 0,
      price_medium: 0,
      price_large: 0,
      is_veg: true,
      is_active: true,
      sort_order: 0,
      ...initialData,
    });
  }, [initialData, reset]);

  const onSubmit = (data: ExtraFormData) => {
    startTransition(async () => {
      try {
        await onSubmitAction(data);
        toast.success(isEdit ? 'Extra updated' : 'Extra created');
        router.refresh();
        onCancel?.();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Operation failed';
        toast.error(message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-1.5">
        <label className="block text-sm font-medium" style={{ color: 'var(--ink)' }}>
          Extra name
        </label>
        <input {...register('name')} placeholder="Extra topping name" className="input-base" />
        {errors.name && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.name.message}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {(['small', 'medium', 'large'] as const).map((size) => (
          <div key={size} className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: 'var(--ink)' }}>
              {size.charAt(0).toUpperCase() + size.slice(1)} price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--stone)' }}>
                ₹
              </span>
              <input
                type="number"
                {...register(`price_${size}` as const, { valueAsNumber: true })}
                className="input-base"
                style={{ paddingLeft: '1.75rem' }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-2.5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-secondary)] px-4 py-3">
          <input type="checkbox" {...register('is_veg')} className="w-5 h-5 rounded accent-ember" />
          <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            Vegetarian
          </span>
        </label>

        <label className="flex items-center gap-2.5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-secondary)] px-4 py-3">
          <input type="checkbox" {...register('is_active')} className="w-5 h-5 rounded accent-ember" />
          <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            Active
          </span>
        </label>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium" style={{ color: 'var(--ink)' }}>
          Sort order
        </label>
        <input type="number" {...register('sort_order', { valueAsNumber: true })} className="input-base" style={{ width: '8rem' }} />
      </div>

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end" style={{ borderColor: 'var(--border-default)' }}>
        <button type="button" onClick={onCancel || (() => router.back())} className="btn-ghost w-full sm:w-auto">
          Cancel
        </button>
        <button type="submit" disabled={isPending} className="btn-primary w-full sm:w-auto">
          {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
          {submitLabel || (isEdit ? 'Update Extra' : 'Add Extra')}
        </button>
      </div>
    </form>
  );
}
