import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ToppingsClient } from './ToppingsClient';
import { Topping } from '@/types';

// Mock the server actions
vi.mock('./actions', () => ({
  createTopping: vi.fn(() => Promise.resolve({ success: true })),
  updateTopping: vi.fn(() => Promise.resolve({ success: true })),
  deleteTopping: vi.fn(() => Promise.resolve({ success: true })),
}));

// Mock router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const mockToppings: Topping[] = [
  {
    id: '1',
    slug: 'cheese-1',
    name: 'Mozzarella',
    category: 'cheese',
    is_veg: true,
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    slug: 'meat-1',
    name: 'Pepperoni',
    category: 'meat',
    is_veg: false,
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
];

describe('ToppingsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders info banner', () => {
    render(<ToppingsClient initialToppings={mockToppings} />);
    expect(screen.getByText(/Toppings are the ingredients listed on a pizza card/i)).toBeInTheDocument();
  });

  it('renders header with title and button', () => {
    render(<ToppingsClient initialToppings={mockToppings} />);
    expect(screen.getByText('Toppings')).toBeInTheDocument();
    expect(screen.getByText('Configure pizza ingredients and dietary classifications.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Topping/i })).toBeInTheDocument();
  });

  it('renders table with correct columns', () => {
    render(<ToppingsClient initialToppings={mockToppings} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Veg')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders toppings grouped by category', () => {
    render(<ToppingsClient initialToppings={mockToppings} />);
    expect(screen.getByText('Mozzarella')).toBeInTheDocument();
    expect(screen.getByText('Pepperoni')).toBeInTheDocument();
  });

  it('shows veg/meat badges correctly', () => {
    render(<ToppingsClient initialToppings={mockToppings} />);
    expect(screen.getByText('Veg')).toBeInTheDocument();
    expect(screen.getByText('Non-Veg')).toBeInTheDocument();
  });

  it('opens modal when New Topping button is clicked', async () => {
    const user = userEvent.setup();
    render(<ToppingsClient initialToppings={mockToppings} />);

    await user.click(screen.getByRole('button', { name: /New Topping/i }));

    expect(screen.getByText('New Topping')).toBeInTheDocument(); // Modal title
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
  });

  it('opens modal with Edit Topping title when edit button clicked', async () => {
    const user = userEvent.setup();
    render(<ToppingsClient initialToppings={mockToppings} />);

    await user.click(screen.getByRole('button', { name: '' })); // Edit icon button (empty name text)

    expect(screen.getByText('Edit Topping')).toBeInTheDocument();
  });

  it('closes modal when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<ToppingsClient initialToppings={mockToppings} />);

    await user.click(screen.getByRole('button', { name: /New Topping/i }));
    expect(screen.getByText('New Topping')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByText('New Topping')).not.toBeInTheDocument();
    });
  });

  it('submits form and creates topping', async () => {
    const user = userEvent.setup();
    const { createTopping } = await import('./actions');
    render(<ToppingsClient initialToppings={mockToppings} />);

    await user.click(screen.getByRole('button', { name: /New Topping/i }));
    await user.type(screen.getByLabelText('Name'), 'New Test Topping');
    await user.click(screen.getByRole('button', { name: /Add Topping/i }));

    await waitFor(() => {
      expect(createTopping).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Test Topping',
        category: 'cheese',
        is_veg: true,
        is_active: true,
      }));
    });
  });

  it('deletes topping with confirmation', async () => {
    const user = userEvent.setup();
    const { deleteTopping } = await import('./actions');
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ToppingsClient initialToppings={mockToppings} />);

    // Find delete button (Trash2 icon) - we need to find the danger button
    const deleteButtons = screen.getAllByRole('button');
    const deleteBtn = deleteButtons.find(btn => btn.classList.contains('danger'));

    if (deleteBtn) {
      await user.click(deleteBtn);
    }

    await waitFor(() => {
      expect(deleteTopping).toHaveBeenCalledWith('1');
    });

    confirmSpy.mockRestore();
  });

  it('shows empty state when no toppings', () => {
    render(<ToppingsClient initialToppings={[]} />);
    expect(screen.getByText('No toppings configured yet.')).toBeInTheDocument();
  });
});
