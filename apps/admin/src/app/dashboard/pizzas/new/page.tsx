import { createSupabaseServer } from '@/lib/supabaseServer';
import { PizzaForm } from '@/components/admin/PizzaForm';
import { createPizza } from '../actions';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default async function NewPizzaPage() {
  const supabase = await createSupabaseServer();

  const [
    { data: categories },
    { data: toppings }
  ] = await Promise.all([
    supabase.from('categories').select('*').eq('type', 'pizza').order('label'),
    supabase.from('toppings').select('*').eq('is_active', true).order('name')
  ]);

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <header className="space-y-3">
        <Link href="/dashboard/pizzas" className="back-link">
          <ChevronLeft size={14} /> Back to Pizzas
        </Link>
        <h1
          className="leading-tight"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'var(--text-2xl)', fontWeight: 500, color: 'var(--ink)' }}
        >
          New Artisanal Selection
        </h1>
        <p className="text-sm" style={{ color: 'var(--stone)' }}>
          Define a new pizza profile for the public menu.
        </p>
      </header>

      <PizzaForm
        categories={categories || []}
        toppings={toppings || []}
        onSubmitAction={createPizza}
      />
    </div>
  );
}
