'use client';

import { createSupabaseBrowser } from '@/lib/supabaseBrowser';

export function createClient() {
  return createSupabaseBrowser();
}
