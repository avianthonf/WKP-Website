'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { categorySchema, toppingSchema, extraSchema, addonSchema, dessertSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { withObservedAction } from '@/lib/observability';

export async function createCategory(formData: any) {
  return withObservedAction('createCategory', async () => {
    const validated = categorySchema.safeParse(formData);
    if (!validated.success) return { error: 'Invalid data' };

    const slug = validated.data.label.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const { error } = await supabaseAdmin.from('categories').insert([{ ...validated.data, slug }]);

    if (error) return { error: error.message };
    revalidatePath('/dashboard/categories');
    return { success: true };
  });
}

export async function createTopping(formData: any) {
  return withObservedAction('createTopping', async () => {
    const validated = toppingSchema.safeParse(formData);
    if (!validated.success) return { error: 'Invalid data' };

    const slug = validated.data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const { error } = await supabaseAdmin.from('toppings').insert([{ ...validated.data, slug }]);

    if (error) return { error: error.message };
    revalidatePath('/dashboard/actions');
    return { success: true };
  });
}

export async function createExtra(formData: any) {
  return withObservedAction('createExtra', async () => {
    const validated = extraSchema.safeParse(formData);
    if (!validated.success) return { error: 'Invalid data' };
    const slug = validated.data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const { error } = await supabaseAdmin.from('extras').insert([{ ...validated.data, slug }]);
    if (error) return { error: error.message };
    revalidatePath('/dashboard/extras');
    return { success: true };
  });
}

export async function createAddon(formData: any) {
  return withObservedAction('createAddon', async () => {
    const validated = addonSchema.safeParse(formData);
    if (!validated.success) return { error: 'Invalid data' };
    const slug = validated.data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const { error } = await supabaseAdmin.from('addons').insert([{ ...validated.data, slug }]);
    if (error) return { error: error.message };
    revalidatePath('/dashboard/addons');
    return { success: true };
  });
}

export async function createDessert(formData: any) {
  return withObservedAction('createDessert', async () => {
    const validated = dessertSchema.safeParse(formData);
    if (!validated.success) return { error: 'Invalid data' };
    const slug = validated.data.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const { error } = await supabaseAdmin.from('desserts').insert([{ ...validated.data, slug }]);
    if (error) return { error: error.message };
    revalidatePath('/dashboard/desserts');
    return { success: true };
  });
}