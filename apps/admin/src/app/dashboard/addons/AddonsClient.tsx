'use client';

import React, { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addonSchema, AddonFormData } from '@/lib/validations';
import { Addon } from '@/types';
import { createAddon, updateAddon, deleteAddon, toggleAddonSoldOut } from './actions';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/admin/Modal';
import { ToggleSoldOut } from '@/components/admin/ToggleSoldOut';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { MenuImageField } from '@/components/admin/MenuImageField';

interface AddonsClientProps {
  initialAddons: Addon[];
  createSignal?: number;
}

export function AddonsClient({ initialAddons, createSignal }: AddonsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [addons, setAddons] = useState<Addon[]>(initialAddons);
  const createSignalRef = useRef(0);

  useEffect(() => {
    setAddons(initialAddons);
  }, [initialAddons]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<AddonFormData>({
    resolver: zodResolver(addonSchema as any),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      image_url: null,
      is_veg: true,
      is_bestseller: false,
      is_active: true,
      sort_order: 0,
    }
  });

  const imageUrl = watch('image_url');

  const openCreateModal = useCallback(() => {
    setEditingAddon(null);
    reset({
      name: '',
      description: '',
      price: 0,
      image_url: null,
      is_veg: true,
      is_bestseller: false,
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

  const openEditModal = (addon: Addon) => {
    setEditingAddon(addon);
    reset({
      name: addon.name,
      description: addon.description || '',
      price: addon.price,
      image_url: addon.image_url || null,
      is_veg: addon.is_veg,
      is_bestseller: addon.is_bestseller,
      is_active: addon.is_active,
      sort_order: addon.sort_order,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingAddon(null);
    reset();
  };

  const onSubmit = (data: AddonFormData) => {
    startTransition(async () => {
      try {
        if (editingAddon) {
          await updateAddon(editingAddon.id, data);
          toast.success('Addon updated');
          setAddons(prev => prev.map(a => a.id === editingAddon.id ? { ...a, ...data } : a));
          router.refresh();
        } else {
          const result = await createAddon(data);
          if (result.success) {
            toast.success('Addon created');
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

  const handleDelete = (addon: Addon) => {
    if (!window.confirm(`Delete '${addon.name}'? This cannot be undone.`)) return;

    startTransition(async () => {
      try {
        await deleteAddon(addon.id);
        toast.success(`'${addon.name}' deleted`);
        setAddons(prev => prev.filter(a => a.id !== addon.id));
        router.refresh();
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
        style={{ background: '#dcfce7', borderColor: '#16a34a', color: '#166534' }}
      >
        <div className="text-sm leading-6">
          Addons are standalone side items: Garlic Bread, Calzone, etc. They have a single flat price regardless of pizza size.
        </div>
      </section>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Sides & Addons</h1>
          <p className="page-subtitle">Manage garlic bread, calzones, and appetizers.</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus size={16} /> New Addon
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
              <th>Bestseller</th>
              <th>Sold Out</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {addons.map(addon => (
              <tr key={addon.id}>
                <td>
                  <div
                    className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
                    style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-default)' }}
                  >
                    {addon.image_url ? (
                      <a
                        href={addon.image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ember)] underline underline-offset-2"
                      >
                        Open
                      </a>
                    ) : (
                      <Package size={16} style={{ color: 'var(--stone)' }} />
                    )}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{addon.name}</div>
                  {addon.description && (
                    <div className="text-xs truncate" style={{ color: 'var(--stone)', maxWidth: '16rem' }}>
                      {addon.description}
                    </div>
                  )}
                </td>
                <td>
                  <span className="font-mono font-bold" style={{ color: 'var(--ember)' }}>₹{addon.price}</span>
                </td>
                <td>
                  <span className={`badge ${addon.is_veg ? 'badge-veg' : 'badge-meat'}`}>
                    {addon.is_veg ? 'Veg' : 'Non-Veg'}
                  </span>
                </td>
                <td>
                  {addon.is_bestseller && <span style={{ color: '#f59e0b' }}>★</span>}
                </td>
                <td>
                  <ToggleSoldOut
                    id={addon.id}
                    initialSoldOut={addon.is_sold_out}
                    onToggle={toggleAddonSoldOut}
                  />
                </td>
                <td>
                  <span className={`badge ${addon.is_active ? 'badge-active' : 'badge-inactive'}`}>
                    {addon.is_active ? 'Active' : 'Hidden'}
                  </span>
                </td>
                <td>
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEditModal(addon)} className="icon-btn" style={{ color: '#3b82f6' }}>
                      <Edit size={15} />
                    </button>
                    <button onClick={() => handleDelete(addon)} className="icon-btn danger" disabled={isPending}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {addons.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <Package size={40} className="empty-state-icon" />
                    <p className="empty-state-text">No addons configured yet.</p>
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
        title={editingAddon ? 'Edit Addon' : 'New Addon'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ink)' }}>Name</label>
            <input
              {...register('name')}
              placeholder="Addon name"
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
            label="Addon photo"
            description="Shown on addon cards and addon detail pages across the storefront."
          folder="addons"
          bucket="menu"
          value={imageUrl}
          onChange={(next) => setValue('image_url', next, { shouldDirty: true, shouldValidate: true })}
        />

          <div className="flex items-center gap-2.5">
            <input type="checkbox" id="is_veg" {...register('is_veg')} className="w-5 h-5 rounded accent-ember" />
            <label htmlFor="is_veg" className="text-sm font-medium cursor-pointer" style={{ color: 'var(--ink)' }}>
              Vegetarian
            </label>
          </div>

          <div className="flex items-center gap-2.5">
            <input type="checkbox" id="is_bestseller" {...register('is_bestseller')} className="w-5 h-5 rounded accent-ember" />
            <label htmlFor="is_bestseller" className="text-sm font-medium cursor-pointer" style={{ color: 'var(--ink)' }}>
              Mark as Bestseller
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
              {isPending ? 'Saving...' : (editingAddon ? 'Update Addon' : 'Add Addon')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
