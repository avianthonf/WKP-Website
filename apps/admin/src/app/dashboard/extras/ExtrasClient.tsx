'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { extraSchema, ExtraFormData } from '@/lib/validations';
import { Extra } from '@/types';
import { createExtra, updateExtra, deleteExtra, toggleExtraSoldOut } from './actions';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/admin/Modal';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { InlineExtraPrice } from '@/components/admin/InlineExtraPrice';
import { ToggleSoldOut } from '@/components/admin/ToggleSoldOut';

interface ExtrasClientProps {
  initialExtras: Extra[];
  createSignal?: number;
}

export function ExtrasClient({ initialExtras, createSignal }: ExtrasClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExtra, setEditingExtra] = useState<Extra | null>(null);
  const [extras, setExtras] = useState<Extra[]>(initialExtras);
  const createSignalRef = useRef(0);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<ExtraFormData>({
    resolver: zodResolver(extraSchema as any),
    defaultValues: {
      name: '',
      price_small: 0,
      price_medium: 0,
      price_large: 0,
      is_veg: true,
      is_active: true,
      sort_order: 0,
    }
  });

  const openCreateModal = () => {
    setEditingExtra(null);
    reset({
      name: '',
      price_small: 0,
      price_medium: 0,
      price_large: 0,
      is_veg: true,
      is_active: true,
      sort_order: 0,
    });
    setModalOpen(true);
  };

  useEffect(() => {
    if (!createSignal) return;
    if (createSignal !== createSignalRef.current) {
      createSignalRef.current = createSignal;
      openCreateModal();
    }
  }, [createSignal]);

  const openEditModal = (extra: Extra) => {
    setEditingExtra(extra);
    reset({
      name: extra.name,
      price_small: extra.price_small,
      price_medium: extra.price_medium,
      price_large: extra.price_large,
      is_veg: extra.is_veg,
      is_active: extra.is_active,
      sort_order: extra.sort_order,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingExtra(null);
    reset();
  };

  const onSubmit = (data: ExtraFormData) => {
    startTransition(async () => {
      try {
        if (editingExtra) {
          await updateExtra(editingExtra.id, data);
          toast.success('Extra updated');
          setExtras(prev => prev.map(e => e.id === editingExtra.id ? { ...e, ...data } : e));
        } else {
          const result = await createExtra(data);
          if (result.success) {
            toast.success('Extra created');
            router.refresh();
          }
        }
        closeModal();
      } catch (error: any) {
        toast.error(error.message || 'Operation failed');
      }
    });
  };

  const handleDelete = (extra: Extra) => {
    if (!window.confirm(`Delete '${extra.name}'? This cannot be undone.`)) return;

    startTransition(async () => {
      try {
        await deleteExtra(extra.id);
        toast.success(`'${extra.name}' deleted`);
        setExtras(prev => prev.filter(e => e.id !== extra.id));
      } catch (error: any) {
        toast.error(error.message || 'Deletion failed');
      }
    });
  };

  return (
    <div className="space-y-8">
      <section
        className="rounded-3xl border border-[var(--border-default)] bg-white/90 p-5 shadow-sm md:p-6"
        style={{ background: '#fffbeb', borderColor: '#d97706', color: '#92400e' }}
      >
        <div className="text-sm leading-6">
          Extras are chargeable add-on toppings. The price charged depends on the pizza size the customer has chosen.
        </div>
      </section>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Extras</h1>
          <p className="page-subtitle">Configure additional toppings and custom charges.</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus size={16} /> New Extra
        </button>
      </div>

      <section className="rounded-3xl border border-[var(--border-default)] bg-white/90 shadow-sm overflow-hidden">
        <div className="table-wrap border-0 shadow-none">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Veg</th>
              <th>Small ₹</th>
              <th>Medium ₹</th>
              <th>Large ₹</th>
              <th>Sold Out</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {extras.map(extra => (
              <tr key={extra.id}>
                <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{extra.name}</td>
                <td>
                  <span className={`badge ${extra.is_veg ? 'badge-veg' : 'badge-meat'}`}>
                    {extra.is_veg ? 'Veg' : 'Meat'}
                  </span>
                </td>
                <td>
                  <InlineExtraPrice extraId={extra.id} size="small" initialPrice={extra.price_small} />
                </td>
                <td>
                  <InlineExtraPrice extraId={extra.id} size="medium" initialPrice={extra.price_medium} />
                </td>
                <td>
                  <InlineExtraPrice extraId={extra.id} size="large" initialPrice={extra.price_large} />
                </td>
                <td>
                  <ToggleSoldOut
                    id={extra.id}
                    initialSoldOut={extra.is_sold_out}
                    onToggle={toggleExtraSoldOut}
                  />
                </td>
                <td>
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEditModal(extra)} className="icon-btn" style={{ color: '#3b82f6' }}>
                      <Edit size={15} />
                    </button>
                    <button onClick={() => handleDelete(extra)} className="icon-btn danger" disabled={isPending}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {extras.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <Plus size={40} className="empty-state-icon" />
                    <p className="empty-state-text">No extras configured yet.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </section>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingExtra ? 'Edit Extra' : 'New Extra'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ink)' }}>Name</label>
            <input
              {...register('name')}
              placeholder="Extra topping name"
              className="input-base"
            />
            {errors.name && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {(['small', 'medium', 'large'] as const).map(size => (
              <div key={size}>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ink)' }}>
                  {size.charAt(0).toUpperCase() + size.slice(1)} Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--stone)' }}>₹</span>
                  <input
                    type="number"
                    {...register(`price_${size}` as any, { valueAsNumber: true })}
                    className="input-base"
                    style={{ paddingLeft: '1.75rem' }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <input type="checkbox" id="is_veg" {...register('is_veg')} className="w-5 h-5 rounded accent-ember" />
            <label htmlFor="is_veg" className="text-sm font-medium cursor-pointer" style={{ color: 'var(--ink)' }}>
              Vegetarian
            </label>
          </div>

          <div className="flex items-center gap-2.5">
            <input type="checkbox" id="is_active" {...register('is_active')} className="w-5 h-5 rounded accent-ember" />
            <label htmlFor="is_active" className="text-sm font-medium cursor-pointer" style={{ color: 'var(--ink)' }}>
              Active (visible on menu)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ink)' }}>Sort Order</label>
            <input type="number" {...register('sort_order', { valueAsNumber: true })} className="input-base" style={{ width: '8rem' }} />
            <p className="text-xs mt-1" style={{ color: 'var(--stone)' }}>Lower numbers appear first</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
            <button type="button" onClick={closeModal} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? 'Saving...' : (editingExtra ? 'Update Extra' : 'Add Extra')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
