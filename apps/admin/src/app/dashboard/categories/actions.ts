'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath } from 'next/cache';
import { categorySchema, CategoryFormData } from '@/lib/validations';

// System category slugs that cannot be deleted
const SYSTEM_CATEGORY_SLUGS = ['veg-pizzas', 'non-veg-pizzas', 'addons', 'desserts'];

export async function createCategory(formData: CategoryFormData) {
  try {
    const validated = categorySchema.parse(formData);
    const slug = validated.label.toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');

    const { error } = await supabaseAdmin
      .from('categories')
      .insert([{
        label: validated.label,
        description: validated.description || null,
        icon: validated.icon || null,
        type: validated.type,
        sort_order: validated.sort_order,
        is_active: validated.is_active ?? true,
        slug,
      }]);

    if (error) throw error;

    revalidatePath('/dashboard/categories');
    revalidatePath('/dashboard/pizzas');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to create category:', error);
    throw new Error(error.message || 'Failed to create category');
  }
}

export async function updateCategory(id: string, formData: Partial<CategoryFormData>) {
  try {
    const updates: any = {};

    if (formData.label !== undefined) {
      updates.label = formData.label;
      // Regenerate slug if label changes
      updates.slug = formData.label.toLowerCase().trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
    }
    if (formData.description !== undefined) updates.description = formData.description;
    if (formData.icon !== undefined) updates.icon = formData.icon;
    if (formData.type !== undefined) updates.type = formData.type;
    if (formData.sort_order !== undefined) updates.sort_order = formData.sort_order;
    if (formData.is_active !== undefined) updates.is_active = formData.is_active;

    const { error } = await supabaseAdmin
      .from('categories')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/categories');
    revalidatePath('/dashboard/pizzas');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to update category:', error);
    throw new Error(error.message || 'Failed to update category');
  }
}

export async function deleteCategory(id: string) {
  try {
    // First check if it's a system category
    const { data: category } = await supabaseAdmin
      .from('categories')
      .select('slug')
      .eq('id', id)
      .single();

    if (category?.slug && SYSTEM_CATEGORY_SLUGS.includes(category.slug)) {
      throw new Error('SYSTEM_CATEGORY_DELETE_ATTEMPT');
    }

    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/categories');
    revalidatePath('/dashboard/pizzas');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete category:', error);
    throw new Error(error.message || 'Failed to delete category');
  }
}
