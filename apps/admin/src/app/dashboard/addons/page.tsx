import { createSupabaseServer } from '@/lib/supabaseServer';
import { AddonsClient } from './AddonsClient';

export default async function AddonsPage() {
  const supabase = await createSupabaseServer();
  const { data: addons } = await supabase.from('addons').select('*').order('sort_order').order('name');

  return <AddonsClient initialAddons={addons || []} />;
}
