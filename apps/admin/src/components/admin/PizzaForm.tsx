'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pizzaSchema, PizzaFormData } from '@/lib/validations';
import { Category, Topping } from '@/types';
import { useEffect, useTransition } from 'react';
import { Loader2, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { MenuImageField } from '@/components/admin/MenuImageField';

interface PizzaFormProps {
  categories: Category[];
  toppings: Topping[];
  onSubmitAction: (data: PizzaFormData) => Promise<{ success: boolean; id?: string }>;
  initialData?: Partial<PizzaFormData>;
  isEdit?: boolean;
  compact?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
}

export function PizzaForm({
  categories,
  toppings,
  onSubmitAction,
  initialData,
  isEdit,
  compact = false,
  submitLabel,
  onCancel,
}: PizzaFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors }
  } = useForm<PizzaFormData>({
    resolver: zodResolver(pizzaSchema as any),
    defaultValues: initialData || {
      is_veg: true,
      is_active: true,
      is_bestseller: false,
      is_spicy: false,
      is_new: false,
      image_url: null,
      sort_order: 0,
      toppings: []
    }
  });

  const imageUrl = watch('image_url');
  const selectedToppings = watch('toppings') || [];

  useEffect(() => {
    if (!initialData) return;
    reset({
      is_veg: true,
      is_active: true,
      is_bestseller: false,
      is_spicy: false,
      is_new: false,
      image_url: null,
      sort_order: 0,
      toppings: [],
      ...initialData,
    });
  }, [initialData, reset]);

  const onFormSubmit = (data: PizzaFormData) => {
    startTransition(async () => {
      try {
        await onSubmitAction(data);
        toast.success(isEdit ? 'Pizza updated' : 'Pizza created');
        if (!compact) {
          router.push('/dashboard/pizzas');
        }
        router.refresh();
        if (compact && onCancel) onCancel();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Operation failed';
        toast.error(message);
      }
    });
  };

  const groupedToppings = toppings.reduce((acc, t) => {
    const cat = t.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {} as Record<string, Topping[]>);

  const flags = [
    { label: 'Bestseller', key: 'is_bestseller' },
    { label: 'Spicy', key: 'is_spicy' },
    { label: 'New Badge', key: 'is_new' },
    { label: 'Active', key: 'is_active' },
  ] as const;

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className={`space-y-8 max-w-4xl animate-fade-in ${compact ? '' : 'pb-24'}`}>

      {/* 1. BASIC INFO */}
      <fieldset className="space-y-5">
        <legend className="mono-label w-full pb-2" style={{ borderBottom: '1px solid var(--border-default)' }}>
          1. Basic Information
        </legend>
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Pizza Name</label>
            <input
              {...register('name')}
              placeholder="e.g. Margherita Artisanal"
              className="input-base"
              style={errors.name ? { borderColor: '#ef4444', boxShadow: '0 0 0 3px rgba(239,68,68,0.1)' } : undefined}
            />
            {errors.name && <span className="text-xs font-bold" style={{ color: '#ef4444' }}>{errors.name.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Description</label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Describe the artisanal flavors and ingredients..."
              className="input-base resize-none"
              style={{ height: 'auto', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
            />
          </div>
        </div>
      </fieldset>

      {/* 2. CATEGORY & PRICING */}
      <fieldset className="space-y-5">
        <legend className="mono-label w-full pb-2" style={{ borderBottom: '1px solid var(--border-default)' }}>
          2. Category & Pricing
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Menu Category</label>
            <select
              {...register('category_id')}
              className="input-base"
              style={{ appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%238C7E6A' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center' }}
            >
              <option value="">Select a category</option>
              {categories.filter(c => c.type === 'pizza').map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
            {errors.category_id && <span className="text-xs font-bold" style={{ color: '#ef4444' }}>Required</span>}
          </div>

          <div className="flex items-center gap-2.5 self-end pb-1">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                id="is_veg"
                {...register('is_veg')}
                className="peer h-5 w-5 appearance-none rounded border transition-all cursor-pointer"
                style={{ borderColor: 'var(--border-default)', background: 'var(--surface-primary)' }}
              />
              <Check className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none left-1 top-1" />
            </div>
            <label htmlFor="is_veg" className="text-sm font-medium cursor-pointer" style={{ color: 'var(--ink)' }}>
              Vegetarian Selection
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <div key={size} className="flex flex-col gap-1.5">
              <label className="mono-label">{size} Price (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--stone)' }}>₹</span>
                <input
                  type="number"
                  {...register(`price_${size}`, { valueAsNumber: true })}
                  className="input-base"
                  style={{ paddingLeft: '1.75rem' }}
                />
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      {/* 3. IMAGE */}
      <fieldset className="space-y-5">
        <legend className="mono-label w-full pb-2" style={{ borderBottom: '1px solid var(--border-default)' }}>
          3. Visual Representation
        </legend>
        <MenuImageField
          label="Pizza photo"
          description="Shown on the storefront menu cards, item detail page, builder preview, and any featured pizza panels."
          folder="pizzas"
          bucket="menu"
          value={imageUrl}
          onChange={(next) => setValue('image_url', next, { shouldDirty: true, shouldValidate: true })}
        />
      </fieldset>

      {/* 4. TOPPINGS */}
      <fieldset className="space-y-5">
        <legend className="mono-label w-full pb-2" style={{ borderBottom: '1px solid var(--border-default)' }}>
          4. Included Toppings
        </legend>
        <p className="text-sm" style={{ color: 'var(--stone)' }}>
          Listed on the pizza card as default components — no extra charge.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.keys(groupedToppings).map(category => (
            <div key={category} className="space-y-2">
              <h4 className="mono-label" style={{ color: 'var(--ember)' }}>{category}</h4>
              <div className="space-y-0.5">
                {groupedToppings[category].map(t => (
                  <label
                    key={t.id}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer transition-all"
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div className="relative flex h-5 w-5 items-center justify-center shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedToppings.includes(t.id)}
                        onChange={(e) => {
                          const current = [...selectedToppings];
                          if (e.target.checked) {
                            setValue('toppings', [...current, t.id]);
                          } else {
                            setValue('toppings', current.filter(id => id !== t.id));
                          }
                        }}
                        className="peer h-5 w-5 appearance-none rounded border transition-all cursor-pointer"
                        style={{
                          borderColor: selectedToppings.includes(t.id) ? 'var(--ember)' : 'var(--border-default)',
                          background: selectedToppings.includes(t.id) ? 'var(--ember)' : 'var(--surface-primary)',
                        }}
                      />
                      <Check className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                    <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{t.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      {/* 5. FLAGS & SORT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <fieldset className="space-y-5">
          <legend className="mono-label w-full pb-2" style={{ borderBottom: '1px solid var(--border-default)' }}>
            5. Operational Flags
          </legend>
          <div className="flex flex-wrap gap-2">
            {flags.map(flag => (
              <label
                key={flag.key}
                className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all"
                style={{ border: '1px solid var(--border-default)', background: 'var(--surface-primary)' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(232,84,10,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
              >
                <input
                  type="checkbox"
                  {...register(flag.key)}
                  className="w-4 h-4 rounded accent-ember cursor-pointer"
                />
                <span className="text-xs font-medium" style={{ color: 'var(--ink)' }}>{flag.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-5">
          <legend className="mono-label w-full pb-2" style={{ borderBottom: '1px solid var(--border-default)' }}>
            6. Orchestration
          </legend>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Sort Order</label>
            <input
              type="number"
              {...register('sort_order', { valueAsNumber: true })}
              className="input-base w-full sm:w-32"
            />
            <p className="text-xs" style={{ color: 'var(--stone)' }}>Lower digits appear first in the public catalog.</p>
          </div>
        </fieldset>
      </div>

      {/* SUBMIT BAR */}
      {compact ? (
        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:justify-end" style={{ borderColor: 'var(--border-default)' }}>
          <button
            type="button"
            onClick={onCancel || (() => router.back())}
            className="btn-ghost w-full sm:w-auto"
            style={{ height: '3rem', padding: '0 2rem', fontWeight: 600 }}
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary w-full sm:w-auto"
            style={{ height: '3rem', padding: '0 3rem' }}
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            {submitLabel || (isEdit ? 'Update Pizza' : 'Add Pizza to Menu')}
          </button>
        </div>
      ) : (
        <div
          className="fixed inset-x-0 bottom-0 z-40 flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:justify-end sm:px-6 lg:px-8"
          style={{
            background: 'rgba(245, 240, 232, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderTop: '1px solid var(--border-default)',
          }}
        >
          <button
            type="button"
            onClick={onCancel || (() => router.back())}
            className="btn-ghost w-full sm:w-auto"
            style={{ height: '3rem', padding: '0 2rem', fontWeight: 600 }}
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary w-full sm:w-auto"
            style={{ height: '3rem', padding: '0 3rem' }}
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            {submitLabel || (isEdit ? 'Update Pizza' : 'Add Pizza to Menu')}
          </button>
        </div>
      )}
    </form>
  );
}
