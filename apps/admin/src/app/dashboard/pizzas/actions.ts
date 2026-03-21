'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath, revalidateTag } from 'next/cache';
import { PizzaFormData } from '@/lib/validations';
import { Size } from '@/types';

/**
 * Create a new artisanal pizza with associated toppings.
 */
export async function createPizza(data: PizzaFormData) {
  try {
    // 1. Generate slug from name
    const slug = data.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    
    const { toppings, ...pizzaData } = data;

    // 2. Insert pizza row
    const { data: pizza, error: pizzaError } = await supabaseAdmin
      .from('pizzas')
      .insert({
        ...pizzaData,
        slug,
      })
      .select()
      .single();

    if (pizzaError) throw pizzaError;

    // 3. Insert pizza_toppings if any
    if (toppings && toppings.length > 0) {
      const toppingInserts = toppings.map(toppingId => ({
        pizza_id: pizza.id,
        topping_id: toppingId
      }));

      const { error: toppingError } = await supabaseAdmin
        .from('pizza_toppings')
        .insert(toppingInserts);

      if (toppingError) throw toppingError;
    }

    revalidatePath('/dashboard/pizzas');
    revalidateTag('menu');
    return { success: true, id: pizza.id };
  } catch (error: any) {
    console.error('Error creating pizza:', error);
    throw new Error(error.message || 'Failed to create pizza');
  }
}

/**
 * Update existing pizza and normalize topping associations.
 */
export async function updatePizza(id: string, data: PizzaFormData) {
  try {
    const { toppings, ...pizzaData } = data;

    // 1. Update pizza row
    const { error: pizzaError } = await supabaseAdmin
      .from('pizzas')
      .update(pizzaData)
      .eq('id', id);

    if (pizzaError) throw pizzaError;

    // 2. Sync toppings: Delete old, Insert new
    const { error: deleteError } = await supabaseAdmin
      .from('pizza_toppings')
      .delete()
      .eq('pizza_id', id);

    if (deleteError) throw deleteError;

    if (toppings && toppings.length > 0) {
      const toppingInserts = toppings.map(toppingId => ({
        pizza_id: id,
        topping_id: toppingId
      }));

      const { error: toppingError } = await supabaseAdmin
        .from('pizza_toppings')
        .insert(toppingInserts);

      if (toppingError) throw toppingError;
    }

    revalidatePath('/dashboard/pizzas');
    revalidateTag('menu');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating pizza:', error);
    throw new Error(error.message || 'Failed to update pizza');
  }
}

/**
 * Permanent removal of pizza record. Cascade handles associations.
 */
export async function deletePizza(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from('pizzas')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/pizzas');
    revalidateTag('menu');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting pizza:', error);
    throw new Error(error.message || 'Failed to delete pizza');
  }
}

/**
 * Surgical price update for specific size across admin/prices views.
 */
export async function updatePizzaPrice(id: string, size: Size, price: number) {
  try {
    if (price < 1) throw new Error('Price must be at least 1');

    const columnMap = {
      small: 'price_small',
      medium: 'price_medium',
      large: 'price_large'
    };

    const { error } = await supabaseAdmin
      .from('pizzas')
      .update({ [columnMap[size]]: price })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/pizzas');
    revalidatePath('/dashboard/prices');
    revalidateTag('menu');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating price:', error);
    throw new Error(error.message || 'Failed to update price');
  }
}

/**
 * Toggle real-time availability status for menu presence.
 */
export async function togglePizzaActive(id: string, currentState: boolean) {
  try {
    const { error } = await supabaseAdmin
      .from('pizzas')
      .update({ is_active: !currentState })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/pizzas');
    revalidateTag('menu');
    return { success: true };
  } catch (error: any) {
    console.error('Error toggling status:', error);
    throw new Error(error.message || 'Failed to toggle status');
  }
}
