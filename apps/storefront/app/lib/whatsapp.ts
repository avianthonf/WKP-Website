import type { CartLine } from './types';

function getSizeName(size?: CartLine['size']) {
  return size === 'small' ? 'Small' : size === 'medium' ? 'Medium' : 'Large';
}

export function buildWhatsAppMessage(input: {
  orderNumber?: number;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  notes?: string;
  items: CartLine[];
  total: number;
  storeName?: string;
}) {
  const lines = [
    `*${input.storeName || 'We Knead Pizza'} Order${input.orderNumber ? ` #${input.orderNumber}` : ''}*`,
    '',
    `Name: ${input.customerName}`,
    input.customerPhone ? `Phone: ${input.customerPhone}` : null,
    input.deliveryAddress ? `Address: ${input.deliveryAddress}` : null,
    input.notes ? `Notes: ${input.notes}` : null,
    '',
    '*Items*',
    ...input.items.map((item) => {
      const size = item.size ? ` (${getSizeName(item.size)})` : '';
      const extras = item.extras?.length ? ` + ${item.extras.map((extra) => extra.name).join(', ')}` : '';
      return `${item.quantity}x ${item.name}${size}${extras} - INR ${Math.round(item.unitPrice * item.quantity)}`;
    }),
    '',
    `*Total*: INR ${Math.round(input.total)}`,
  ].filter(Boolean);

  return lines.join('\n');
}

export function buildWhatsAppUrl(phoneNumber: string, message: string) {
  const normalized = phoneNumber.replace(/\D/g, '');
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
