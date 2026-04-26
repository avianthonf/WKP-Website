import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { createSupabaseServer } from '@/lib/supabaseServer';
import { updateDessert } from '../../actions';
import { DessertForm } from '@/components/admin/DessertForm';

export default async function EditDessertPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: dessert } = await supabase.from('desserts').select('*').eq('id', id).maybeSingle();

  if (!dessert) {
    notFound();
  }

  const handleUpdate = async (data: Parameters<typeof updateDessert>[1]) => {
    'use server';
    return updateDessert(id, data);
  };

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
          Edit Dessert
        </h1>
        <p className="text-sm" style={{ color: 'var(--stone)' }}>
          Update the details for this dessert.
        </p>
      </header>

      <DessertForm
        onSubmitAction={handleUpdate}
        initialData={{
          name: dessert.name,
          description: dessert.description ?? '',
          price: dessert.price,
          image_url: dessert.image_url ?? null,
          is_veg: dessert.is_veg,
          is_active: dessert.is_active,
          sort_order: dessert.sort_order ?? 0,
        }}
        isEdit
        submitLabel="Save Changes"
      />
    </div>
  );
}