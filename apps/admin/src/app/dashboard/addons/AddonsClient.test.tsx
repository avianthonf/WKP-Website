import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AddonsClient } from './AddonsClient';
import { deleteAddon } from './actions';

const refreshMock = vi.fn();

vi.mock('./actions', () => ({
  deleteAddon: vi.fn(() => Promise.resolve({ success: true })),
  toggleAddonSoldOut: vi.fn(() => Promise.resolve({ success: true })),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/admin/ToggleSoldOut', () => ({
  ToggleSoldOut: () => <button type="button">Toggle sold out</button>,
}));

describe('AddonsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create and edit links for dedicated addon pages', () => {
    render(
      <AddonsClient
        initialAddons={[
          {
            id: 'addon-1',
            name: 'Garlic Bread',
            description: 'Buttery and crisp',
            price: 149,
            image_url: null,
            is_veg: true,
            is_bestseller: true,
            is_active: true,
            is_sold_out: false,
            sort_order: 1,
            slug: 'garlic-bread',
            created_at: '',
            updated_at: '',
          },
        ]}
      />
    );

    expect(screen.getByRole('link', { name: /new addon/i })).toHaveAttribute('href', '/dashboard/addons/new');

    const editLink = screen.getByRole('link', { name: '' });
    expect(editLink).toHaveAttribute('href', '/dashboard/addons/addon-1/edit');
  });

  it('deletes an addon from the list', async () => {
    const user = userEvent.setup();
    const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <AddonsClient
        initialAddons={[
          {
            id: 'addon-1',
            name: 'Garlic Bread',
            description: 'Buttery and crisp',
            price: 149,
            image_url: null,
            is_veg: true,
            is_bestseller: false,
            is_active: true,
            is_sold_out: false,
            sort_order: 1,
            slug: 'garlic-bread',
            created_at: '',
            updated_at: '',
          },
        ]}
      />
    );

    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons[buttons.length - 1];
    await user.click(deleteButton);

    await waitFor(() => {
      expect(deleteAddon).toHaveBeenCalledWith('addon-1');
      expect(refreshMock).toHaveBeenCalled();
    });

    confirmMock.mockRestore();
  });
});