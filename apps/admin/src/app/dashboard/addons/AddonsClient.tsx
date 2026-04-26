'use client';

import Link from 'next/link';
import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { ToggleSoldOut } from '@/components/admin/ToggleSoldOut';
import { deleteAddon, toggleAddonSoldOut } from './actions';
import type { Addon } from '@/types';

interface AddonsClientProps {
  initialAddons: Addon[];
}

export function AddonsClient({ initialAddons }: AddonsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addons, setAddons] = useState<Addon[]>(initialAddons);

  useEffect(() => {
    setAddons(initialAddons);
  }, [initialAddons]);

  const handleDelete = (addon: Addon) => {
    if (!window.confirm(`Delete '${addon.name}'? This cannot be undone.`)) return;

    startTransition(async () => {
      try {
        const result = await deleteAddon(addon.id);
        if (result?.softDeleted) {
          toast.success(`'${addon.name}' deactivated (in use)`);
          // Note: we don't remove it from the list here because it's just deactivated,
          // so it still needs to appear in the admin view.
          setAddons((prev) => prev.map((a) => (a.id === addon.id ? { ...a, is_active: false } : a)));
        } else {
          toast.success(`'${addon.name}' deleted`);
          setAddons((prev) => prev.filter((a) => a.id !== addon.id));
        }
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

      <div className="page-header">
        <div>
          <h1 className="page-title">Sides & Addons</h1>
          <p className="page-subtitle">Manage garlic bread, calzones, and appetizers.</p>
        </div>
        <Link href="/dashboard/addons/new" className="btn-primary">
          <Plus size={16} /> New Addon
        </Link>
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
              {addons.map((addon) => (
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
                      <Link href={`/dashboard/addons/${addon.id}/edit`} className="icon-btn" style={{ color: '#3b82f6' }}>
                        <Edit size={15} />
                      </Link>
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
    </div>
  );
}
