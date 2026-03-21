'use client';

import React, { useEffect, useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema, CategoryFormData } from '@/lib/validations';
import { Category } from '@/types';
import { createCategory, updateCategory, deleteCategory } from './actions';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/admin/Modal';
import { Layers3, Plus, Sparkles, Tag, Trash2, Edit, Boxes, Utensils, Cookie } from 'lucide-react';

const SYSTEM_CATEGORY_SLUGS = ['veg-pizzas', 'non-veg-pizzas', 'addons', 'desserts'];

interface CategoriesClientProps {
  initialCategories: Category[];
  createSignal?: number;
}

export default function CategoriesClient({ initialCategories, createSignal }: CategoriesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const createSignalRef = useRef(0);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema as any),
    defaultValues: {
      label: '',
      description: '',
      icon: '',
      type: 'pizza',
      sort_order: 0,
      is_active: true,
    },
  });

  const selectedType = watch('type');

  const openCreateModal = () => {
    setEditingCategory(null);
    reset({
      label: '',
      description: '',
      icon: '',
      type: 'pizza',
      sort_order: 0,
      is_active: true,
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

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    reset({
      label: category.label,
      description: category.description || '',
      icon: category.icon || '',
      type: category.type,
      sort_order: category.sort_order,
      is_active: category.is_active,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCategory(null);
    reset();
  };

  const onSubmit = (data: CategoryFormData) => {
    startTransition(async () => {
      try {
        if (editingCategory) {
          await updateCategory(editingCategory.id, data);
          toast.success('Category updated');
          setCategories((prev) =>
            prev.map((category) =>
              category.id === editingCategory.id
                ? {
                    ...category,
                    ...data,
                    slug: data.label.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
                  }
                : category
            )
          );
        } else {
          const result = await createCategory(data);
          if (result.success) {
            toast.success('Category created');
            router.refresh();
          }
        }

        closeModal();
      } catch (error: any) {
        toast.error(error.message || 'Operation failed');
      }
    });
  };

  const handleDeleteClick = (category: Category) => {
    setDeleteConfirmId(category.id);
    setDeleteConfirmText('');
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    const category = categories.find((item) => item.id === deleteConfirmId);
    if (!category) return;

    const isSystem = SYSTEM_CATEGORY_SLUGS.includes(category.slug);
    if (isSystem && deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    startTransition(async () => {
      try {
        await deleteCategory(deleteConfirmId);
        toast.success(`'${category.label}' deleted`);
        setCategories((prev) => prev.filter((item) => item.id !== deleteConfirmId));
        setDeleteConfirmId(null);
        setDeleteConfirmText('');
      } catch (error: any) {
        if (error.message === 'SYSTEM_CATEGORY_DELETE_ATTEMPT') {
          toast.error('Cannot delete system categories - they are required by the menu system');
        } else {
          toast.error(error.message || 'Deletion failed');
        }
      }
    });
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
    setDeleteConfirmText('');
  };

  const activeCount = categories.filter((category) => category.is_active).length;
  const systemCount = categories.filter((category) => SYSTEM_CATEGORY_SLUGS.includes(category.slug)).length;
  const customCount = categories.length - systemCount;
  const typeCounts = {
    pizza: categories.filter((category) => category.type === 'pizza').length,
    addon: categories.filter((category) => category.type === 'addon').length,
    dessert: categories.filter((category) => category.type === 'dessert').length,
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-[var(--border-default)] bg-white/90 p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(232,84,10,0.14)] bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--ember)] shadow-sm">
              <Sparkles size={12} />
              Content Management
            </div>
            <div className="space-y-2">
              <h1 className="page-title">Categories</h1>
              <p className="page-subtitle max-w-2xl">
                Organize the menu into logical collections with clean labels, icons, and protected system categories.
              </p>
            </div>
          </div>

          <button onClick={openCreateModal} className="btn-primary inline-flex items-center gap-2 px-5 py-2.5">
            <Plus size={15} />
            <span>Add Category</span>
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricChip label="Total" value={categories.length} icon={<Layers3 size={14} />} />
          <MetricChip label="Active" value={activeCount} icon={<Tag size={14} />} />
          <MetricChip label="System" value={systemCount} icon={<Boxes size={14} />} />
          <MetricChip label="Custom" value={customCount} icon={<Utensils size={14} />} />
          <MetricChip label="Desserts" value={typeCounts.dessert} icon={<Cookie size={14} />} />
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border-default)] bg-white/90 shadow-sm overflow-hidden">
        <div className="border-b border-[var(--border-subtle)] px-5 py-4 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="mono-label text-[10px]">Category list</p>
              <h2 className="text-xl font-semibold text-[var(--ink)]">System and custom collections</h2>
              <p className="text-sm leading-6 text-[var(--stone)]">
                Edit names and sort order from the table, then open the modal for the full details.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-[var(--border-default)] bg-[var(--surface-secondary)] px-3 py-1 text-xs font-semibold text-[var(--stone)]">
                Protected defaults included
              </span>
            </div>
          </div>
        </div>

        <div className="table-wrap border-0 shadow-none">
          <table>
            <thead>
              <tr>
                <th style={{ width: '3rem' }} />
                <th>Label</th>
                <th>Type</th>
                <th>Sort</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td data-label="Icon">
                    <span className="text-lg">{category.icon || '📦'}</span>
                  </td>
                  <td data-label="Label">
                    <div className="flex flex-col gap-1">
                      <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{category.label}</span>
                      <span className="text-xs text-[var(--stone)]">
                        {category.description || 'No description yet'}
                      </span>
                    </div>
                  </td>
                  <td data-label="Type">
                    <span
                      className="mono-label text-[10px] px-2.5 py-1 font-semibold rounded-full"
                      style={{
                        background:
                          category.type === 'pizza'
                            ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                            : category.type === 'addon'
                              ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
                              : 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
                        color:
                          category.type === 'pizza'
                            ? '#1e40af'
                            : category.type === 'addon'
                              ? '#166534'
                              : '#9d174d',
                        border: '1px solid transparent',
                        boxShadow: '0 0 0 1px rgba(255,255,255,0.5) inset',
                      }}
                    >
                      {category.type}
                    </span>
                  </td>
                  <td data-label="Sort">
                    <span className="font-mono text-sm font-semibold text-[var(--ink)]">{category.sort_order}</span>
                  </td>
                  <td data-label="Status">
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full"
                      style={{
                        background: category.is_active
                          ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
                          : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                        color: category.is_active ? '#166534' : '#991b1b',
                        border: 'none',
                        boxShadow: '0 0 0 1px rgba(255,255,255,0.5) inset',
                      }}
                    >
                      {category.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td data-label="Actions">
                    <div className="flex justify-end gap-2.5">
                      <button
                        onClick={() => openEditModal(category)}
                        className="icon-btn transition-all hover:scale-110"
                        style={{
                          background: 'var(--surface-secondary)',
                          border: '1px solid var(--border-default)',
                          color: 'var(--ink)',
                        }}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(category)}
                        className="icon-btn danger transition-all hover:scale-110"
                        disabled={isPending}
                        style={{
                          background: 'rgba(220, 38, 38, 0.05)',
                          border: '1px solid rgba(220, 38, 38, 0.15)',
                          color: 'var(--danger)',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
                      <Tag size={40} className="empty-state-icon" />
                      <p className="empty-state-text">No categories configured yet.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingCategory ? 'Edit Category' : 'New Category'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: 'var(--ink)' }}>
              Label
            </label>
            <input {...register('label')} placeholder="Category name" className="input-base" />
            {errors.label && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.label.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium" style={{ color: 'var(--ink)' }}>
              Description
            </label>
            <textarea
              {...register('description')}
              placeholder="Brief description"
              className="input-base"
              rows={4}
              style={{ height: 'auto', paddingTop: '0.85rem', paddingBottom: '0.85rem' }}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'var(--ink)' }}>
                Icon
              </label>
              <input {...register('icon')} placeholder="🍕" className="input-base" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'var(--ink)' }}>
                Type
              </label>
              <select {...register('type')} className="input-base">
                <option value="pizza">Pizza</option>
                <option value="addon">Addon</option>
                <option value="dessert">Dessert</option>
              </select>
              <p className="text-xs text-[var(--stone)]">
                This will be saved as a <span className="font-semibold text-[var(--ink)]">{selectedType}</span> category.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium" style={{ color: 'var(--ink)' }}>
                Sort Order
              </label>
              <input type="number" {...register('sort_order', { valueAsNumber: true })} className="input-base" />
              <p className="text-xs text-[var(--stone)]">Lower numbers appear first.</p>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-secondary)] px-4 py-3">
              <input type="checkbox" {...register('is_active')} className="w-5 h-5 rounded accent-ember" />
              <span className="text-sm font-medium text-[var(--ink)]">Visible on menu</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
            <button type="button" onClick={closeModal} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={isPending} className="btn-primary">
              {isPending ? 'Saving...' : editingCategory ? 'Update Category' : 'Add Category'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deleteConfirmId)}
        onClose={cancelDelete}
        title="Delete Category"
      >
        {deleteConfirmId && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-secondary)] p-4 text-sm leading-6 text-[var(--stone)]">
              {SYSTEM_CATEGORY_SLUGS.includes(categories.find((item) => item.id === deleteConfirmId)?.slug || '')
                ? 'This is a protected system category. Type DELETE to confirm removal.'
                : 'This category will be permanently removed. This action cannot be undone.'}
            </div>

            {SYSTEM_CATEGORY_SLUGS.includes(categories.find((item) => item.id === deleteConfirmId)?.slug || '') && (
              <input
                value={deleteConfirmText}
                onChange={(event) => setDeleteConfirmText(event.target.value)}
                className="input-base"
                placeholder="Type DELETE"
              />
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={cancelDelete} className="btn-ghost">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} disabled={isPending} className="btn-primary">
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function MetricChip({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-secondary)] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="mono-label text-[10px]">{label}</p>
          <div className="mt-2 text-2xl font-semibold text-[var(--ink)]">{value}</div>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-[var(--ember)] shadow-sm">
          {icon}
        </span>
      </div>
    </div>
  );
}
