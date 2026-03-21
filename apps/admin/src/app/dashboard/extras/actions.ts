'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath, revalidateTag } from 'next/cache';
import { extraSchema, ExtraFormData } from '@/lib/validations';

export async function createExtra(formData: ExtraFormData) {
  try {
    const validated = extraSchema.parse(formData);
    const slug = validated.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    const { error } = await supabaseAdmin
      .from('extras')
      .insert([{ ...validated, slug }]);

    if (error) throw error;

    revalidatePath('/dashboard/extras');
    revalidateTag('menu');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to create extra:', error);
    throw new Error(error.message || 'Failed to create extra');
  }
}

export async function updateExtra(id: string, formData: ExtraFormData) {
  try {
    const validated = extraSchema.parse(formData);

    const { error } = await supabaseAdmin
      .from('extras')
      .update(validated)
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/extras');
    revalidateTag('menu');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to update extra:', error);
    throw new Error(error.message || 'Failed to update extra');
  }
}

export async function deleteExtra(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from('extras')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/extras');
    revalidateTag('menu');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete extra:', error);
    throw new Error(error.message || 'Failed to delete extra');
  }
}

export async function updateExtraPrice(id: string, size: 'small' | 'medium' | 'large', price: number) {
  try {
    if (price < 0) throw new Error('Price cannot be negative');

    const column = `price_${size}` as const;
    const { error } = await supabaseAdmin
      .from('extras')
      .update({ [column]: price })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/extras');
    revalidatePath('/dashboard/prices');
    revalidateTag('menu');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to update extra price:', error);
    throw new Error(error.message || 'Failed to update price');
  }
}

export async function toggleExtraSoldOut(id: string, currentState: boolean) {
  try {
    const { error } = await supabaseAdmin
      .from('extras')
      .update({ is_sold_out: !currentState })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/extras');
    revalidateTag('menu');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to toggle sold out:', error);
    throw new Error(error.message || 'Failed to update status');
  }
}
