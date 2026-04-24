import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AddonsClient } from './AddonsClient';
import { createAddon } from './actions';

vi.mock('./actions', () => ({
  createAddon: vi.fn(() => Promise.resolve({ success: true })),
  updateAddon: vi.fn(() => Promise.resolve({ success: true })),
  deleteAddon: vi.fn(() => Promise.resolve({ success: true })),
  toggleAddonSoldOut: vi.fn(() => Promise.resolve({ success: true })),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/admin/MenuImageField', () => ({
  MenuImageField: ({ label, onChange }: { label: string; onChange: (value: string | null) => void }) => (
    <button type="button" onClick={() => onChange('https://cdn.example.com/addons/garlic-bread.jpg')}>
      Upload {label}
    </button>
  ),
}));

describe('AddonsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an addon with the uploaded image URL', async () => {
    const user = userEvent.setup();
    render(<AddonsClient initialAddons={[]} />);

    await user.click(screen.getByRole('button', { name: /New Addon/i }));
    await user.type(screen.getByPlaceholderText('Addon name'), 'Garlic Bread');
    await user.type(screen.getByPlaceholderText('Brief description (optional)'), 'Buttery garlic bread');
    await user.clear(screen.getByLabelText('Price (₹)'));
    await user.type(screen.getByLabelText('Price (₹)'), '149');
    await user.click(screen.getByRole('button', { name: /Upload Addon photo/i }));
    await user.click(screen.getByRole('button', { name: /Add Addon/i }));

    await waitFor(() => {
      expect(createAddon).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Garlic Bread',
          description: 'Buttery garlic bread',
          price: 149,
          image_url: 'https://cdn.example.com/addons/garlic-bread.jpg',
          is_veg: true,
          is_bestseller: false,
          is_active: true,
          sort_order: 0,
        })
      );
    });
  });
});
