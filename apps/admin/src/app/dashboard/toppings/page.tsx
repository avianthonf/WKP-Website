import { createSupabaseServer } from '@/lib/supabaseServer';
import { ToppingsClient } from './ToppingsClient';

export default async function ToppingsPage() {
  const supabase = await createSupabaseServer();

  const { data: toppings } = await supabase
    .from('toppings')
    .select('*')
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true });

  return <ToppingsClient initialToppings={toppings || []} />;
}
