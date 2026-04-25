'use client';

import Link from 'next/link';
import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, Cookie } from 'lucide-react';
import { ToggleSoldOut } from '@/components/admin/ToggleSoldOut';
import { deleteDessert, toggleDessertSoldOut } from './actions';
import type { Dessert } from '@/types';

interface DessertsClientProps {
  initialDesserts: Dessert[];
}

export function DessertsClient({ initialDesserts }: DessertsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [desserts, setDesserts] = useState<Dessert[]>(initialDesserts);

  useEffect(() => {
    setDesserts(initialDesserts);
  }, [initialDesserts]);

  const handleDelete = (dessert: Dessert) => {
    if (!window.confirm(`Delete '${dessert.name}'? This cannot be undone.`)) return;

    startTransition(async () => {
      try {
        await deleteDessert(dessert.id);
        toast.success(`'${dessert.name}' deleted`);
        setDesserts((prev) => prev.filter((d) => d.id !== dessert.id));
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
        <Link href="/dashboard/desserts/new" className="btn-primary">
          <Plus size={16} /> New Dessert
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
              <th>Sold Out</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {desserts.map((dessert) => (
              <tr key={dessert.id}>
                <td>
                  <div
                    className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
                    style={{ background: 'var(--surface-secondary)', border: '1px solid var(--border-default)' }}
                  >
                    {dessert.image_url ? (
                      <a
                        href={dessert.image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ember)] underline underline-offset-2"
                      >
                        Open
                      </a>
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
                    <Link href={`/dashboard/desserts/${dessert.id}/edit`} className="icon-btn" style={{ color: '#3b82f6' }}>
                      <Edit size={15} />
                    </Link>
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
    </div>
  );
}
