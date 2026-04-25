import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { DessertsClient } from './DessertsClient';
import { deleteDessert } from './actions';

const refreshMock = vi.fn();

vi.mock('./actions', () => ({
  deleteDessert: vi.fn(() => Promise.resolve({ success: true })),
  toggleDessertSoldOut: vi.fn(() => Promise.resolve({ success: true })),
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

describe('DessertsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create and edit links for dedicated dessert pages', () => {
    render(
      <DessertsClient
        initialDesserts={[
          {
            id: 'dessert-1',
            name: 'Brownie',
            description: 'Chocolate fudgy brownie',
            price: 129,
            image_url: null,
            is_veg: true,
            is_active: true,
            is_sold_out: false,
            sort_order: 1,
            slug: 'brownie',
            created_at: '',
            updated_at: '',
          },
        ]}
      />
    );

    expect(screen.getByRole('link', { name: /new dessert/i })).toHaveAttribute('href', '/dashboard/desserts/new');

    const editLink = screen.getByRole('link', { name: '' });
    expect(editLink).toHaveAttribute('href', '/dashboard/desserts/dessert-1/edit');
  });

  it('deletes a dessert from the list', async () => {
    const user = userEvent.setup();
    const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <DessertsClient
        initialDesserts={[
          {
            id: 'dessert-1',
            name: 'Brownie',
            description: 'Chocolate fudgy brownie',
            price: 129,
            image_url: null,
            is_veg: true,
            is_active: true,
            is_sold_out: false,
            sort_order: 1,
            slug: 'brownie',
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
      expect(deleteDessert).toHaveBeenCalledWith('dessert-1');
      expect(refreshMock).toHaveBeenCalled();
    });

    confirmMock.mockRestore();
  });
});
