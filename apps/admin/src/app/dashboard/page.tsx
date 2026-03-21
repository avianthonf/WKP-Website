import Link from 'next/link';
import type React from 'react';
import {
  ArrowRight,
  Plus,
  Power,
  Receipt,
  Settings,
  ShoppingBag,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { MotionSurface } from '@/components/MotionSurface';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Order } from '@/types';

export const dynamic = 'force-dynamic';

const hourFormatter = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  hour12: true,
  timeZone: 'Asia/Kolkata',
});

export default async function DashboardPage() {
  const supabase = supabaseAdmin;
  const twelveHoursAgo = new Date(Date.now() - 11 * 60 * 60 * 1000);

  const [
    { count: totalOrders },
    { data: revenueData },
    { count: activeTickets },
    { data: siteStatus },
    { data: recentOrders },
    { data: trendOrders },
  ] = await Promise.all([
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('total_price').eq('status', 'delivered'),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'preparing', 'out_for_delivery']),
    supabase.from('site_config').select('value').eq('key', 'is_open').single(),
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
    supabase
      .from('orders')
      .select('created_at')
      .gte('created_at', twelveHoursAgo.toISOString())
      .order('created_at', { ascending: true }),
  ]);

  const totalRevenue =
    revenueData?.reduce((sum, order) => sum + (Number(order.total_price) || 0), 0) || 0;
  const isOpen = siteStatus?.value === 'true';
  const avgTicket = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
  const liveTone = isOpen ? 'Serving guests' : 'Kitchen paused';
  const sparkSeries = buildSparklineSeries((trendOrders || []) as Pick<Order, 'created_at'>[]);

  return (
    <div className="space-y-8 reveal-stagger">
      <MotionSurface as="header" className="dashboard-hero card card-premium" delay={0.02}>
        <div className="dashboard-hero__veil" aria-hidden="true" />
        <div className="dashboard-hero__grid">
          <div className="overview-hero__content dashboard-hero__content--center">
            <div className="dashboard-hero__eyebrow-row">
              <p className="mono-label">Control room</p>
              <span className={`dashboard-hero__live ${isOpen ? 'is-live' : 'is-muted'}`}>
                <span className="dashboard-hero__live-dot" />
                {liveTone}
              </span>
            </div>

            <h1
              className="page-title dashboard-hero__title"
              style={{ fontSize: 'clamp(2.3rem, 4.8vw, 4rem)', fontWeight: 600 }}
            >
              Live Overview
            </h1>

            <p className="page-subtitle dashboard-hero__subtitle">
              Real-time operational metrics, store status, and recent activity in one focused
              workspace.
            </p>

            <div className="dashboard-hero__chips">
              <span className="dashboard-chip">
                Revenue {'\u20B9'}
                {totalRevenue.toLocaleString('en-IN')}
              </span>
              <span className="dashboard-chip">Orders {totalOrders || 0}</span>
              <span className="dashboard-chip">
                Avg ticket {'\u20B9'}
                {avgTicket.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <aside className="dashboard-hero__panel">
            <div className="dashboard-snapshot">
              <div className="dashboard-snapshot__top">
                <div>
                  <p className="dashboard-snapshot__label">System snapshot</p>
                  <h2 className="dashboard-snapshot__title">Operations at a glance</h2>
                </div>
                <div className="dashboard-snapshot__pulse" />
              </div>

              <div className="dashboard-snapshot__stack">
                <div className="dashboard-snapshot__item">
                  <span className="dashboard-snapshot__key">Store</span>
                  <span className={`dashboard-snapshot__value ${isOpen ? 'is-good' : 'is-danger'}`}>
                    {isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="dashboard-snapshot__item">
                  <span className="dashboard-snapshot__key">Active tickets</span>
                  <span className="dashboard-snapshot__value">{activeTickets || 0}</span>
                </div>
                <div className="dashboard-snapshot__item">
                  <span className="dashboard-snapshot__key">Recent orders</span>
                  <span className="dashboard-snapshot__value">{recentOrders?.length || 0}</span>
                </div>
              </div>

              <div className="dashboard-snapshot__footer">
                <Link
                  href="/dashboard/orders"
                  className="btn-primary inline-flex items-center gap-2.5 px-5 py-3 group"
                >
                  <span>Open Active Orders</span>
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </aside>

          <div className="overview-hero__actions dashboard-hero__actions--center">
            <Link
              href="/dashboard/orders"
              className="btn-primary inline-flex items-center gap-2.5 px-6 py-3 group"
            >
              <span>View Active Orders</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/dashboard/pizzas/new"
              className="btn-ghost inline-flex items-center gap-2.5 border-2 border-[var(--border-default)] px-6 py-3 hover:border-[var(--ember)] hover:bg-white group"
            >
              <Plus size={16} className="transition-transform group-hover:scale-110" />
              <span>Add New Pizza</span>
            </Link>
            <Link
              href="/dashboard/settings"
              className="btn-ghost inline-flex items-center gap-2.5 border-2 border-[var(--border-default)] px-6 py-3 hover:border-[var(--stone)] hover:bg-[var(--surface-secondary)]"
            >
              <Settings size={16} />
              <span>Settings</span>
            </Link>
          </div>
        </div>
      </MotionSurface>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <MotionSurface hoverLift={-5} hoverScale={1.01}>
          <MetricCard
            label="Total Revenue"
            value={`${'\u20B9'}${totalRevenue.toLocaleString('en-IN')}`}
            accent="var(--ember)"
            hint="+12.5% vs last month"
            icon={<TrendingUp size={16} style={{ color: 'var(--ember)' }} />}
            iconBackground="var(--ember-light)"
            sparkTone="ember"
            sparkSeries={sparkSeries}
          />
        </MotionSurface>
        <MotionSurface hoverLift={-5} hoverScale={1.01} delay={0.04}>
          <MetricCard
            label="Total Orders"
            value={`${totalOrders || 0}`}
            accent="var(--ink)"
            hint="+8.2% vs last month"
            icon={<Receipt size={16} style={{ color: 'var(--ember)' }} />}
            iconBackground="var(--ember-light)"
            sparkTone="neutral"
            sparkSeries={sparkSeries}
          />
        </MotionSurface>
        <MotionSurface hoverLift={-5} hoverScale={1.01} delay={0.08}>
          <MetricCard
            label="Active Tickets"
            value={`${activeTickets || 0}`}
            accent="var(--success)"
            hint="Requires attention"
            icon={<Zap size={16} style={{ color: 'var(--success)' }} />}
            iconBackground="rgba(22, 163, 74, 0.12)"
            className="card-emerald"
            glowColor="var(--success)"
            sparkTone="success"
            sparkSeries={sparkSeries}
          />
        </MotionSurface>
        <MotionSurface hoverLift={-5} hoverScale={1.01} delay={0.12}>
          <MetricCard
            label="Store Status"
            value={isOpen ? 'Open' : 'Closed'}
            accent={isOpen ? 'var(--success)' : 'var(--danger)'}
            hint={isOpen ? 'Accepting new orders' : 'Storefront intake paused'}
            icon={<Power size={16} style={{ color: isOpen ? 'var(--success)' : 'var(--danger)' }} />}
            iconBackground={isOpen ? 'rgba(22, 163, 74, 0.12)' : 'rgba(220, 38, 38, 0.12)'}
            className={isOpen ? 'card-emerald' : 'card-rose'}
            glowColor={isOpen ? 'var(--success)' : 'var(--danger)'}
            sparkTone={isOpen ? 'success' : 'danger'}
            sparkSeries={sparkSeries}
          />
        </MotionSurface>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.65fr_0.95fr]">
        <MotionSurface as="section" className="card card-premium animate-fade-in" delay={0.12}>
          <div className="dashboard-section-header">
            <div>
              <h2 className="dashboard-section-title">Recent Orders</h2>
              <p className="mono-label text-[10px] mt-1" style={{ opacity: 0.7 }}>
                Latest transactions
              </p>
            </div>
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center gap-2 text-sm font-semibold transition-all hover:gap-2.5 group"
              style={{ color: 'var(--ember)' }}
            >
              <span>View All</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="table-wrap border-0 shadow-none dashboard-orders-table">
            <table>
              <thead>
                <tr>
                  <th data-label="Order #" style={{ minWidth: '100px' }}>
                    Order #
                  </th>
                  <th data-label="Customer">Customer</th>
                  <th data-label="Amount" style={{ minWidth: '120px' }}>
                    Amount
                  </th>
                  <th data-label="Status" style={{ minWidth: '140px' }}>
                    Status
                  </th>
                  <th data-label="Time" style={{ minWidth: '100px' }}>
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders?.map((order: Order, index: number) => (
                  <tr key={order.id} className="group hover:bg-[var(--surface-hover)] transition-all" style={{ animationDelay: `${index * 50}ms` }}>
                    <td data-label="Order #">
                      <span className="font-mono font-bold text-sm" style={{ color: 'var(--ember)' }}>
                        #{order.order_number}
                      </span>
                    </td>
                    <td data-label="Customer">
                      <span style={{ color: 'var(--ink)', fontWeight: 500 }}>
                        {order.customer_name}
                      </span>
                    </td>
                    <td data-label="Amount">
                      <span className="font-mono font-medium" style={{ color: 'var(--ink)' }}>
                        {'\u20B9'}
                        {Number(order.total_price).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td data-label="Status">
                      <StatusBadge status={order.status} />
                    </td>
                    <td
                      data-label="Time"
                      className="text-sm"
                      style={{ color: 'var(--stone)', fontFamily: "'DM Mono', monospace" }}
                    >
                      {new Date(order.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}

                {(!recentOrders || recentOrders.length === 0) && (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                        <div className="relative mb-4">
                          <ShoppingBag size={56} className="mx-auto" style={{ color: 'var(--linen)' }} />
                          <div
                            className="absolute inset-0 blur-2xl opacity-30"
                            style={{
                              background:
                                'radial-gradient(circle, var(--ember-light) 0%, transparent 70%)',
                            }}
                          />
                        </div>
                        <div>
                          <h3
                            className="mb-2 text-lg font-medium"
                            style={{
                              color: 'var(--ink)',
                              fontFamily: "'Cormorant Garamond', serif",
                            }}
                          >
                            No Orders Yet
                          </h3>
                          <p className="mb-4 text-sm" style={{ color: 'var(--stone)', maxWidth: '280px' }}>
                            Your first order will appear here once a customer places an order.
                          </p>
                          <Link href="/dashboard/orders" className="btn-primary inline-flex gap-2 px-6 py-3">
                            <Receipt size={16} />
                            <span>View Orders</span>
                          </Link>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </MotionSurface>

        <aside className="space-y-6">
          <MotionSurface as="section" className="card card-premium p-6 animate-fade-in" delay={0.18}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="mono-label text-[10px]">Performance</p>
                <h2 className="mt-1 text-xl font-semibold" style={{ color: 'var(--ink)' }}>
                  Today&apos;s rhythm
                </h2>
              </div>
              <Sparkline bars={sparkSeries} />
            </div>
            <div className="mt-6 grid gap-4">
              <MiniSignal label="Kitchen" value={isOpen ? 'In service' : 'Paused'} tone={isOpen ? 'good' : 'warn'} />
              <MiniSignal label="Throughput" value={activeTickets ? `${activeTickets} live jobs` : 'Clear lane'} tone="neutral" />
              <MiniSignal label="Order velocity" value={`${Math.max(totalOrders ? Math.round(totalOrders / 6) : 0, 1)} / hr`} tone="accent" />
            </div>
          </MotionSurface>

          <MotionSurface as="section" className="card card-premium p-6 animate-fade-in" delay={0.24}>
            <div className="flex items-center justify-between">
              <div>
                <p className="mono-label text-[10px]">Actions</p>
                <h2 className="mt-1 text-xl font-semibold" style={{ color: 'var(--ink)' }}>
                  Fast lanes
                </h2>
              </div>
              <div className="dashboard-meter" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <Link href="/dashboard/pizzas/new" className="dashboard-quicklink">
                <span className="dashboard-quicklink__icon">
                  <Plus size={16} />
                </span>
                <span className="dashboard-quicklink__stack">
                  <span className="dashboard-quicklink__label">New pizza recipe</span>
                  <span className="dashboard-quicklink__note">Build</span>
                </span>
              </Link>
              <Link href="/dashboard/settings" className="dashboard-quicklink">
                <span className="dashboard-quicklink__icon">
                  <Settings size={16} />
                </span>
                <span className="dashboard-quicklink__stack">
                  <span className="dashboard-quicklink__label">Store settings</span>
                  <span className="dashboard-quicklink__note">Tune</span>
                </span>
              </Link>
              <Link href="/dashboard/orders/history" className="dashboard-quicklink">
                <span className="dashboard-quicklink__icon">
                  <Receipt size={16} />
                </span>
                <span className="dashboard-quicklink__stack">
                  <span className="dashboard-quicklink__label">Order history</span>
                  <span className="dashboard-quicklink__note">Review</span>
                </span>
              </Link>
            </div>
          </MotionSurface>
        </aside>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon,
  iconBackground,
  accent,
  className = 'card-premium',
  glowColor,
  sparkTone,
  sparkSeries,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  iconBackground: string;
  accent: string;
  className?: string;
  glowColor?: string;
  sparkTone: 'ember' | 'neutral' | 'success' | 'danger';
  sparkSeries: Array<{ id: string; label: string; count: number; height: number }>;
}) {
  return (
    <div className={`card ${className} dashboard-metric-card group relative overflow-hidden p-6`}>
      <div
        className="dashboard-metric-card__orb"
        style={{ background: glowColor || accent }}
      />
      <div className="relative z-10 flex h-full min-h-[14rem] flex-col">
        <div className="dashboard-metric-card__top">
          <div className="dashboard-metric-card__label-stack">
            <p className="mono-label text-[9px] tracking-wider uppercase" style={{ opacity: 0.7 }}>
              {label}
            </p>
            <span className="dashboard-metric-card__window">Last 30 days</span>
          </div>
          <div className="dashboard-metric-card__icon" style={{ background: iconBackground }}>
            {icon}
          </div>
        </div>

        <div className="dashboard-metric-card__body">
          <p
            className="dashboard-metric-card__value"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              color: accent,
            }}
          >
            {value}
          </p>
          <p className="dashboard-metric-card__copy">
            {label === 'Store Status'
              ? value === 'Open'
                ? 'Accepting new orders'
                : 'Storefront intake paused'
              : label === 'Active Tickets'
              ? 'Tickets requiring attention'
              : label === 'Total Revenue'
              ? 'Delivered revenue only'
              : 'Updated live from Supabase'}
          </p>
        </div>

        <div className="dashboard-metric-card__footer mt-auto">
          <div className="dashboard-metric-card__footer-row">
            <div className="dashboard-sparkline dashboard-sparkline--small" aria-hidden="true">
              {sparkSeries.map((bar) => (
                <span
                  key={bar.id}
                  data-tone={sparkTone}
                  title={`${bar.label} · ${bar.count} orders`}
                  style={{ height: `${Math.max(0.45, bar.height / 100)}rem` }}
                />
              ))}
            </div>
            <span className="dashboard-metric-card__delta">{hint}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    pending: {
      background: '#fef3c7',
      color: '#92400e',
      boxShadow: '0 0 0 1px rgba(252, 211, 77, 0.3) inset',
    },
    preparing: {
      background: '#dbeafe',
      color: '#1e40af',
      boxShadow: '0 0 0 1px rgba(147, 197, 253, 0.3) inset',
    },
    out_for_delivery: {
      background: '#ede9fe',
      color: '#5b21b6',
      boxShadow: '0 0 0 1px rgba(196, 181, 253, 0.3) inset',
    },
    delivered: {
      background: '#dcfce7',
      color: '#166534',
      boxShadow: '0 0 0 1px rgba(134, 239, 172, 0.3) inset',
    },
    cancelled: {
      background: '#fee2e2',
      color: '#991b1b',
      boxShadow: '0 0 0 1px rgba(252, 165, 165, 0.3) inset',
    },
  };

  const style = styles[status] || styles.pending;

  return (
    <span
      className="badge inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider"
      style={{
        ...style,
        border: 'none',
        borderRadius: '9999px',
        fontWeight: 600,
      }}
    >
      {status === 'out_for_delivery' && (
        <div
          className="h-1.5 w-1.5 rounded-full animate-pulse"
          style={{ background: 'currentColor', opacity: 0.7 }}
        />
      )}
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function MiniSignal({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'good' | 'warn' | 'neutral' | 'accent';
}) {
  return (
    <div className={`dashboard-signal dashboard-signal--${tone}`}>
      <span className="dashboard-signal__label">{label}</span>
      <span className="dashboard-signal__value">{value}</span>
    </div>
  );
}

function Sparkline({ bars }: { bars: Array<{ id: string; label: string; count: number; height: number }> }) {
  return (
    <div className="dashboard-sparkline" aria-hidden="true">
      {bars.map((bar) => (
        <span
          key={bar.id}
          title={`${bar.label} · ${bar.count} orders`}
          style={{ height: `${Math.max(0.65, bar.height / 90)}rem` }}
        />
      ))}
    </div>
  );
}

function buildSparklineSeries(orders: Pick<Order, 'created_at'>[]) {
  const latest = orders[orders.length - 1] ? new Date(orders[orders.length - 1].created_at) : new Date();
  const earliest = orders[0] ? new Date(orders[0].created_at) : new Date(latest.getTime() - 5 * 60 * 60 * 1000);
  const span = Math.max(latest.getTime() - earliest.getTime(), 5 * 60 * 60 * 1000);
  const bucketMs = span / 6;

  const buckets = Array.from({ length: 6 }, (_, index) => {
    const bucketStart = new Date(earliest.getTime() + index * bucketMs);
    return {
      id: `bucket-${index}`,
      label: hourFormatter.format(bucketStart),
      count: 0,
      height: 0,
    };
  });

  orders.forEach((order) => {
    const orderDate = new Date(order.created_at);
    const bucketIndex = Math.min(Math.floor((orderDate.getTime() - earliest.getTime()) / bucketMs), 5);
    buckets[Math.max(bucketIndex, 0)].count += 1;
  });

  const maxCount = Math.max(...buckets.map((bucket) => bucket.count), 1);

  return buckets.map((bucket) => ({
    ...bucket,
    height: Math.max(12, Math.round((bucket.count / maxCount) * 100)),
  }));
}
