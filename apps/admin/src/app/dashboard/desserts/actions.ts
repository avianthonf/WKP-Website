'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath, revalidateTag } from 'next/cache';
import { dessertSchema, DessertFormData } from '@/lib/validations';

export async function createDessert(formData: DessertFormData) {
  try {
    const validated = dessertSchema.parse(formData);
    const slug = validated.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    const { error } = await supabaseAdmin
      .from('desserts')
      .insert([{ ...validated, slug }]);

    if (error) throw error;

    revalidatePath('/dashboard/desserts');
    revalidateTag('menu');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to create dessert:', error);
    throw new Error(error.message || 'Failed to create dessert');
  }
}

export async function updateDessert(id: string, formData: DessertFormData) {
  try {
    const validated = dessertSchema.parse(formData);

    const { error } = await supabaseAdmin
      .from('desserts')
      .update(validated)
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/desserts');
    revalidateTag('menu');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to update dessert:', error);
    throw new Error(error.message || 'Failed to update dessert');
  }
}

export async function deleteDessert(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from('desserts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/desserts');
    revalidateTag('menu');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete dessert:', error);
    throw new Error(error.message || 'Failed to delete dessert');
  }
}

export async function toggleDessertSoldOut(id: string, currentState: boolean) {
  try {
    const { error } = await supabaseAdmin
      .from('desserts')
      .update({ is_sold_out: !currentState })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/desserts');
    revalidateTag('menu');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to toggle sold out:', error);
    throw new Error(error.message || 'Failed to update status');
  }
}

export async function updateDessertPrice(id: string, price: number) {
  try {
    if (price < 0) throw new Error('Price cannot be negative');

    const { error } = await supabaseAdmin
      .from('desserts')
      .update({ price })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/prices');
    revalidateTag('menu');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to update dessert price:', error);
    throw new Error(error.message || 'Failed to update price');
  }
}
