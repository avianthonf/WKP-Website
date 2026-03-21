import { createSupabaseServer } from '@/lib/supabaseServer';
import { Category } from '@/types';
import CategoriesClient from './CategoriesClient';

export default async function CategoriesPage() {
  const supabase = await createSupabaseServer();

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  return (
    <div className="space-y-6 reveal-stagger">
      <CategoriesClient initialCategories={categories || []} />
    </div>
  );
}
