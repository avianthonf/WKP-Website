'use server';

import { createClient } from '@supabase/supabase-js';
import { env } from './lib/env';
import { buildWhatsAppMessage, buildWhatsAppUrl } from './lib/whatsapp';
import { slugify } from './lib/storefront';
import type { CartLine, PaymentMethod, PaymentStatus } from './lib/types';
import { z } from 'zod';

const orderSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(6).optional(),
  fulfillment: z.enum(['delivery', 'pickup']),
  deliveryAddress: z.string().optional(),
  pickupNote: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(['pizza', 'extra', 'addon', 'dessert']),
      sourceId: z.string(),
      name: z.string(),
      imageUrl: z.string().optional().nullable(),
      size: z.enum(['small', 'medium', 'large']).optional(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().nonnegative(),
      notes: z.string().optional(),
      extras: z.array(z.object({ id: z.string(), name: z.string(), price: z.number() })).optional(),
      customization: z.record(z.any()).optional(),
    })
  ).min(1),
  total: z.number().nonnegative(),
});

function createServiceClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

async function nextOrderNumber(supabase: ReturnType<typeof createServiceClient>) {
  const { data, error } = await supabase
    .from('orders')
    .select('order_number')
    .order('order_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data?.order_number || 0) + 1;
}

export async function createWhatsAppOrder(payload: z.infer<typeof orderSchema>) {
  const data = orderSchema.parse(payload);
  const supabase = createServiceClient();

  const { data: configRows, error: configError } = await supabase
    .from('site_config')
    .select('key, value');

  if (configError) throw configError;

  const config = (configRows || []).reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});

  const orderNumber = await nextOrderNumber(supabase);
  const storeName = config.store_name || config.hero_title;
  const whatsappNumber = config.whatsapp_number;

  if (!storeName) {
    throw new Error('Missing store name in site_config');
  }

  if (!whatsappNumber) {
    throw new Error('Missing WhatsApp number in site_config');
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      customer_name: data.customerName,
      customer_phone: data.customerPhone || null,
      delivery_address: data.fulfillment === 'delivery' ? data.deliveryAddress || null : null,
      total_price: data.total,
      status: 'pending',
      payment_method: 'cash' satisfies PaymentMethod,
      payment_status: 'pending' satisfies PaymentStatus,
      notes:
        [
          data.notes?.trim() || null,
          data.fulfillment === 'pickup'
            ? data.pickupNote?.trim()
              ? `Pickup note: ${data.pickupNote.trim()}`
              : 'Pickup requested'
            : null,
        ]
          .filter(Boolean)
          .join(' - ') || null,
    })
    .select('id, order_number')
    .single();

  if (orderError) throw orderError;

  const orderItems = data.items.map((item: CartLine) => ({
    order_id: order.id,
    item_type: item.kind,
    pizza_id: item.kind === 'pizza' ? item.sourceId : null,
    extra_id: item.kind === 'extra' ? item.sourceId : null,
    addon_id: item.kind === 'addon' ? item.sourceId : null,
    dessert_id: item.kind === 'dessert' ? item.sourceId : null,
    size: item.size || null,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    extras_json: item.extras || null,
    customization_json: item.customization || null,
  }));

  const { error: orderItemsError } = await supabase.from('order_items').insert(orderItems);
  if (orderItemsError) throw orderItemsError;

  const whatsappMessage = buildWhatsAppMessage({
    orderNumber: order.order_number,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    fulfillment: data.fulfillment,
    deliveryAddress: data.fulfillment === 'delivery' ? data.deliveryAddress : data.pickupNote,
    notes: data.notes,
    items: data.items,
    total: data.total,
    storeName,
  });

  return {
    orderId: order.id,
    orderNumber: order.order_number,
    whatsappUrl: buildWhatsAppUrl(whatsappNumber, whatsappMessage),
  };
}

export async function previewSlug(name: string) {
  return slugify(name);
}
