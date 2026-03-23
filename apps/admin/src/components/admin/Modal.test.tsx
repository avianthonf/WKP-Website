import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Modal } from './Modal';

describe('Modal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <p>Modal content</p>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open is true', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(<Modal {...defaultProps} open={false} />);
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} />);

    const backdrop = document.querySelector('.fixed.inset-0.z-50');
    expect(backdrop).toBeInTheDocument();

    await user.click(backdrop!);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when X button is clicked', async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: '' })); // X button

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', async () => {
    render(<Modal {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when panel is clicked', async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} />);

    const panel = document.querySelector('.max-w-md');
    await user.click(panel!);

    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('renders title in Cormorant Garamond with ember color', () => {
    render(<Modal {...defaultProps} />);
    const title = screen.getByText('Test Modal');
    expect(title).toHaveStyle({ fontFamily: "'Cormorant Garamond', serif", color: 'var(--ember)' });
  });

  it('has correct max width and scroll', () => {
    render(<Modal {...defaultProps} />);
    const panel = screen.getByTestId('modal-panel');
    expect(panel).toHaveClass('max-h-[calc(100dvh-2rem)]', 'overflow-hidden', 'flex', 'flex-col');

    const content = screen.getByTestId('modal-content');
    expect(content).toHaveClass('flex-1', 'overflow-y-auto', 'overscroll-contain');
  });

  it('locks and unlocks body scroll around modal lifecycle', () => {
    const { unmount } = render(<Modal {...defaultProps} />);
    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('');
  });
});
