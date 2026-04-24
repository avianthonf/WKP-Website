import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CartProvider } from './cart-provider';
import { MenuBrowser } from './menu-browser';
import type { StorefrontBundle } from '../lib/types';

function makeBundle(config: Record<string, string> = {}): StorefrontBundle {
  return {
    categories: [],
    pizzas: [
      {
        id: 'pizza-1',
        slug: 'margherita',
        name: 'Margherita',
        description: 'Classic pizza',
        category_id: 'cat-1',
        price_small: 199,
        price_medium: 299,
        price_large: 399,
        image_url: null,
        is_veg: true,
        is_bestseller: false,
        is_spicy: false,
        is_new: false,
        is_active: true,
        is_sold_out: false,
        sort_order: 1,
        categories: { id: 'cat-1', label: 'Pizzas', slug: 'pizzas' },
        pizza_toppings: [],
      },
    ],
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

describe('MenuBrowser delivery notice popup', () => {
  it('shows a temporary notice after adding an item to the cart', async () => {
    const user = userEvent.setup();

    render(
      <CartProvider>
        <MenuBrowser
          bundle={makeBundle({
            delivery_notice: 'Minimum Order Quantity and Delivery Charges may be applicable for Home Delivery',
          })}
        />
      </CartProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Add Medium' }));

    expect(
      await screen.findByText('Minimum Order Quantity and Delivery Charges may be applicable for Home Delivery')
    ).toBeInTheDocument();
  });

  it('does not show the temporary popup when the notice is blank', async () => {
    const user = userEvent.setup();

    render(
      <CartProvider>
        <MenuBrowser bundle={makeBundle({ delivery_notice: '' })} />
      </CartProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Add Medium' }));

    expect(
      screen.queryByText('Minimum Order Quantity and Delivery Charges may be applicable for Home Delivery')
    ).not.toBeInTheDocument();
  });
});
