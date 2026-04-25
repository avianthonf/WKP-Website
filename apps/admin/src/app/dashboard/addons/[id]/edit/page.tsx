import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { createSupabaseServer } from '@/lib/supabaseServer';
import { updateAddon } from '../../actions';
import { AddonForm } from '@/components/admin/AddonForm';

export default async function EditAddonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: addon } = await supabase.from('addons').select('*').eq('id', id).maybeSingle();

  if (!addon) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <header className="space-y-3">
        <Link href="/dashboard/addons" className="back-link">
          <ChevronLeft size={14} /> Back to Addons
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
          Edit Addon
        </h1>
        <p className="text-sm" style={{ color: 'var(--stone)' }}>
          Update the details for this side item.
        </p>
      </header>

      <AddonForm
        onSubmitAction={(data) => updateAddon(id, data)}
        initialData={{
          name: addon.name,
          description: addon.description ?? '',
          price: addon.price,
          image_url: addon.image_url ?? null,
          is_veg: addon.is_veg,
          is_bestseller: addon.is_bestseller,
          is_active: addon.is_active,
          sort_order: addon.sort_order ?? 0,
        }}
        isEdit
        submitLabel="Save Changes"
      />
    </div>
  );
}