'use client';

import Link from 'next/link';
import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { InlineExtraPrice } from '@/components/admin/InlineExtraPrice';
import { ToggleSoldOut } from '@/components/admin/ToggleSoldOut';
import { deleteExtra, toggleExtraSoldOut } from './actions';
import type { Extra } from '@/types';

interface ExtrasClientProps {
  initialExtras: Extra[];
}

export function ExtrasClient({ initialExtras }: ExtrasClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [extras, setExtras] = useState<Extra[]>(initialExtras);

  useEffect(() => {
    setExtras(initialExtras);
  }, [initialExtras]);

  const handleDelete = (extra: Extra) => {
    if (!window.confirm(`Delete '${extra.name}'? This cannot be undone.`)) return;

    startTransition(async () => {
      try {
        await deleteExtra(extra.id);
        toast.success(`'${extra.name}' deleted`);
        setExtras((prev) => prev.filter((item) => item.id !== extra.id));
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
        style={{ background: '#fffbeb', borderColor: '#d97706', color: '#92400e' }}
      >
        <div className="text-sm leading-6">
          Extras are chargeable add-on toppings. The price charged depends on the pizza size the customer has chosen.
        </div>
      </section>

      <div className="page-header">
        <div>
          <h1 className="page-title">Extras</h1>
          <p className="page-subtitle">Configure additional toppings and custom charges.</p>
        </div>
        <Link href="/dashboard/extras/new" className="btn-primary inline-flex items-center gap-2">
          <Plus size={16} /> New Extra
        </Link>
      </div>

      <section className="rounded-3xl border border-[var(--border-default)] bg-white/90 shadow-sm overflow-hidden">
        <div className="border-b border-[var(--border-subtle)] px-5 py-4 md:px-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="mono-label text-[10px]">Extra list</p>
              <h2 className="text-xl font-semibold text-[var(--ink)]">Sized add-on pricing</h2>
              <p className="text-sm leading-6 text-[var(--stone)]">
                Open each extra in its own editor to avoid modal scroll bugs.
              </p>
            </div>
          </div>
        </div>
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
              {extras.map((extra) => (
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
                    <ToggleSoldOut id={extra.id} initialSoldOut={extra.is_sold_out} onToggle={toggleExtraSoldOut} />
                  </td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Link href={`/dashboard/extras/${extra.id}/edit`} className="icon-btn" style={{ color: '#3b82f6' }}>
                        <Edit size={15} />
                      </Link>
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
                      <Package size={40} className="empty-state-icon" />
                      <p className="empty-state-text">No extras configured yet.</p>
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
