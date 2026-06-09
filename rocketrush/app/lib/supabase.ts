// Browser Supabase client. Null (→ guest mode) when env isn't configured,
// so the game runs with zero setup. Add NEXT_PUBLIC_SUPABASE_* to enable accounts.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anon ? createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true } }) : null;

export const ACCOUNTS_ENABLED = !!supabase;
