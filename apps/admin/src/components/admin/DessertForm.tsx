'use client';

import { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { dessertSchema, DessertFormData } from '@/lib/validations';
import { MenuImageField } from '@/components/admin/MenuImageField';

interface DessertFormProps {
  onSubmitAction: (data: DessertFormData) => Promise<{ success: boolean }>;
  initialData?: Partial<DessertFormData>;
  isEdit?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

export function DessertForm({ onSubmitAction, initialData, isEdit, submitLabel, onCancel }: DessertFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DessertFormData>({
    resolver: zodResolver(dessertSchema as any),
    defaultValues: initialData || {
      name: '',
      description: '',
      price: 0,
      image_url: null,
      is_veg: true,
      is_active: true,
      sort_order: 0,
    },
  });

  const imageUrl = watch('image_url');

  useEffect(() => {
    if (!initialData) return;
    reset({
      name: '',
      description: '',
      price: 0,
      image_url: null,
      is_veg: true,
      is_active: true,
      sort_order: 0,
      ...initialData,
    });
  }, [initialData, reset]);

  const onSubmit = (data: DessertFormData) => {
    startTransition(async () => {
      try {
        await onSubmitAction(data);
        toast.success(isEdit ? 'Dessert updated' : 'Dessert created');
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
        <label htmlFor="dessert-name" className="block text-sm font-medium" style={{ color: 'var(--ink)' }}>
          Name
        </label>
        <input
          id="dessert-name"
          {...register('name')}
          placeholder="Brownie, Cheesecake, etc."
          className="input-base"
        />
        {errors.name && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="dessert-description" className="block text-sm font-medium" style={{ color: 'var(--ink)' }}>
          Description <span className="text-xs font-normal" style={{ color: 'var(--stone)' }}>(optional)</span>
        </label>
        <textarea
          id="dessert-description"
          {...register('description')}
          rows={2}
          placeholder="Brief description shown on the menu card"
          className="input-base resize-none"
          style={{ height: 'auto', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
        />
        {errors.description && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.description.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="dessert-price" className="block text-sm font-medium" style={{ color: 'var(--ink)' }}>
          Price (₹)
        </label>
        <div className="relative max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--stone)' }}>₹</span>
          <input
            id="dessert-price"
            type="number"
            {...register('price', { valueAsNumber: true })}
            className="input-base"
            style={{ paddingLeft: '1.75rem' }}
          />
        </div>
        {errors.price && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.price.message}</p>}
      </div>

      <MenuImageField
        label="Dessert photo"
        description="Shown on dessert cards and dessert detail pages across the storefront."
        folder="desserts"
        bucket="menu"
        value={imageUrl ?? null}
        onChange={(next) => setValue('image_url', next, { shouldDirty: true, shouldValidate: true })}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2.5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-secondary)] px-4 py-3">
          <input type="checkbox" {...register('is_veg')} className="w-5 h-5 rounded accent-ember" />
          <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            Vegetarian
          </span>
        </label>

        <label className="flex items-center gap-2.5 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-secondary)] px-4 py-3">
          <input type="checkbox" {...register('is_active')} className="w-5 h-5 rounded accent-ember" />
          <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            Active (visible on menu)
          </span>
        </label>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="dessert-sort-order" className="block text-sm font-medium" style={{ color: 'var(--ink)' }}>
          Sort order
        </label>
        <input
          id="dessert-sort-order"
          type="number"
          {...register('sort_order', { valueAsNumber: true })}
          className="input-base"
          style={{ width: '8rem' }}
        />
        <p className="text-xs mt-1" style={{ color: 'var(--stone)' }}>Lower numbers appear first in the menu</p>
        {errors.sort_order && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.sort_order.message}</p>}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end" style={{ borderColor: 'var(--border-default)' }}>
        <button type="button" onClick={onCancel || (() => router.back())} className="btn-ghost w-full sm:w-auto">
          Cancel
        </button>
        <button type="submit" disabled={isPending} className="btn-primary w-full sm:w-auto">
          {isPending ? <Loader2 size={16} className="animate-spin" /> : null}
          {submitLabel || (isEdit ? 'Update Dessert' : 'Add Dessert')}
        </button>
      </div>
    </form>
  );
}
