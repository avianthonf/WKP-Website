import { createSupabaseServer } from '@/lib/supabaseServer';
import { ExtrasClient } from './ExtrasClient';

export default async function ExtrasPage() {
  const supabase = await createSupabaseServer();
  const { data: extras } = await supabase.from('extras').select('*').order('sort_order').order('name');

  return <ExtrasClient initialExtras={extras || []} />;
}
