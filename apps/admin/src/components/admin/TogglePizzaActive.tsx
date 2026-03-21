'use client';

import { useTransition } from 'react';
import { togglePizzaActive } from '@/app/dashboard/pizzas/actions';
import { toast } from 'react-hot-toast';

interface TogglePizzaActiveProps {
  pizzaId: string;
  initialActive: boolean;
}

export function TogglePizzaActive({ pizzaId, initialActive }: TogglePizzaActiveProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await togglePizzaActive(pizzaId, initialActive);
        toast.success(`Pizza ${initialActive ? 'hidden' : 'activated'}`);
      } catch (error) {
        toast.error('Failed to toggle status');
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`toggle-track ${initialActive ? 'active' : 'inactive'} ${isPending ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2`}
    >
      <span className="sr-only">Toggle availability</span>
      <span aria-hidden="true" className="toggle-knob" />
    </button>
  );
}
