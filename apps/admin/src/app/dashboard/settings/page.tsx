import { createSupabaseServer } from '@/lib/supabaseServer';
import { SiteConfigItem } from '@/types';
import SettingsClient from '@/app/dashboard/settings/SettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createSupabaseServer();

  const { data: configs } = await supabase
    .from('site_config')
    .select('*')
    .order('key', { ascending: true });

  return (
    <div className="space-y-6 reveal-stagger">
      <SettingsClient initialConfigs={(configs || []) as SiteConfigItem[]} />
    </div>
  );
}
