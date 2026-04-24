import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CartProvider } from './cart-provider';
import { CartCheckout } from './cart-checkout';
import type { StorefrontBundle } from '../lib/types';

vi.mock('../actions', () => ({
  createWhatsAppOrder: vi.fn(),
}));

function makeBundle(config: Record<string, string> = {}): StorefrontBundle {
  return {
    categories: [],
    pizzas: [],
    toppings: [],
    extras: [],
    addons: [],
    desserts: [],
    notifications: [],
    config,
    isOpen: true,
    maintenanceMode: false,
  };
}

describe('CartCheckout delivery notice', () => {
  it('renders the persisted delivery notice in the cart-visible surface', () => {
    render(
      <CartProvider>
        <CartCheckout
          bundle={makeBundle({
            delivery_notice: 'Minimum Order Quantity and Delivery Charges may be applicable for Home Delivery',
          })}
        />
      </CartProvider>
    );

    expect(
      screen.getByText('Minimum Order Quantity and Delivery Charges may be applicable for Home Delivery')
    ).toBeInTheDocument();
  });

  it('omits the cart notice when the persisted value is blank', () => {
    render(
      <CartProvider>
        <CartCheckout
          bundle={makeBundle({
            delivery_notice: '',
          })}
        />
      </CartProvider>
    );

    expect(
      screen.queryByText('Minimum Order Quantity and Delivery Charges may be applicable for Home Delivery')
    ).not.toBeInTheDocument();
  });
});
