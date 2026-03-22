insert into public.site_config (key, value, label, type, description, is_public)
values
  ('cart_open_order_prefill_message', 'Hi, I would like to place an order from the website.', 'Open order prefill message', 'textarea', 'Prefilled message used when opening the order chat before checkout.', true),
  ('cart_missing_store_name_message', 'Store name is missing. Please try again in a moment.', 'Missing store name message', 'textarea', 'Error shown if the storefront is missing the store name setting.', true),
  ('cart_missing_whatsapp_number_message', 'Order chat is not configured yet. Please contact the store directly.', 'Missing order number message', 'textarea', 'Error shown if the storefront is missing the order chat number.', true),
  ('cart_pickup_requested_note', 'Pickup requested', 'Pickup requested note', 'text', 'Stored note text when a pickup order is sent without a pickup note.', true),
  ('cart_whatsapp_heading_label', 'Order', 'WhatsApp heading label', 'text', 'Heading label used in the generated order message.', true),
  ('cart_whatsapp_order_number_prefix', '#', 'WhatsApp order number prefix', 'text', 'Prefix shown before the order number in the generated order message.', true),
  ('cart_whatsapp_name_label', 'Name', 'WhatsApp name label', 'text', 'Label for the customer name in the generated order message.', true),
  ('cart_whatsapp_fulfillment_label', 'Fulfillment', 'WhatsApp fulfillment label', 'text', 'Label for the fulfillment row in the generated order message.', true),
  ('cart_whatsapp_delivery_label', 'Delivery', 'WhatsApp delivery label', 'text', 'Value used for delivery orders in the generated order message.', true),
  ('cart_whatsapp_pickup_label', 'Pickup', 'WhatsApp pickup label', 'text', 'Value used for pickup orders in the generated order message.', true),
  ('cart_whatsapp_phone_label', 'Phone', 'WhatsApp phone label', 'text', 'Label for the customer phone row in the generated order message.', true),
  ('cart_whatsapp_address_label', 'Address', 'WhatsApp address label', 'text', 'Label for the delivery address row in the generated order message.', true),
  ('cart_whatsapp_pickup_note_label', 'Pickup note', 'WhatsApp pickup note label', 'text', 'Label for the pickup note row in the generated order message.', true),
  ('cart_whatsapp_notes_label', 'Notes', 'WhatsApp notes label', 'text', 'Label for the notes row in the generated order message.', true),
  ('cart_whatsapp_items_heading', 'Items', 'WhatsApp items heading', 'text', 'Heading above the line items in the generated order message.', true),
  ('cart_whatsapp_total_label', 'Total', 'WhatsApp total label', 'text', 'Label for the total row in the generated order message.', true),
  ('cart_whatsapp_currency_label', 'INR', 'WhatsApp currency label', 'text', 'Currency label used in the generated order message.', true)
on conflict (key) do update
set
  label = excluded.label,
  type = excluded.type,
  description = excluded.description,
  is_public = excluded.is_public;
