'use server';

import { createClient } from '@supabase/supabase-js';
import { env } from './lib/env';
import { formatStoreDateTime, getStoreAvailabilityFromConfig, resolveScheduledOrderTime } from './lib/store-hours';
import { buildWhatsAppMessage, buildWhatsAppUrl } from './lib/whatsapp';
import { slugify } from './lib/storefront';
import type { CartLine, PaymentMethod, PaymentStatus } from './lib/types';
import { z } from 'zod';

const orderSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(6).optional(),
  fulfillment: z.enum(['delivery', 'pickup']),
  deliveryAddress: z.string().optional(),
  manualAddress: z.string().optional(),
  scheduledTime: z.string().optional(),
  deliveryLocation: z
    .object({
      mapUrl: z.string().url(),
      latitude: z.number(),
      longitude: z.number(),
      accuracyMeters: z.number().nonnegative().optional().nullable(),
    })
    .optional(),
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
  const getConfig = (key: string, fallback = '') => config[key] || fallback;
  const openingWindow = `${getConfig('opening_time', '11:00')} - ${getConfig('closing_time', '23:00')}`;
  const withHours = (value: string) => value.replace('{hours}', openingWindow);

  const storeName = getConfig('store_name', getConfig('hero_title'));
  const whatsappNumber = getConfig('whatsapp_number');
  const availability = getStoreAvailabilityFromConfig(config);

  if (!storeName) {
    throw new Error(
      getConfig('cart_missing_store_name_message', 'Store name is missing. Please try again in a moment.')
    );
  }

  if (!whatsappNumber) {
    throw new Error(
      getConfig(
        'cart_missing_whatsapp_number_message',
        'Order chat is not configured yet. Please contact the store directly.'
      )
    );
  }

  if (availability.mode === 'maintenance') {
    throw new Error(
      getConfig(
        'cart_paused_maintenance_message',
        'Orders are paused while the storefront is in maintenance mode.'
      )
    );
  }

  if (availability.mode === 'closed') {
    throw new Error(
      getConfig(
        'cart_paused_closed_message',
        'Orders are currently closed. Please try again when the store is open.'
      )
    );
  }

  const pickupNoteLabel = getConfig('cart_pickup_note_label', 'Pickup note');
  const pickupRequestedNote = getConfig('cart_pickup_requested_note', 'Pickup requested');
  const manualDeliveryAddress = data.manualAddress?.trim() || data.deliveryAddress?.trim() || undefined;
  const deliveryLocation = data.deliveryLocation;
  const deliveryLocationSource =
    deliveryLocation && manualDeliveryAddress
      ? 'mixed'
      : deliveryLocation
        ? 'geolocation'
        : manualDeliveryAddress
          ? 'manual'
          : null;

  if (data.fulfillment === 'delivery' && manualDeliveryAddress && manualDeliveryAddress.length < 8 && !deliveryLocation) {
    throw new Error(
      getConfig('cart_missing_address_message', 'Please add a delivery address or switch to pickup.')
    );
  }

  if (data.fulfillment === 'delivery' && !manualDeliveryAddress && !deliveryLocation) {
    throw new Error(
      getConfig(
        'cart_location_missing_message',
        'Share a pinned location or type the delivery address before sending the order.'
      )
    );
  }

  let scheduledFor: Date | null = null;
  let scheduledForLabel: string | undefined;
  if (availability.mode === 'after_hours') {
    if (!data.scheduledTime?.trim()) {
      throw new Error(
        withHours(
          getConfig(
            'cart_schedule_required_message',
            'Choose a delivery time within {hours} before placing the order.'
          )
        )
      );
    }

    const scheduleResolution = resolveScheduledOrderTime(config, data.scheduledTime.trim());
    if (!scheduleResolution.valid) {
      throw new Error(
        withHours(
          getConfig(
            'cart_schedule_invalid_message',
            'Choose a valid delivery time within {hours}.'
          )
        )
      );
    }

    scheduledFor = scheduleResolution.scheduledFor;
    scheduledForLabel = formatStoreDateTime(scheduleResolution.scheduledFor, scheduleResolution.timeZone);
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name: data.customerName,
      customer_phone: data.customerPhone || null,
      fulfillment_type: data.fulfillment,
      delivery_address: data.fulfillment === 'delivery' ? manualDeliveryAddress || null : null,
      delivery_location_url: data.fulfillment === 'delivery' ? deliveryLocation?.mapUrl || null : null,
      delivery_location_source: data.fulfillment === 'delivery' ? deliveryLocationSource : null,
      delivery_location_accuracy_meters:
        data.fulfillment === 'delivery' ? deliveryLocation?.accuracyMeters ?? null : null,
      delivery_latitude: data.fulfillment === 'delivery' ? deliveryLocation?.latitude ?? null : null,
      delivery_longitude: data.fulfillment === 'delivery' ? deliveryLocation?.longitude ?? null : null,
      scheduled_for: scheduledFor?.toISOString() || null,
      total_price: data.total,
      status: 'pending',
      payment_method: 'cash' satisfies PaymentMethod,
      payment_status: 'pending' satisfies PaymentStatus,
      notes:
        [
          data.notes?.trim() || null,
          data.fulfillment === 'pickup'
            ? data.pickupNote?.trim()
              ? `${pickupNoteLabel}: ${data.pickupNote.trim()}`
              : pickupRequestedNote
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
    deliveryAddress: data.fulfillment === 'delivery' ? manualDeliveryAddress : data.pickupNote,
    deliveryLocationUrl: data.fulfillment === 'delivery' ? deliveryLocation?.mapUrl : undefined,
    scheduledFor: scheduledForLabel,
    notes: data.notes,
    items: data.items,
    total: data.total,
    storeName,
    sizeNames: {
      small: getConfig('size_small_name', 'Small'),
      medium: getConfig('size_medium_name', 'Medium'),
      large: getConfig('size_large_name', 'Large'),
    },
    copy: {
      headingLabel: getConfig('cart_whatsapp_heading_label', 'Order'),
      orderNumberPrefix: getConfig('cart_whatsapp_order_number_prefix', '#'),
      nameLabel: getConfig('cart_whatsapp_name_label', 'Name'),
      fulfillmentLabel: getConfig('cart_whatsapp_fulfillment_label', 'Fulfillment'),
      deliveryLabel: getConfig('cart_whatsapp_delivery_label', 'Delivery'),
      pickupLabel: getConfig('cart_whatsapp_pickup_label', 'Pickup'),
      phoneLabel: getConfig('cart_whatsapp_phone_label', 'Phone'),
      addressLabel: getConfig('cart_whatsapp_address_label', 'Address'),
      locationLinkLabel: getConfig('cart_whatsapp_location_link_label', 'Location pin'),
      pickupNoteLabel: getConfig('cart_whatsapp_pickup_note_label', 'Pickup note'),
      notesLabel: getConfig('cart_whatsapp_notes_label', 'Notes'),
      scheduleLabel: getConfig('cart_whatsapp_schedule_label', 'Scheduled for'),
      itemsHeading: getConfig('cart_whatsapp_items_heading', 'Items'),
      totalLabel: getConfig('cart_whatsapp_total_label', 'Total'),
      currencyLabel: getConfig('cart_whatsapp_currency_label', 'INR'),
    },
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
