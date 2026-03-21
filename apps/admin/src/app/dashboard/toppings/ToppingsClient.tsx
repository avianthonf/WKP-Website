'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toppingSchema, ToppingFormData } from '@/lib/validations';
import { Topping } from '@/types';
import { createTopping, updateTopping, deleteTopping } from './actions';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/admin/Modal';
import { Plus, Edit, Trash2, Leaf, X } from 'lucide-react';

interface ToppingsClientProps {
  initialToppings: Topping[];
  createSignal?: number;
}

export function ToppingsClient({ initialToppings, createSignal }: ToppingsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTopping, setEditingTopping] = useState<Topping | null>(null);
  const [toppings, setToppings] = useState<Topping[]>(initialToppings);
  const createSignalRef = useRef(0);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<ToppingFormData>({
    resolver: zodResolver(toppingSchema as any),
    defaultValues: {
      name: '',
      category: 'cheese',
      is_veg: true,
      is_active: true,
      sort_order: 0,
    }
  });

  const openCreateModal = () => {
    setEditingTopping(null);
    reset({
      name: '',
      category: 'cheese',
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

  const openEditModal = (topping: Topping) => {
    setEditingTopping(topping);
    reset({
      name: topping.name,
      category: topping.category,
      is_veg: topping.is_veg,
      is_active: topping.is_active,
      sort_order: topping.sort_order,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTopping(null);
    reset();
  };

  const onSubmit = (data: ToppingFormData) => {
    startTransition(async () => {
      try {
        if (editingTopping) {
          await updateTopping(editingTopping.id, data);
          toast.success('Topping updated');
          // Update local state
          setToppings(prev => prev.map(t => t.id === editingTopping.id ? { ...t, ...data } : t));
        } else {
          const result = await createTopping(data);
          if (result.success) {
            toast.success('Topping created');
            // Refresh to get new data with id
            router.refresh();
          }
        }
        closeModal();
      } catch (error: any) {
        toast.error(error.message || 'Operation failed');
      }
    });
  };

  const handleDelete = (topping: Topping) => {
    if (!window.confirm(`Delete '${topping.name}'? This cannot be undone.`)) return;

    startTransition(async () => {
      try {
        await deleteTopping(topping.id);
        toast.success(`'${topping.name}' deleted`);
        setToppings(prev => prev.filter(t => t.id !== topping.id));
      } catch (error: any) {
        toast.error(error.message || 'Deletion failed');
      }
    });
  };

  // Group toppings by category for display
  const groupedToppings = toppings.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, Topping[]>);

  const categoryOrder = ['cheese', 'meat', 'vegetable', 'sauce', 'herb', 'other'];

  return (
    <div className="space-y-8">
      {/* Info Banner */}
      <section
        className="rounded-3xl border border-[var(--border-default)] bg-white/90 p-5 shadow-sm md:p-6"
        style={{ background: '#eff6ff', borderColor: '#3b82f6', color: '#1e40af' }}
      >
        Toppings are the ingredients listed on a pizza card. They carry no extra charge — they are display only.
      </section>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Toppings</h1>
          <p className="page-subtitle">Configure pizza ingredients and dietary classifications.</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus size={16} /> New Topping
        </button>
      </div>

      {/* Table */}
      <section className="rounded-3xl border border-[var(--border-default)] bg-white/90 shadow-sm overflow-hidden">
        <div className="table-wrap border-0 shadow-none">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Veg</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categoryOrder.map(cat => (
              groupedToppings[cat]?.map(topping => (
                <tr key={topping.id}>
                  <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{topping.name}</td>
                  <td>
                    <span className="mono-label px-2 py-1 rounded" style={{ background: 'var(--surface-secondary)' }}>
                      {cat}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${topping.is_veg ? 'badge-veg' : 'badge-meat'}`}>
                      {topping.is_veg ? 'Veg' : 'Meat'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${topping.is_active ? 'badge-active' : 'badge-inactive'}`}>
                      {topping.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEditModal(topping)} className="icon-btn" style={{ color: '#3b82f6' }}>
                        <Edit size={15} />
                      </button>
                      <button onClick={() => handleDelete(topping)} className="icon-btn danger" disabled={isPending}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ))}
            {toppings.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <Leaf size={40} className="empty-state-icon" />
                    <p className="empty-state-text">No toppings configured yet.</p>
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
        title={editingTopping ? 'Edit Topping' : 'New Topping'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ink)' }}>Name</label>
            <input
              {...register('name')}
              placeholder="Topping name"
              className="input-base"
            />
            {errors.name && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ink)' }}>Category</label>
            <select {...register('category')} className="input-base">
              <option value="cheese">Cheese</option>
              <option value="meat">Meat</option>
              <option value="vegetable">Vegetable</option>
              <option value="sauce">Sauce</option>
              <option value="herb">Herb</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-secondary)] px-4 py-3">
            <input type="checkbox" id="is_veg" {...register('is_veg')} className="w-5 h-5 rounded accent-ember" />
            <label htmlFor="is_veg" className="text-sm font-medium cursor-pointer" style={{ color: 'var(--ink)' }}>
              Vegetarian
            </label>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-secondary)] px-4 py-3">
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
            <button type="button" onClick={closeModal} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? 'Saving...' : (editingTopping ? 'Update Topping' : 'Add Topping')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
