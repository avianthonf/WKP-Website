import { createSupabaseServer } from '@/lib/supabaseServer';
import { Order, OrderItem } from '@/types';
import { ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export default async function OrderHistoryPage() {
  const supabase = await createSupabaseServer();

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
    .in('status', ['delivered', 'cancelled'])
    .order('created_at', { ascending: false })
    .limit(50);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getItemSummary = (items: OrderItem[] | null | undefined): string => {
    if (!items || items.length === 0) return '-';
    const names = items.map((item) => {
      const name = item.pizzas?.name || item.extras?.name || item.addons?.name || item.desserts?.name || 'Unknown';
      return `${item.quantity}x ${name}`;
    });
    return names.join(', ');
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const baseClass = 'px-2 py-1 rounded text-xs font-medium';
    const styles: Record<string, string> = {
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`${baseClass} ${styles[status] || ''}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-8 reveal-stagger">
      <header className="page-header">
        <div>
          <Link
            href="/dashboard/orders"
            className="mb-3 flex items-center gap-2 text-sm"
            style={{ color: 'var(--stone)' }}
          >
            <ArrowLeft size={16} />
            Back to Live Kitchen Board
          </Link>
          <h1 className="page-title">Order History</h1>
          <p className="page-subtitle">Past orders (delivered or cancelled).</p>
        </div>
      </header>

      <section className="rounded-3xl border border-[var(--border-default)] bg-white/90 shadow-sm overflow-hidden">
        <div className="table-wrap border-0 shadow-none">
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((order: Order) => (
              <tr key={order.id}>
                <td data-label="Order #">
                  <span className="font-mono text-xs font-bold" style={{ color: 'var(--stone)' }}>
                    #{order.order_number}
                  </span>
                </td>
                <td data-label="Customer">
                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{order.customer_name}</div>
                  {order.customer_phone && (
                    <div className="text-xs" style={{ color: 'var(--stone)' }}>{order.customer_phone}</div>
                  )}
                  {order.scheduled_for && (
                    <div className="text-xs" style={{ color: 'var(--stone)' }}>
                      Scheduled {formatDate(order.scheduled_for)}
                    </div>
                  )}
                  {order.delivery_location_url && !order.delivery_address && (
                    <div className="text-xs" style={{ color: 'var(--stone)' }}>Pinned location shared</div>
                  )}
                </td>
                <td data-label="Items">
                  <div className="max-w-xs truncate text-xs" style={{ color: 'var(--stone)' }}>
                    {getItemSummary(order.order_items as OrderItem[])}
                  </div>
                </td>
                <td data-label="Amount">
                  <span className="font-mono text-sm font-bold" style={{ color: 'var(--ink)' }}>
                    {currencyFormatter.format(Number(order.total_price) || 0)}
                  </span>
                </td>
                <td data-label="Status">
                  <StatusBadge status={order.status} />
                </td>
                <td data-label="Payment">
                  <span className="text-xs uppercase" style={{ color: 'var(--stone)' }}>
                    {order.payment_method}
                  </span>
                </td>
                <td data-label="Date">
                  <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--stone)' }}>
                    <Clock size={12} />
                    {formatDate(order.created_at)}
                  </div>
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <Clock size={40} className="empty-state-icon" />
                    <p className="empty-state-text">No order history yet.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </section>
    </div>
  );
}
