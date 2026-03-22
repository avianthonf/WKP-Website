import type { CartLine } from './types';

type WhatsAppFulfillment = 'delivery' | 'pickup';

type WhatsAppCopy = {
  headingLabel: string;
  orderNumberPrefix: string;
  nameLabel: string;
  fulfillmentLabel: string;
  deliveryLabel: string;
  pickupLabel: string;
  phoneLabel: string;
  addressLabel: string;
  locationLinkLabel: string;
  pickupNoteLabel: string;
  notesLabel: string;
  scheduleLabel: string;
  itemsHeading: string;
  totalLabel: string;
  currencyLabel: string;
};

export function buildWhatsAppMessage(input: {
  orderNumber?: number;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryLocationUrl?: string;
  scheduledFor?: string;
  notes?: string;
  fulfillment?: WhatsAppFulfillment;
  items: CartLine[];
  total: number;
  storeName?: string;
  sizeNames: Record<'small' | 'medium' | 'large', string>;
  copy: WhatsAppCopy;
}) {
  const fulfillmentValue =
    input.fulfillment === 'pickup' ? input.copy.pickupLabel : input.copy.deliveryLabel;
  const addressLabel =
    input.fulfillment === 'pickup' ? input.copy.pickupNoteLabel : input.copy.addressLabel;
  const orderNumberSuffix = input.orderNumber
    ? ` ${input.copy.orderNumberPrefix}${input.orderNumber}`
    : '';

  const lines = [
    `*${input.storeName || 'We Knead Pizza'} ${input.copy.headingLabel}${orderNumberSuffix}*`,
    '',
    `${input.copy.nameLabel}: ${input.customerName}`,
    `${input.copy.fulfillmentLabel}: ${fulfillmentValue}`,
    input.customerPhone ? `${input.copy.phoneLabel}: ${input.customerPhone}` : null,
    input.deliveryAddress ? `${addressLabel}: ${input.deliveryAddress}` : null,
    input.deliveryLocationUrl ? `${input.copy.locationLinkLabel}: ${input.deliveryLocationUrl}` : null,
    input.scheduledFor ? `${input.copy.scheduleLabel}: ${input.scheduledFor}` : null,
    input.notes ? `${input.copy.notesLabel}: ${input.notes}` : null,
    '',
    `*${input.copy.itemsHeading}*`,
    ...input.items.map((item) => {
      const size = item.size ? ` (${input.sizeNames[item.size]})` : '';
      const extras = item.extras?.length ? ` + ${item.extras.map((extra) => extra.name).join(', ')}` : '';
      return `${item.quantity}x ${item.name}${size}${extras} - ${input.copy.currencyLabel} ${Math.round(item.unitPrice * item.quantity)}`;
    }),
    '',
    `*${input.copy.totalLabel}*: ${input.copy.currencyLabel} ${Math.round(input.total)}`,
  ].filter(Boolean);

  return lines.join('\n');
}

export function buildWhatsAppUrl(phoneNumber: string, message: string) {
  const normalized = phoneNumber.replace(/\D/g, '');
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
