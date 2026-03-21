'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCorners, DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { createClient } from '@/lib/supabaseClient';
import { Order, OrderStatus } from '@/types';
import { updateOrderStatus } from './actions';
import { toast } from 'react-hot-toast';
import OrderCard from './OrderCard';

const COLUMNS = [
  { id: 'pending', label: 'Pending', color: 'yellow', badgeColor: '#fef3c7', badgeText: '#92400e', borderColor: '#fbbf24' },
  { id: 'preparing', label: 'Preparing', color: 'blue', badgeColor: '#dbeafe', badgeText: '#1e40af', borderColor: '#3b82f6' },
  { id: 'out_for_delivery', label: 'Out for Delivery', color: 'purple', badgeColor: '#ede9fe', badgeText: '#5b21b6', borderColor: '#8b5cf6' },
];

interface KanbanBoardProps {
  initialOrders: Order[];
}

export default function KanbanBoard({ initialOrders }: KanbanBoardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeId, setActiveId] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Real-time subscription for order updates
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const eventType = payload.eventType;
          const order = payload.new as Order;

          setOrders((prev) => {
            // Remove old if update/delete, add/update new
            if (eventType === 'DELETE') {
              return prev.filter((o) => o.id !== payload.old.id);
            }
            // For UPDATE or INSERT, update or add
            if (eventType === 'UPDATE') {
              return prev.map((o) => (o.id === order.id ? order : o));
            }
            // INSERT - add if it's an active order, otherwise ignore (history is separate)
            if (['pending', 'preparing', 'out_for_delivery'].includes(order.status)) {
              // Avoid duplicates
              if (prev.some((o) => o.id === order.id)) {
                return prev;
              }
              return [...prev, order].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            }
            // If order moved to history status, remove from board
            return prev.filter((o) => o.id !== order.id);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeOrderId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column (over.id is a column status)
    const targetColumn = COLUMNS.find((col) => col.id === overId);
    if (!targetColumn) return;

    const activeOrder = orders.find((o) => o.id === activeOrderId);
    if (!activeOrder) return;

    // If already in this column, do nothing
    if (activeOrder.status === targetColumn.id) return;

    // Optimistic update
    setOrders((prev) =>
      prev.map((o) =>
        o.id === activeOrderId ? { ...o, status: targetColumn.id as OrderStatus } : o
      )
    );

    try {
      await updateOrderStatus(activeOrderId, targetColumn.id as OrderStatus);
      toast.success(`Order moved to ${targetColumn.label}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order status');
      // Revert on error
      setOrders((prev) =>
        prev.map((o) =>
          o.id === activeOrderId ? { ...o, status: activeOrder.status } : o
        )
      );
    }
  };

  // Group orders by status
  const getOrdersByStatus = (status: string) => {
    return orders.filter((order) => order.status === status).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board flex flex-col gap-6 pb-4 md:flex-row md:items-start md:overflow-x-auto">
        {COLUMNS.map((col) => {
          const columnOrders = getOrdersByStatus(col.id);
          return (
            <motion.div
              key={col.id}
              className="kanban-column flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-t border-r border-b bg-gray-50 md:w-80 md:shrink-0"
              style={{ borderLeftColor: col.borderColor }}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16, scale: 0.99 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: COLUMNS.findIndex((item) => item.id === col.id) * 0.06 }}
            >
              {/* Column Header */}
              <motion.div
                className="kanban-column__header flex shrink-0 items-center justify-between border-b border-[#E5E5E0] bg-white px-4 py-4 shadow-sm"
                initial={prefersReducedMotion ? false : { opacity: 0, y: -6 }}
                animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.04 }}
              >
                <h3 className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>
                  {col.label}
                </h3>
                <span
                  className="px-2 py-0.5 rounded text-xs font-mono"
                  style={{
                    background: col.badgeColor,
                    color: col.badgeText,
                  }}
                >
                  {columnOrders.length}
                </span>
              </motion.div>

              {/* Column Content */}
              <motion.div
                className="kanban-column__body flex min-h-[200px] flex-1 flex-col gap-4 overflow-visible p-4 md:overflow-y-auto"
                layout
              >
                <SortableContext
                  items={columnOrders.map((o) => o.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {columnOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </SortableContext>

                {columnOrders.length === 0 && (
                  <div
                    className="flex-1 flex items-center justify-center text-sm"
                    style={{ color: 'var(--stone)', opacity: 0.6 }}
                  >
                    No orders
                  </div>
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </DndContext>
  );
}
