import { createSupabaseServer } from '@/lib/supabaseServer';
import { DessertsClient } from './DessertsClient';

export default async function DessertsPage() {
  const supabase = await createSupabaseServer();
  const { data: desserts } = await supabase.from('desserts').select('*').order('sort_order').order('name');

  return <DessertsClient initialDesserts={desserts || []} />;
}
