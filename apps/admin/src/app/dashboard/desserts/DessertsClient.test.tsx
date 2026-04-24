import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { DessertsClient } from './DessertsClient';
import { createDessert } from './actions';

vi.mock('./actions', () => ({
  createDessert: vi.fn(() => Promise.resolve({ success: true })),
  updateDessert: vi.fn(() => Promise.resolve({ success: true })),
  deleteDessert: vi.fn(() => Promise.resolve({ success: true })),
  toggleDessertSoldOut: vi.fn(() => Promise.resolve({ success: true })),
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
    <button type="button" onClick={() => onChange('https://cdn.example.com/desserts/brownie.jpg')}>
      Upload {label}
    </button>
  ),
}));

describe('DessertsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a dessert with the uploaded image URL', async () => {
    const user = userEvent.setup();
    render(<DessertsClient initialDesserts={[]} />);

    await user.click(screen.getByRole('button', { name: /New Dessert/i }));
    await user.type(screen.getByPlaceholderText('Dessert name'), 'Brownie');
    await user.type(screen.getByPlaceholderText('Brief description (optional)'), 'Chocolate brownie');
    await user.clear(screen.getByLabelText('Price (₹)'));
    await user.type(screen.getByLabelText('Price (₹)'), '129');
    await user.click(screen.getByRole('button', { name: /Upload Dessert photo/i }));
    await user.click(screen.getByRole('button', { name: /Add Dessert/i }));

    await waitFor(() => {
      expect(createDessert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Brownie',
          description: 'Chocolate brownie',
          price: 129,
          image_url: 'https://cdn.example.com/desserts/brownie.jpg',
          is_veg: true,
          is_active: true,
          sort_order: 0,
        })
      );
    });
  });
});
