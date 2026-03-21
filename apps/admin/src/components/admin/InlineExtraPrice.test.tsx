import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { InlineExtraPrice } from './InlineExtraPrice';

// Mock the actions module completely
vi.mock('@/app/dashboard/extras/actions', () => ({
  updateExtraPrice: vi.fn(() => Promise.resolve({ success: true })),
}));

describe('InlineExtraPrice', () => {
  const mockId = 'extra-123';
  const defaultProps = {
    extraId: mockId,
    size: 'small' as const,
    initialPrice: 20,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with initial price', () => {
    render(<InlineExtraPrice {...defaultProps} />);
    expect(screen.getByRole('spinbutton')).toHaveValue(20);
  });

  it('shows ₹ prefix', () => {
    render(<InlineExtraPrice {...defaultProps} />);
    expect(screen.getByText('₹')).toBeInTheDocument();
  });

  it('updates input on user type', async () => {
    const user = userEvent.setup();
    render(<InlineExtraPrice {...defaultProps} />);
    const input = screen.getByRole('spinbutton');

    await user.clear(input);
    await user.type(input, '25');

    expect(input).toHaveValue(25);
  });

  it('calls updateExtraPrice on blur when price changed', async () => {
    const user = userEvent.setup();
    const { updateExtraPrice } = await import('@/app/dashboard/extras/actions');
    render(<InlineExtraPrice {...defaultProps} />);
    const input = screen.getByRole('spinbutton');

    await user.clear(input);
    await user.type(input, '30');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(updateExtraPrice).toHaveBeenCalledWith(mockId, 'small', 30);
    });
  });

  it('does not call server if price unchanged', async () => {
    const user = userEvent.setup();
    const { updateExtraPrice } = await import('@/app/dashboard/extras/actions');
    render(<InlineExtraPrice {...defaultProps} />);
    const input = screen.getByRole('spinbutton');

    fireEvent.blur(input);

    expect(updateExtraPrice).not.toHaveBeenCalled();
  });

  it('shows "Saving..." status during save', async () => {
    const user = userEvent.setup();
    const { updateExtraPrice } = await import('@/app/dashboard/extras/actions') as any;
    updateExtraPrice.mockImplementation(() => new Promise(() => {}));

    render(<InlineExtraPrice {...defaultProps} />);
    const input = screen.getByRole('spinbutton');

    await user.clear(input);
    await user.type(input, '25');
    fireEvent.blur(input);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('shows "Saved" on success', async () => {
    const user = userEvent.setup();
    const { updateExtraPrice } = await import('@/app/dashboard/extras/actions') as any;
    updateExtraPrice.mockResolvedValue({ success: true });

    render(<InlineExtraPrice {...defaultProps} />);
    const input = screen.getByRole('spinbutton');

    await user.clear(input);
    await user.type(input, '25');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });
  });

  it('shows "Failed" on error', async () => {
    const user = userEvent.setup();
    const { updateExtraPrice } = await import('@/app/dashboard/extras/actions') as any;
    updateExtraPrice.mockRejectedValue(new Error('DB error'));

    render(<InlineExtraPrice {...defaultProps} />);
    const input = screen.getByRole('spinbutton');

    await user.clear(input);
    await user.type(input, '25');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });
  });

  it('reverts price on error', async () => {
    const user = userEvent.setup();
    const { updateExtraPrice } = await import('@/app/dashboard/extras/actions') as any;
    updateExtraPrice.mockRejectedValue(new Error('DB error'));

    render(<InlineExtraPrice {...defaultProps} />);
    const input = screen.getByRole('spinbutton');

    await user.clear(input);
    await user.type(input, '25');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(input).toHaveValue(20);
    });
  });

  it('does not allow negative price on blur', async () => {
    const user = userEvent.setup();
    render(<InlineExtraPrice {...defaultProps} />);
    const input = screen.getByRole('spinbutton');

    await user.clear(input);
    await user.type(input, '-5');
    fireEvent.blur(input);

    expect(input).toHaveValue(20);
  });
});
