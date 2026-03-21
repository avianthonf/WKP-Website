import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ToggleSoldOut } from './ToggleSoldOut';

// Mock the toggle actions
const mockToggleAction = vi.fn(() => Promise.resolve({ success: true }));

vi.mock('@/app/dashboard/extras/actions', () => ({
  toggleExtraSoldOut: mockToggleAction,
}));
vi.mock('@/app/dashboard/addons/actions', () => ({
  toggleAddonSoldOut: mockToggleAction,
}));
vi.mock('@/app/dashboard/desserts/actions', () => ({
  toggleDessertSoldOut: mockToggleAction,
}));

describe('ToggleSoldOut', () => {
  const defaultProps = {
    id: 'item-123',
    initialSoldOut: false,
    onToggle: mockToggleAction,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders toggle in inactive (available) state when not sold out', () => {
    render(<ToggleSoldOut {...defaultProps} />);
    const track = document.querySelector('.toggle-track');
    expect(track).toHaveClass('inactive');
    expect(track).not.toHaveClass('sold-out');
  });

  it('renders toggle in sold-out state when initialSoldOut is true', () => {
    render(<ToggleSoldOut {...defaultProps} initialSoldOut={true} />);
    const track = document.querySelector('.toggle-track');
    expect(track).toHaveClass('sold-out');
  });

  it('calls onToggle when clicked', async () => {
    const user = userEvent.setup();
    render(<ToggleSoldOut {...defaultProps} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockToggleAction).toHaveBeenCalledWith('item-123', false);
  });

  it('shows correct tooltip based on state', () => {
    render(<ToggleSoldOut {...defaultProps} initialSoldOut={false} />);
    expect(screen.getByTitle('Mark as sold out')).toBeInTheDocument();

    render(<ToggleSoldOut {...defaultProps} initialSoldOut={true} />);
    expect(screen.getByTitle('Mark as available')).toBeInTheDocument();
  });

  it('disables during pending state', async () => {
    const user = userEvent.setup();
    mockToggleAction.mockImplementation(() => new Promise(() => {}));

    render(<ToggleSoldOut {...defaultProps} />);
    const button = screen.getByRole('button');

    await user.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('has accessible label', () => {
    render(<ToggleSoldOut {...defaultProps} />);
    expect(screen.getByText('Toggle sold out status')).toHaveClass('sr-only');
  });
});
