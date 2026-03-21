'use client';

import { useState, useTransition } from 'react';
import { deletePizza } from '@/app/dashboard/pizzas/actions';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DeletePizzaButtonProps {
  pizzaId: string;
  pizzaName: string;
}

export function DeletePizzaButton({ pizzaId, pizzaName }: DeletePizzaButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deletePizza(pizzaId);
        toast.success(`'${pizzaName}' removed`);
      } catch (error) {
        toast.error('Deletion failed');
      }
    });
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2 animate-slide-in-left">
        <span className="mono-label" style={{ color: '#ef4444', whiteSpace: 'nowrap' }}>Delete?</span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="icon-btn danger"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <span className="text-xs font-bold">Yes</span>}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="icon-btn"
          style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="icon-btn danger"
    >
      <Trash2 size={16} />
    </button>
  );
}
