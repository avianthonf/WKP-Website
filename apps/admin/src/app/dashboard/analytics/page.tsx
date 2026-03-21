import type React from 'react';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { BarChart3, CircleDollarSign, Hourglass, Receipt, Sparkles, TrendingUp } from 'lucide-react';
import { MotionSurface } from '@/components/MotionSurface';
import type { Order } from '@/types';

export const dynamic = 'force-dynamic';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const hourFormatter = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  hour12: true,
  timeZone: 'Asia/Kolkata',
});

const statusPalette = {
  pending: { label: 'Pending', tone: 'amber' as const },
  preparing: { label: 'Preparing', tone: 'blue' as const },
  out_for_delivery: { label: 'Out for delivery', tone: 'violet' as const },
  delivered: { label: 'Delivered', tone: 'green' as const },
  cancelled: { label: 'Cancelled', tone: 'rose' as const },
};

export default async function AnalyticsPage() {
  const supabase = supabaseAdmin;
  const twelveHoursAgo = new Date(Date.now() - 11 * 60 * 60 * 1000);

  const [
    { count: totalOrders },
    { data: deliveredOrders },
    { data: statusWindowOrders },
    { data: trendWindowOrders },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('total_price').eq('status', 'delivered'),
    supabase
      .from('orders')
      .select('status, total_price, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('orders')
      .select('status, created_at')
      .gte('created_at', twelveHoursAgo.toISOString())
      .order('created_at', { ascending: true }),
  ]);

  const deliveredRevenue =
    deliveredOrders?.reduce((sum, order) => sum + (Number(order.total_price) || 0), 0) || 0;
  const averageTicket = totalOrders ? Math.round(deliveredRevenue / totalOrders) : 0;
  const activeSample = (statusWindowOrders || []) as Pick<Order, 'status' | 'created_at' | 'total_price'>[];
  const trendSeries = buildTrendSeries((trendWindowOrders || []) as Pick<Order, 'created_at'>[]);
  const statusRows = buildStatusRows(activeSample);
  const statusRowsTotal = activeSample.length || 1;

  return (
    <div className="space-y-8 reveal-stagger">
      <header className="page-header">
        <div>
          <p className="mono-label">Operational intelligence</p>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">A live view of revenue, throughput, and order behavior.</p>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MotionSurface hoverLift={-3} hoverScale={1.01}>
          <Metric
          label="Revenue"
          value={currencyFormatter.format(deliveredRevenue)}
          icon={<CircleDollarSign size={16} />}
          note="Delivered orders only"
        />
        </MotionSurface>
        <MotionSurface hoverLift={-3} hoverScale={1.01} delay={0.04}>
          <Metric
          label="Orders"
          value={`${totalOrders || 0}`}
          icon={<Receipt size={16} />}
          note="All-time count"
        />
        </MotionSurface>
        <MotionSurface hoverLift={-3} hoverScale={1.01} delay={0.08}>
          <Metric
          label="Avg ticket"
          value={currencyFormatter.format(averageTicket)}
          icon={<TrendingUp size={16} />}
          note="Per completed order"
        />
        </MotionSurface>
        <MotionSurface hoverLift={-3} hoverScale={1.01} delay={0.12}>
          <Metric
          label="Recent window"
          value={`${trendWindowOrders?.length || 0} orders`}
          icon={<Hourglass size={16} />}
          note="Last 12 hours"
        />
        </MotionSurface>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
        <MotionSurface as="section" className="card card-premium p-7" delay={0.1}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="mono-label text-[10px]">Trendline</p>
              <h2 className="mt-1 text-xl font-semibold" style={{ color: 'var(--ink)' }}>
                Delivery momentum
              </h2>
            </div>
            <Sparkles size={18} style={{ color: 'var(--ember)' }} />
          </div>

          <div className="mt-7 grid h-56 grid-cols-12 items-end gap-2">
            {trendSeries.map((bucket) => (
              <div key={bucket.label} className="group flex h-full items-end justify-center">
                <button
                  type="button"
                  title={`${bucket.label} - ${bucket.count} orders`}
                  aria-label={`${bucket.label}: ${bucket.count} orders`}
                  className="w-full rounded-full bg-[linear-gradient(180deg,rgba(232,84,10,0.24),rgba(232,84,10,0.95))] transition-transform duration-300 group-hover:scale-y-110"
                  style={{ height: `${bucket.height}%`, minHeight: '0.8rem' }}
                />
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2 text-xs" style={{ color: 'var(--stone)' }}>
            {trendSeries.filter((_, index) => index % 3 === 0).map((bucket) => (
              <span key={bucket.label} className="text-center">
                {bucket.label}
              </span>
            ))}
          </div>
        </MotionSurface>

        <MotionSurface as="section" className="card card-premium p-7" delay={0.16}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="mono-label text-[10px]">Status mix</p>
              <h2 className="mt-1 text-xl font-semibold" style={{ color: 'var(--ink)' }}>
                Latest order states
              </h2>
            </div>
            <BarChart3 size={18} style={{ color: 'var(--stone)' }} />
          </div>

          <div className="mt-7 space-y-3">
            {statusRows.map((row) => (
              <MotionSurface key={row.label} hoverLift={-2} hoverScale={1.005}>
                <StatRow
                  label={row.label}
                  count={row.count}
                  value={`${row.percent}%`}
                  total={statusRowsTotal}
                  tone={row.tone}
                />
              </MotionSurface>
            ))}
          </div>
        </MotionSurface>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card card-premium p-7">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="mono-label text-[9px] tracking-wider uppercase" style={{ opacity: 0.7 }}>
            {label}
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--stone)' }}>
            {note}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(232,84,10,0.1)] text-[var(--ember)]">
          {icon}
        </div>
      </div>
      <div className="font-serif text-3xl font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>
        {value}
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  count,
  total,
  tone,
}: {
  label: string;
  value: string;
  count: number;
  total: number;
  tone: 'amber' | 'blue' | 'violet' | 'green' | 'rose';
}) {
  const colors: Record<'amber' | 'blue' | 'violet' | 'green' | 'rose', string> = {
    amber: 'rgba(245, 158, 11, 0.18)',
    blue: 'rgba(59, 130, 246, 0.18)',
    violet: 'rgba(139, 92, 246, 0.18)',
    green: 'rgba(45, 106, 79, 0.18)',
    rose: 'rgba(239, 68, 68, 0.18)',
  };

  return (
    <div className="flex items-center justify-between rounded-2xl border border-[var(--border-default)] bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[tone] }} />
        <div>
          <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{label}</span>
          <p className="text-[11px]" style={{ color: 'var(--stone)' }}>
            {count} of {total}
          </p>
        </div>
      </div>
      <span className="font-mono text-sm" style={{ color: 'var(--stone)' }}>
        {value}
      </span>
    </div>
  );
}

function buildTrendSeries(orders: Pick<Order, 'created_at'>[]) {
  const buckets = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(Date.now() - (11 - index) * 60 * 60 * 1000);
    const label = hourFormatter.format(date);
    return {
      label,
      count: 0,
    };
  });

  const bucketLookup = new Map(buckets.map((bucket) => [bucket.label, bucket]));

  orders.forEach((order) => {
    const label = hourFormatter.format(new Date(order.created_at));
    const bucket = bucketLookup.get(label);
    if (bucket) {
      bucket.count += 1;
    }
  });

  const maxCount = Math.max(...buckets.map((bucket) => bucket.count), 1);

  return buckets.map((bucket) => ({
    ...bucket,
    height: Math.max(10, Math.round((bucket.count / maxCount) * 100)),
  }));
}

function buildStatusRows(orders: Pick<Order, 'status'>[]) {
  const counts = orders.reduce<Record<string, number>>((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(statusPalette).map(([status, config]) => ({
    label: config.label,
    tone: config.tone,
    count: counts[status] || 0,
    percent: orders.length ? Math.round(((counts[status] || 0) / orders.length) * 100) : 0,
  }));
}
