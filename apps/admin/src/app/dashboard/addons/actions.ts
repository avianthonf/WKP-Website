'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath, revalidateTag } from 'next/cache';
import { addonSchema, AddonFormData } from '@/lib/validations';

export async function createAddon(formData: AddonFormData) {
  try {
    const validated = addonSchema.parse(formData);
    const slug = validated.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    const { error } = await supabaseAdmin
      .from('addons')
      .insert([{ ...validated, slug }]);

    if (error) throw error;

    revalidatePath('/dashboard/addons');
    revalidatePath('/dashboard/pizzas');
    revalidateTag('menu');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to create addon:', error);
    throw new Error(error.message || 'Failed to create addon');
  }
}

export async function updateAddon(id: string, formData: AddonFormData) {
  try {
    const validated = addonSchema.parse(formData);

    const { error } = await supabaseAdmin
      .from('addons')
      .update(validated)
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/addons');
    revalidatePath('/dashboard/pizzas');
    revalidateTag('menu');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to update addon:', error);
    throw new Error(error.message || 'Failed to update addon');
  }
}

export async function deleteAddon(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from('addons')
      .delete()
      .eq('id', id);

    // Soft-delete fallback: if hard-delete fails (FK constraint from order_items),
    // deactivate the item instead so it's hidden from menus but data is preserved.
    if (error) {
      if (error.code === '23503') {
        const { error: softError } = await supabaseAdmin
          .from('addons')
          .update({ is_active: false })
          .eq('id', id);

        if (softError) throw softError;

        revalidatePath('/dashboard/addons');
        revalidatePath('/dashboard/pizzas');
        revalidateTag('menu');

        return { success: true, softDeleted: true };
      }
      throw error;
    }

    revalidatePath('/dashboard/addons');
    revalidatePath('/dashboard/pizzas');
    revalidateTag('menu');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete addon:', error);
    throw new Error(error.message || 'Failed to delete addon');
  }
}

export async function toggleAddonSoldOut(id: string, currentState: boolean) {
  try {
    const { error } = await supabaseAdmin
      .from('addons')
      .update({ is_sold_out: !currentState })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/addons');
    revalidatePath('/dashboard/pizzas');
    revalidateTag('menu');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to toggle sold out:', error);
    throw new Error(error.message || 'Failed to update status');
  }
}

export async function updateAddonPrice(id: string, price: number) {
  try {
    if (price < 0) throw new Error('Price cannot be negative');

    const { error } = await supabaseAdmin
      .from('addons')
      .update({ price })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/prices');
    revalidatePath('/dashboard/pizzas');
    revalidateTag('menu');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to update addon price:', error);
    throw new Error(error.message || 'Failed to update price');
  }
}
