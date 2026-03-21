import { createSupabaseServer } from '@/lib/supabaseServer';
import { Order, OrderItem } from '@/types';
import KanbanBoard from '@/app/dashboard/orders/KanbanBoard';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const supabase = await createSupabaseServer();

  // Fetch active orders with full join to get item names
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        id,
        item_type,
        size,
        quantity,
        unit_price,
        pizzas(name),
        extras(name),
        addons(name),
        desserts(name)
      )
    `)
    .in('status', ['pending', 'preparing', 'out_for_delivery'])
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-8 reveal-stagger">
      <header className="page-header heading-spaced">
        <div>
          <div className="mb-3">
            <span className="mono-label text-[9px] tracking-wider uppercase" style={{ color: 'var(--stone)', opacity: 0.7 }}>Operations</span>
          </div>
          <h1 className="page-title">Live Orders</h1>
          <p className="page-subtitle">Real-time order flow and fulfillment for the kitchen team.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a href="/dashboard/orders/history" className="btn-ghost inline-flex items-center gap-2 px-5 py-2.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3.5H11M3 6.5H11M3 9.5H11M1 3.5V10.5C1 11.0523 1.44772 11.5 2 11.5H12C12.5523 11.5 13 11.0523 13 10.5V3.5C13 2.94772 12.5523 2.5 12 2.5H2C1.44772 2.5 1 2.94772 1 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Order History</span>
          </a>
        </div>
      </header>

      <KanbanBoard initialOrders={(orders || []) as Order[]} />
    </div>
  );
}
