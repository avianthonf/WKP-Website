import { describe, expect, it } from 'vitest';
import { buildWhatsAppMessage } from './whatsapp';
import type { CartLine } from './types';

const baseItems: CartLine[] = [
  {
    id: 'line-1',
    sourceId: 'pizza-1',
    kind: 'pizza',
    name: 'Margherita',
    size: 'medium',
    quantity: 2,
    unitPrice: 299,
    imageUrl: null,
  },
];

const baseInput = {
  orderNumber: 42,
  customerName: 'Avi',
  customerPhone: '9999999999',
  fulfillment: 'delivery' as const,
  deliveryAddress: '221B Baker Street',
  items: baseItems,
  total: 598,
  storeName: 'We Knead Pizza',
  sizeNames: {
    small: 'Small',
    medium: 'Medium',
    large: 'Large',
  },
  copy: {
    headingLabel: 'Order',
    orderNumberPrefix: '#',
    nameLabel: 'Name',
    fulfillmentLabel: 'Fulfillment',
    deliveryLabel: 'Delivery',
    pickupLabel: 'Pickup',
    phoneLabel: 'Phone',
    addressLabel: 'Address',
    locationLinkLabel: 'Location pin',
    pickupNoteLabel: 'Pickup note',
    notesLabel: 'Notes',
    scheduleLabel: 'Scheduled for',
    itemsHeading: 'Items',
    totalLabel: 'Total',
    currencyLabel: 'INR',
  },
};

describe('buildWhatsAppMessage delivery notice', () => {
  it('includes the persisted delivery notice as its own line before the items section', () => {
    const message = buildWhatsAppMessage({
      ...baseInput,
      deliveryNotice: 'Minimum Order Quantity and Delivery Charges may be applicable for Home Delivery',
    });

    expect(message).toContain('Address: 221B Baker Street\nMinimum Order Quantity and Delivery Charges may be applicable for Home Delivery\n*Items*');
  });

  it('omits the delivery notice line when the persisted value is blank', () => {
    const message = buildWhatsAppMessage({
      ...baseInput,
      deliveryNotice: '   ',
    });

    expect(message).not.toContain('Minimum Order Quantity and Delivery Charges may be applicable for Home Delivery');
    expect(message).toContain('Address: 221B Baker Street\n*Items*');
  });

  it('preserves punctuation and spacing in the delivery notice text', () => {
    const message = buildWhatsAppMessage({
      ...baseInput,
      deliveryNotice: 'Delivery charges apply after 5 km; minimum order may vary by zone.',
    });

    expect(message).toContain('Delivery charges apply after 5 km; minimum order may vary by zone.');
  });
});
