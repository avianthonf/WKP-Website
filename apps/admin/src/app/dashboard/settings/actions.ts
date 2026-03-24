'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';

export async function updateSiteConfig(key: string, value: string) {
  try {
    const { error } = await supabaseAdmin
      .from('site_config')
      .update({ value })
      .eq('key', key);

    if (error) throw error;

    revalidatePath('/dashboard/settings');

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

    return { success: true };
  } catch (error: any) {
    console.error('Failed to update dashboard live mode:', error);
    throw new Error(error.message || 'Failed to update dashboard live mode');
  }
}

export async function uploadStorefrontAsset(formData: FormData) {
  try {
    noStore();

    const file = formData.get('file');
    const folder = String(formData.get('folder') || 'storefront-images').trim() || 'storefront-images';
    const bucket = String(formData.get('bucket') || 'brand-assets').trim() || 'brand-assets';
    const kind = String(formData.get('kind') || 'image').trim() || 'image';

    if (!(file instanceof File)) {
      throw new Error('No file was provided');
    }

    const isImage = kind === 'image';
    const isVideo = kind === 'video';

    if (!isImage && !isVideo) {
      throw new Error('Unsupported media type');
    }

    if (isImage && !file.type.startsWith('image/')) {
      throw new Error('Only image files are supported');
    }

    if (isVideo && !file.type.startsWith('video/')) {
      throw new Error('Only video files are supported');
    }

    const maxBytes = isVideo ? 128 * 1024 * 1024 : 16 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new Error(`Please choose a ${kind} smaller than ${isVideo ? '128 MB' : '16 MB'}`);
    }

    const safeName = file.name
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '') || 'image';
    const extensionMatch = file.name.match(/\.([^.]+)$/);
    const extension = extensionMatch ? `.${extensionMatch[1].toLowerCase()}` : '';
    const uniqueId = crypto.randomUUID();
    const path = `${folder}/${Date.now()}-${uniqueId}-${safeName}${extension}`;
    const fileBytes = Buffer.from(await file.arrayBuffer());

    if (!['brand-assets', 'menu'].includes(bucket)) {
      throw new Error('Unsupported upload bucket');
    }

    const { error } = await supabaseAdmin.storage.from(bucket).upload(path, fileBytes, {
      contentType: file.type,
      upsert: false,
    });

    if (error) throw error;

    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
    if (!data.publicUrl) {
      throw new Error('The image uploaded, but a public URL could not be generated');
    }

    return { success: true, publicUrl: data.publicUrl };
  } catch (error: any) {
    console.error('Failed to upload storefront asset:', error);
    throw new Error(error.message || 'Failed to upload storefront asset');
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

    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete site config:', error);
    throw new Error(error.message || 'Failed to delete site config');
  }
}
