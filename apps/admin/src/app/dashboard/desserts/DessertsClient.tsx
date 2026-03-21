'use client';

import React, { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dessertSchema, DessertFormData } from '@/lib/validations';
import { Dessert } from '@/types';
import { createDessert, updateDessert, deleteDessert, toggleDessertSoldOut } from './actions';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/admin/Modal';
import { ToggleSoldOut } from '@/components/admin/ToggleSoldOut';
import { Plus, Edit, Trash2, Cookie } from 'lucide-react';
import { MenuImageField } from '@/components/admin/MenuImageField';

interface DessertsClientProps {
  initialDesserts: Dessert[];
  createSignal?: number;
}

export function DessertsClient({ initialDesserts, createSignal }: DessertsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDessert, setEditingDessert] = useState<Dessert | null>(null);
  const [desserts, setDesserts] = useState<Dessert[]>(initialDesserts);
  const createSignalRef = useRef(0);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<DessertFormData>({
    resolver: zodResolver(dessertSchema as any),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      image_url: null,
      is_veg: true,
      is_active: true,
      sort_order: 0,
    }
  });

  const imageUrl = watch('image_url');

  const openCreateModal = useCallback(() => {
    setEditingDessert(null);
    reset({
      name: '',
      description: '',
      price: 0,
      image_url: null,
      is_veg: true,
      is_active: true,
      sort_order: 0,
    });
    setModalOpen(true);
  }, [reset]);

  useEffect(() => {
    if (!createSignal) return;
    if (createSignal !== createSignalRef.current) {
      createSignalRef.current = createSignal;
      openCreateModal();
    }
  }, [createSignal, openCreateModal]);

  const openEditModal = (dessert: Dessert) => {
    setEditingDessert(dessert);
    reset({
      name: dessert.name,
      description: dessert.description || '',
      price: dessert.price,
      image_url: dessert.image_url || null,
      is_veg: dessert.is_veg,
      is_active: dessert.is_active,
      sort_order: dessert.sort_order,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingDessert(null);
    reset();
  };

  const onSubmit = (data: DessertFormData) => {
    startTransition(async () => {
      try {
        if (editingDessert) {
          await updateDessert(editingDessert.id, data);
          toast.success('Dessert updated');
          setDesserts(prev => prev.map(d => d.id === editingDessert.id ? { ...d, ...data } : d));
        } else {
          const result = await createDessert(data);
          if (result.success) {
            toast.success('Dessert created');
            router.refresh();
          }
        }
        closeModal();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Operation failed';
        toast.error(message);
      }
    });
  };

  const handleDelete = (dessert: Dessert) => {
    if (!window.confirm(`Delete '${dessert.name}'? This cannot be undone.`)) return;

    startTransition(async () => {
      try {
        await deleteDessert(dessert.id);
        toast.success(`'${dessert.name}' deleted`);
        setDesserts(prev => prev.filter(d => d.id !== dessert.id));
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Deletion failed';
        toast.error(message);
      }
    });
  };

  return (
    <div className="space-y-8">
      <section
        className="rounded-3xl border border-[var(--border-default)] bg-white/90 p-5 shadow-sm md:p-6"
        style={{ background: '#fce7f3', borderColor: '#db2777', color: '#9f1239' }}
      >
        <div className="text-sm leading-6">
          Desserts are sweet items served after the main meal. Single flat price, has its own image.
        </div>
      </section>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Desserts</h1>
          <p className="page-subtitle">Manage sweet endings and confectionery items.</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus size={16} /> New Dessert
        </button>
      </div>

      <section className="rounded-3xl border border-[var(--border-default)] bg-white/90 shadow-sm overflow-hidden">
        <div className="table-wrap border-0 shadow-none">
        <table>
          <thead>
            <tr>
              <th style={{ width: '4rem' }}></th>
              <th>Product</th>
              <th>Price ₹</th>
              <th>Veg</th>
              <th>Sold Out</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {desserts.map(dessert => (
              <tr key={dessert.id}>
                <td>
                  <div
                    className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center shrink-0"
                    style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-default)' }}
                  >
                    {dessert.image_url ? (
                      <img src={dessert.image_url} alt={dessert.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <Cookie size={16} style={{ color: 'var(--stone)' }} />
                    )}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{dessert.name}</div>
                  {dessert.description && (
                    <div className="text-xs truncate" style={{ color: 'var(--stone)', maxWidth: '16rem' }}>
                      {dessert.description}
                    </div>
                  )}
                </td>
                <td>
                  <span className="font-mono font-bold" style={{ color: 'var(--ember)' }}>₹{dessert.price}</span>
                </td>
                <td>
                  <span className={`badge ${dessert.is_veg ? 'badge-veg' : 'badge-meat'}`}>
                    {dessert.is_veg ? 'Veg' : 'Non-Veg'}
                  </span>
                </td>
                <td>
                  <ToggleSoldOut
                    id={dessert.id}
                    initialSoldOut={dessert.is_sold_out}
                    onToggle={toggleDessertSoldOut}
                  />
                </td>
                <td>
                  <span className={`badge ${dessert.is_active ? 'badge-active' : 'badge-inactive'}`}>
                    {dessert.is_active ? 'Active' : 'Hidden'}
                  </span>
                </td>
                <td>
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEditModal(dessert)} className="icon-btn" style={{ color: '#3b82f6' }}>
                      <Edit size={15} />
                    </button>
                    <button onClick={() => handleDelete(dessert)} className="icon-btn danger" disabled={isPending}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {desserts.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <Cookie size={40} className="empty-state-icon" />
                    <p className="empty-state-text">No desserts configured yet.</p>
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
        title={editingDessert ? 'Edit Dessert' : 'New Dessert'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ink)' }}>Name</label>
            <input
              {...register('name')}
              placeholder="Dessert name"
              className="input-base"
            />
            {errors.name && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ink)' }}>Description</label>
            <textarea
              {...register('description')}
              rows={2}
              placeholder="Brief description (optional)"
              className="input-base resize-none"
              style={{ height: 'auto', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ink)' }}>Price (₹)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--stone)' }}>₹</span>
              <input
                type="number"
                {...register('price', { valueAsNumber: true })}
                className="input-base"
                style={{ paddingLeft: '1.75rem' }}
              />
            </div>
          </div>

          <MenuImageField
            label="Dessert photo"
            description="Shown on dessert cards and dessert detail pages across the storefront."
            folder="desserts"
            value={imageUrl}
            onChange={(next) => setValue('image_url', next, { shouldDirty: true, shouldValidate: true })}
            previewAlt="Dessert preview"
          />

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
              {isPending ? 'Saving...' : (editingDessert ? 'Update Dessert' : 'Add Dessert')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
