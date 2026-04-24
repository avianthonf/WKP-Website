import { beforeEach, describe, expect, it, vi } from 'vitest';

const revalidatePath = vi.fn();
const upsert = vi.fn();

vi.mock('next/cache', () => ({
  revalidatePath,
  unstable_noStore: vi.fn(),
}));

vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      upsert,
    })),
  },
}));

describe('settings actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates the delivery notice successfully', async () => {
    upsert.mockResolvedValueOnce({ error: null });

    const { updateDeliveryNotice } = await import('./actions');
    const result = await updateDeliveryNotice('Minimum Order Quantity and Delivery Charges may be applicable for Home Delivery');

    expect(result).toEqual({ success: true });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'delivery_notice',
        value: 'Minimum Order Quantity and Delivery Charges may be applicable for Home Delivery',
        label: 'Delivery Notice',
        type: 'text',
        description: 'Notice shown across storefront ordering surfaces and WhatsApp orders.',
        is_public: true,
      }),
      { onConflict: 'key' }
    );
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/settings');
  });

  it('stores a blank delivery notice as an empty string', async () => {
    upsert.mockResolvedValueOnce({ error: null });

    const { updateDeliveryNotice } = await import('./actions');
    const result = await updateDeliveryNotice('   ');

    expect(result).toEqual({ success: true });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'delivery_notice',
        value: '',
      }),
      { onConflict: 'key' }
    );
    expect(revalidatePath).toHaveBeenCalledWith('/dashboard/settings');
  });

  it('rejects invalid delivery notice content before persistence', async () => {
    const { updateDeliveryNotice } = await import('./actions');

    await expect(updateDeliveryNotice('x'.repeat(251))).rejects.toThrow('Notice is too long');
    expect(upsert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it('surfaces database errors while updating the delivery notice', async () => {
    upsert.mockResolvedValueOnce({ error: { message: 'db failed' } });

    const { updateDeliveryNotice } = await import('./actions');

    await expect(updateDeliveryNotice('Valid notice')).rejects.toThrow('db failed');
  });
});
