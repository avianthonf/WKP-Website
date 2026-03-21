import { createSupabaseServer } from '@/lib/supabaseServer';
import { PizzaForm } from '@/components/admin/PizzaForm';
import { updatePizza } from '../../actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface EditPizzaPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPizzaPage({ params }: EditPizzaPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  const [
    { data: pizza },
    { data: categories },
    { data: toppings },
    { data: pizzaToppings }
  ] = await Promise.all([
    supabase.from('pizzas').select('*').eq('id', id).single(),
    supabase.from('categories').select('*').eq('type', 'pizza').order('label'),
    supabase.from('toppings').select('*').eq('is_active', true).order('name'),
    supabase.from('pizza_toppings').select('topping_id').eq('pizza_id', id)
  ]);

  if (!pizza) return notFound();

  const initialData = {
    ...pizza,
    toppings: pizzaToppings?.map(pt => pt.topping_id) || []
  };

  const handleUpdate = async (data: any) => {
    'use server';
    return updatePizza(id, data);
  };

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
          Edit: <span style={{ color: 'var(--ember)', fontStyle: 'italic' }}>{pizza.name}</span>
        </h1>
        <p className="text-sm" style={{ color: 'var(--stone)' }}>
          Modify the artisanal specifications of this selection.
        </p>
      </header>

      <PizzaForm
        isEdit
        categories={categories || []}
        toppings={toppings || []}
        initialData={initialData}
        onSubmitAction={handleUpdate}
      />
    </div>
  );
}
