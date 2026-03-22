import { motion, useReducedMotion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, MapPin } from 'lucide-react';
import { Order, OrderItem } from '@/types';

interface OrderCardProps {
  order: Order;
}

export default function OrderCard({ order }: OrderCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: order.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const waitTimeMins = Math.floor((Date.now() - new Date(order.created_at).getTime()) / (1000 * 60));
  const displayItems = ((order.order_items as OrderItem[]) || []).slice(0, 3);
  const moreCount = (order.order_items?.length || 0) - 3;
  const scheduleLabel = order.scheduled_for
    ? new Date(order.scheduled_for).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;
  const locationLabel = order.delivery_address || (order.delivery_location_url ? 'Pinned location shared' : null);

  const getItemName = (item: OrderItem): string => {
    if (item.pizzas?.name) return item.pizzas.name;
    if (item.extras?.name) return item.extras.name;
    if (item.addons?.name) return item.addons.name;
    if (item.desserts?.name) return item.desserts.name;
    return 'Unknown item';
  };

  const formatItemLine = (item: OrderItem): string => {
    const name = getItemName(item);
    const size = item.size ? `(${item.size.charAt(0).toUpperCase()})` : '';
    return `${item.quantity}x ${name} ${size}`.trim();
  };

  const formatPayment = (method: string) => method.toUpperCase();

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
      whileHover={prefersReducedMotion ? {} : { y: -4, scale: 1.01 }}
      whileTap={prefersReducedMotion ? {} : { scale: 0.995 }}
      className={`order-card bg-white border rounded-[1.15rem] p-5 shadow-sm cursor-grab active:cursor-grabbing transition-all ${
        isDragging
          ? 'opacity-50 border-[#E8540A] scale-105 z-50 shadow-lg'
          : 'border-[#E5E5E0] hover:border-[#8C7E6A]'
      }`}
    >
      <div className="order-card__top mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold" style={{ color: 'var(--ember)' }}>
            #{order.order_number}
          </span>
          {waitTimeMins > 30 && order.status !== 'delivered' && (
            <span className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white animate-pulse">
              HOT
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--stone)' }}>
          <Clock size={12} />
          <span>{waitTimeMins}m</span>
        </div>
      </div>

      <div className="order-card__customer mb-4">
        <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
          {order.customer_name}
        </div>
        {locationLabel && (
          <div className="mt-1 flex items-center gap-1 truncate text-xs" style={{ color: 'var(--stone)' }}>
            <MapPin size={12} />
            <span className="truncate max-w-[12rem] sm:max-w-[200px]">
              {locationLabel}
            </span>
          </div>
        )}
        {scheduleLabel && (
          <div className="mt-1 flex items-center gap-1 text-xs" style={{ color: 'var(--stone)' }}>
            <Clock size={12} />
            <span>Scheduled {scheduleLabel}</span>
          </div>
        )}
      </div>

      <div className="order-card__items mb-4 border-t border-[#E5E5E0] pt-3">
        {displayItems.map((item, idx) => (
          <div key={idx} className="mb-1.5 text-xs" style={{ color: 'var(--stone)' }}>
            {formatItemLine(item)}
          </div>
        ))}
        {moreCount > 0 && (
          <div className="text-xs" style={{ color: 'var(--stone)' }}>
            +{moreCount} more
          </div>
        )}
      </div>

      <div className="order-card__footer flex items-center justify-between gap-3 border-t border-dashed border-[#E5E5E0] pt-3">
        <span className="text-xs uppercase" style={{ color: 'var(--stone)' }}>
          {formatPayment(order.payment_method)}
        </span>
        <span className="font-mono font-bold" style={{ color: 'var(--ink)' }}>
          Rs. {Number(order.total_price).toLocaleString('en-IN')}
        </span>
      </div>
    </motion.div>
  );
}
