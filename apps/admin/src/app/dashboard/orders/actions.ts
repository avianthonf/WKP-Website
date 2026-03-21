'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath } from 'next/cache';
import { OrderStatus } from '@/types';

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  try {
    const { error } = await supabaseAdmin
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) throw error;

    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/orders/history');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to update order status:', error);
    throw new Error(error.message || 'Failed to update order status');
  }
}

export async function deleteOrder(orderId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) throw error;

    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/orders/history');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete order:', error);
    throw new Error(error.message || 'Failed to delete order');
  }
}
