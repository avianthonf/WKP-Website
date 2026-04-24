import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import SettingsClient from './SettingsClient';
import type { Pizza, SiteConfigItem } from '@/types';

vi.mock('./actions', () => ({
  updateSiteConfig: vi.fn(() => Promise.resolve({ success: true })),
  upsertSiteConfig: vi.fn(() => Promise.resolve({ success: true })),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/lib/supabaseClient', () => ({
  createClient: () => ({
    channel: () => ({
      on: () => ({
        subscribe: () => ({})
      }),
    }),
    removeChannel: vi.fn(),
  }),
}));

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: toastMocks.success,
    error: toastMocks.error,
  },
}));

const initialConfigs: SiteConfigItem[] = [
  {
    id: 'min-order-amount',
    key: 'min_order_amount',
    value: '0',
    label: 'Minimum order',
    type: 'number',
    description: 'Shown in cart and delivery pages.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const initialPizzas: Pizza[] = [];

describe('SettingsClient delivery notice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the delivery notice field with its saved value', async () => {
    render(
      <SettingsClient
        initialConfigs={[
          ...initialConfigs,
          {
            id: 'delivery-notice',
            key: 'delivery_notice',
            value: 'Existing saved notice',
            label: 'Delivery Notice',
            type: 'textarea',
            description: 'Notice shown across storefront ordering surfaces and WhatsApp orders.',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]}
        initialPizzas={initialPizzas}
      />
    );

    expect(await screen.findByDisplayValue('Existing saved notice')).toBeInTheDocument();
    expect(screen.getByText('Delivery Notice')).toBeInTheDocument();
  });

  it('saves the delivery notice through the shared settings action', async () => {
    const user = userEvent.setup();
    const { upsertSiteConfig } = await import('./actions');

    render(<SettingsClient initialConfigs={initialConfigs} initialPizzas={initialPizzas} />);

    const textarea = await screen.findByPlaceholderText('Minimum Order Quantity and Delivery Charges may be applicable for Home Delivery');
    await user.clear(textarea);
    await user.type(textarea, 'Minimum Order Quantity and Delivery Charges may be applicable for Home Delivery');

    const fieldCard = textarea.closest('.rounded-2xl');
    const saveButton = fieldCard?.querySelector('button.btn-primary') as HTMLButtonElement;
    await user.click(saveButton);

    await waitFor(() => {
      expect(upsertSiteConfig).toHaveBeenCalledWith(
        'delivery_notice',
        'Minimum Order Quantity and Delivery Charges may be applicable for Home Delivery',
        'Delivery Notice',
        'textarea',
        'Notice shown across storefront ordering surfaces and WhatsApp orders.',
        true
      );
    });
    expect(toastMocks.success).toHaveBeenCalledWith('Delivery Notice saved');
  });
});
