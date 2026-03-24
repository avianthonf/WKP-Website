import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { createSupabaseServer } from '@/lib/supabaseServer';
import { updateExtra } from '../../actions';
import { ExtraForm } from '@/components/admin/ExtraForm';

export default async function EditExtraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: extra } = await supabase.from('extras').select('*').eq('id', id).maybeSingle();

  if (!extra) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <header className="space-y-3">
        <Link href="/dashboard/extras" className="back-link">
          <ChevronLeft size={14} /> Back to Extras
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
          Edit Extra
        </h1>
        <p className="text-sm" style={{ color: 'var(--stone)' }}>
          Update the sizing, pricing, and availability for this add-on.
        </p>
      </header>

      <ExtraForm
        onSubmitAction={(data) => updateExtra(id, data)}
        initialData={{
          name: extra.name,
          price_small: extra.price_small,
          price_medium: extra.price_medium,
          price_large: extra.price_large,
          is_veg: extra.is_veg,
          is_active: extra.is_active,
          sort_order: extra.sort_order,
        }}
        isEdit
        submitLabel="Save Changes"
      />
    </div>
  );
}
