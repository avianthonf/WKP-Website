import { createSupabaseServer } from '@/lib/supabaseServer';
import { Notification } from '@/types';
import NotificationsClient from '@/app/dashboard/notifications/NotificationsClient';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const supabase = await createSupabaseServer();

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 reveal-stagger">
      <NotificationsClient initialNotifications={(notifications || []) as Notification[]} />
    </div>
  );
}
