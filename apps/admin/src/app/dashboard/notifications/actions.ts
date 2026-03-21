'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath } from 'next/cache';
import { NotificationFormData } from '@/lib/validations';

export async function createNotification(formData: NotificationFormData) {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert([formData])
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/notifications');
    revalidatePath('/', 'layout');

    return { success: true, data };
  } catch (error: any) {
    console.error('Failed to create notification:', error);
    throw new Error(error.message || 'Failed to create notification');
  }
}

export async function updateNotification(id: string, formData: Partial<NotificationFormData>) {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update(formData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/notifications');
    revalidatePath('/', 'layout');

    return { success: true, data };
  } catch (error: any) {
    console.error('Failed to update notification:', error);
    throw new Error(error.message || 'Failed to update notification');
  }
}

export async function deleteNotification(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/notifications');
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete notification:', error);
    throw new Error(error.message || 'Failed to delete notification');
  }
}

export async function toggleNotificationActive(id: string, currentState: boolean) {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_active: !currentState })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/notifications');
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to toggle notification:', error);
    throw new Error(error.message || 'Failed to update notification');
  }
}
