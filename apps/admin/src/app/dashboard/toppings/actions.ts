'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath, revalidateTag } from 'next/cache';
import { toppingSchema, ToppingFormData } from '@/lib/validations';

export async function createTopping(formData: ToppingFormData) {
  try {
    const validated = toppingSchema.parse(formData);
    const slug = validated.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    const { error } = await supabaseAdmin
      .from('toppings')
      .insert([{ ...validated, slug }]);

    if (error) throw error;

    revalidatePath('/dashboard/toppings');
    revalidateTag('menu');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to create topping:', error);
    throw new Error(error.message || 'Failed to create topping');
  }
}

export async function updateTopping(id: string, formData: ToppingFormData) {
  try {
    const validated = toppingSchema.parse(formData);

    const { error } = await supabaseAdmin
      .from('toppings')
      .update(validated)
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/toppings');
    revalidateTag('menu');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to update topping:', error);
    throw new Error(error.message || 'Failed to update topping');
  }
}

export async function deleteTopping(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from('toppings')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/toppings');
    revalidateTag('menu');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete topping:', error);
    throw new Error(error.message || 'Failed to delete topping');
  }
}
