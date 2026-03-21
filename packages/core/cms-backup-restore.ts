// =============================================================
// src/lib/cms-backup-restore.ts
// Backup & restore helpers — aligned with the new schema.
// Tables: pizzas, toppings, pizza_toppings, extras, addons,
//         desserts, categories, site_config
// =============================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Metadata ──────────────────────────────────────────────────

interface BackupMetadata {
  version: string;
  created: string;
  source: string;
  type: 'full' | 'content' | 'menu';
  checksum: string;
}

interface BackupPayload {
  metadata: BackupMetadata;
  data: Record<string, unknown>;
}

function buildChecksum(data: unknown): string {
  return Buffer.from(JSON.stringify(data))
    .toString('base64')
    .slice(0, 16);
}

// =============================================================
// FULL BACKUP — all catalog + config tables
// =============================================================

export const createFullBackup = async (source: string): Promise<BackupPayload> => {
  const [
    { data: categories },
    { data: toppings },
    { data: pizzas },
    { data: pizzaToppings },
    { data: extras },
    { data: addons },
    { data: desserts },
    { data: siteConfig },
  ] = await Promise.all([
    supabase.from('categories').select('*'),
    supabase.from('toppings').select('*'),
    supabase.from('pizzas').select('*'),
    supabase.from('pizza_toppings').select('*'),
    supabase.from('extras').select('*'),
    supabase.from('addons').select('*'),
    supabase.from('desserts').select('*'),
    supabase.from('site_config').select('*'),
  ]);

  const data = {
    categories,
    toppings,
    pizzas,
    pizzaToppings,
    extras,
    addons,
    desserts,
    siteConfig,
  };

  return {
    metadata: {
      version: '2.0',
      created: new Date().toISOString(),
      source,
      type: 'full',
      checksum: buildChecksum(data),
    },
    data,
  };
};

// =============================================================
// CONTENT BACKUP — config + categories only
// =============================================================

export const createContentBackup = async (source: string): Promise<BackupPayload> => {
  const [
    { data: categories },
    { data: siteConfig },
  ] = await Promise.all([
    supabase.from('categories').select('*'),
    supabase.from('site_config').select('*'),
  ]);

  const data = { categories, siteConfig };

  return {
    metadata: {
      version: '2.0',
      created: new Date().toISOString(),
      source,
      type: 'content',
      checksum: buildChecksum(data),
    },
    data,
  };
};

// =============================================================
// MENU BACKUP — all purchasable items + their relationships
// =============================================================

export const createMenuBackup = async (source: string): Promise<BackupPayload> => {
  const [
    { data: categories },
    { data: toppings },
    { data: pizzas },
    { data: pizzaToppings },
    { data: extras },
    { data: addons },
    { data: desserts },
  ] = await Promise.all([
    supabase.from('categories').select('*'),
    supabase.from('toppings').select('*'),
    supabase.from('pizzas').select('*'),
    supabase.from('pizza_toppings').select('*'),
    supabase.from('extras').select('*'),
    supabase.from('addons').select('*'),
    supabase.from('desserts').select('*'),
  ]);

  const data = {
    categories,
    toppings,
    pizzas,
    pizzaToppings,
    extras,
    addons,
    desserts,
  };

  return {
    metadata: {
      version: '2.0',
      created: new Date().toISOString(),
      source,
      type: 'menu',
      checksum: buildChecksum(data),
    },
    data,
  };
};

// =============================================================
// RESTORE  (placeholder — implement when restore flow is ready)
// =============================================================

export const restoreFromBackup = async (backup: BackupPayload): Promise<void> => {
  console.info(
    `[restoreFromBackup] type="${backup.metadata.type}" ` +
    `version="${backup.metadata.version}" ` +
    `checksum="${backup.metadata.checksum}"`
  );
  // TODO: implement table-by-table upsert using backup.data
};

export const restoreFromBackupFile = async (filePath: string): Promise<void> => {
  console.info(`[restoreFromBackupFile] file="${filePath}"`);
  // TODO: read file, parse JSON, call restoreFromBackup
};

export const resetToDefaults = async (): Promise<void> => {
  console.info('[resetToDefaults] No-op. Implement when ready.');
};
