'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath } from 'next/cache';

export async function updateSiteConfig(key: string, value: string) {
  try {
    const { error } = await supabaseAdmin
      .from('site_config')
      .update({ value })
      .eq('key', key);

    if (error) throw error;

    revalidatePath('/dashboard/settings');
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to update site config:', error);
    throw new Error(error.message || 'Failed to update site config');
  }
}

export async function upsertSiteConfig(
  key: string,
  value: string,
  label: string,
  type: string,
  description?: string,
  isPublic = true
) {
  try {
    if (!key.trim() || !label.trim()) {
      throw new Error('Key and label are required');
    }

    const { error } = await supabaseAdmin
      .from('site_config')
      .upsert(
        {
          key: key.trim(),
          value,
          label: label.trim(),
          type,
          description: description?.trim() || null,
          is_public: isPublic,
        },
        { onConflict: 'key' }
      );

    if (error) throw error;

    revalidatePath('/dashboard/settings');
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to upsert site config:', error);
    throw new Error(error.message || 'Failed to upsert site config');
  }
}

export async function upsertDashboardLiveMode(value: boolean) {
  try {
    const { error } = await supabaseAdmin
      .from('site_config')
      .upsert(
        {
          key: 'dashboard_live_mode',
          value: String(value),
          label: 'Dashboard Live Mode',
          type: 'boolean',
          description: 'Controls the live indicator and dashboard shell sync state.',
          is_public: false,
        },
        { onConflict: 'key' }
      );

    if (error) throw error;

    revalidatePath('/dashboard/settings');
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to update dashboard live mode:', error);
    throw new Error(error.message || 'Failed to update dashboard live mode');
  }
}

export async function createSiteConfig(key: string, value: string, label: string, type: string) {
  try {
    if (!key.trim() || !label.trim()) {
      throw new Error('Key and label are required');
    }

    // Check if key already exists
    const { data: existing } = await supabaseAdmin
      .from('site_config')
      .select('key')
      .eq('key', key)
      .single();

    if (existing) {
      throw new Error(`Config with key "${key}" already exists`);
    }

    const { error } = await supabaseAdmin
      .from('site_config')
      .insert({
        key: key.trim(),
        value,
        label: label.trim(),
        type,
        is_public: true,
      });

    if (error) throw error;

    revalidatePath('/dashboard/settings');
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to create site config:', error);
    throw new Error(error.message || 'Failed to create site config');
  }
}

export async function deleteSiteConfig(key: string) {
  try {
    // Guard: cannot delete protected keys
    if (key === 'is_open' || key === 'site_maintenance_mode') {
      throw new Error('Protected config keys cannot be deleted');
    }

    const { error } = await supabaseAdmin
      .from('site_config')
      .delete()
      .eq('key', key);

    if (error) throw error;

    revalidatePath('/dashboard/settings');
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete site config:', error);
    throw new Error(error.message || 'Failed to delete site config');
  }
}
