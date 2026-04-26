import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ExtrasClient } from './ExtrasClient';
import { deleteExtra } from './actions';

const refreshMock = vi.fn();

vi.mock('./actions', () => ({
  deleteExtra: vi.fn(() => Promise.resolve({ success: true, softDeleted: false })),
  toggleExtraSoldOut: vi.fn(() => Promise.resolve({ success: true })),
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

vi.mock('@/components/admin/InlineExtraPrice', () => ({
  InlineExtraPrice: ({ initialPrice }: { initialPrice: number }) => <span>{initialPrice}</span>,
}));

describe('ExtrasClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create and edit links for dedicated extra pages', () => {
    render(
      <ExtrasClient
        initialExtras={[
          {
            id: 'extra-1',
            name: 'Olives',
            price_small: 20,
            price_medium: 30,
            price_large: 40,
            is_veg: true,
            is_active: true,
            is_sold_out: false,
            sort_order: 1,
            slug: 'olives',
            created_at: '',
            updated_at: '',
          },
        ]}
      />
    );

    expect(screen.getByRole('link', { name: /new extra/i })).toHaveAttribute('href', '/dashboard/extras/new');

    const editLink = screen.getByRole('link', { name: '' });
    expect(editLink).toHaveAttribute('href', '/dashboard/extras/extra-1/edit');
  });

  it('deletes an extra from the list', async () => {
    const user = userEvent.setup();
    const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <ExtrasClient
        initialExtras={[
          {
            id: 'extra-1',
            name: 'Olives',
            price_small: 20,
            price_medium: 30,
            price_large: 40,
            is_veg: true,
            is_active: true,
            is_sold_out: false,
            sort_order: 1,
            slug: 'olives',
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
      expect(deleteExtra).toHaveBeenCalledWith('extra-1');
      expect(refreshMock).toHaveBeenCalled();
    });

    confirmMock.mockRestore();
  });

  it('soft-deletes (deactivates) an extra that is referenced in orders', async () => {
    const user = userEvent.setup();
    const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);

    vi.mocked(deleteExtra).mockResolvedValueOnce({ success: true, softDeleted: true });

    render(
      <ExtrasClient
        initialExtras={[
          {
            id: 'extra-1',
            name: 'Olives',
            price_small: 20,
            price_medium: 30,
            price_large: 40,
            is_veg: true,
            is_active: true,
            is_sold_out: false,
            sort_order: 1,
            slug: 'olives',
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
      expect(deleteExtra).toHaveBeenCalledWith('extra-1');
      expect(refreshMock).toHaveBeenCalled();
    });

    expect(screen.getByText('Olives')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '' })).toHaveAttribute('href', '/dashboard/extras/extra-1/edit');

    confirmMock.mockRestore();
  });
});
