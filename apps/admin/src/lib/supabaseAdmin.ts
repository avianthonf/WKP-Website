import { createClient } from '@supabase/supabase-js';
import { createMockSupabaseClient, shouldUseMockSupabase } from './supabaseFallback';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Server only — never import in client components.
export const supabaseAdmin =
  !shouldUseMockSupabase() && supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl!, supabaseServiceKey)
    : createMockSupabaseClient();
