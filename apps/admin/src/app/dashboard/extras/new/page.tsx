import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { createSupabaseServer } from '@/lib/supabaseServer';
import { createExtra } from '../actions';
import { ExtraForm } from '@/components/admin/ExtraForm';

export default async function NewExtraPage() {
  const supabase = await createSupabaseServer();
  const { data: extras } = await supabase.from('extras').select('*').order('sort_order').order('name');
  const nextSortOrder = (extras?.reduce((max: number, extra: { sort_order?: number | null }) => {
    return Math.max(max, extra.sort_order || 0);
  }, 0) ?? 0) + 1;

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
          New Extra
        </h1>
        <p className="text-sm" style={{ color: 'var(--stone)' }}>
          Add a sized add-on topping for the pizza builder and menu pricing.
        </p>
      </header>

      <ExtraForm
        onSubmitAction={createExtra}
        initialData={{
          is_veg: true,
          is_active: true,
          sort_order: nextSortOrder,
        }}
      />
    </div>
  );
}
