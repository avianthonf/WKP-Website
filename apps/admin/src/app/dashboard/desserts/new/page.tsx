import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { createSupabaseServer } from '@/lib/supabaseServer';
import { createDessert } from '../actions';
import { DessertForm } from '@/components/admin/DessertForm';

export default async function NewDessertPage() {
  const supabase = await createSupabaseServer();
  const { data: desserts } = await supabase.from('desserts').select('*').order('sort_order').order('name');
  const nextSortOrder = (desserts?.reduce((max: number, dessert: { sort_order?: number | null }) => {
    return Math.max(max, dessert.sort_order || 0);
  }, 0) ?? 0) + 1;

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <header className="space-y-3">
        <Link href="/dashboard/desserts" className="back-link">
          <ChevronLeft size={14} /> Back to Desserts
        </Link>
        <h1
          className="leading-tight"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'var(--text-2xl)',
            fontWeight: 500,
            color: 'var(--ink)',
          }}
        >
          New Dessert
        </h1>
        <p className="text-sm" style={{ color: 'var(--stone)' }}>
          Add a standalone dessert item for the menu.
        </p>
      </header>

      <DessertForm
        onSubmitAction={createDessert}
        initialData={{
          is_veg: true,
          is_active: true,
          sort_order: nextSortOrder,
        }}
      />
    </div>
  );
}
