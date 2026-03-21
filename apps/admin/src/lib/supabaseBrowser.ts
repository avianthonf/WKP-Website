'use client';

import { createBrowserClient } from '@supabase/ssr';
import { createMockSupabaseClient, shouldUseMockSupabase } from './supabaseFallback';

export function createSupabaseBrowser() {
  if (shouldUseMockSupabase()) {
    return createMockSupabaseClient();
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
