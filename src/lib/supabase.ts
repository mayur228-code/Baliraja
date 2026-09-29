import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * BALIRAJA KRISHI SEVA KENDRA — Production Supabase Client Adapter
 * 
 * Safely initializes Supabase client using client-safe environment variables:
 * - VITE_SUPABASE_URL (e.g. https://your-project.supabase.co)
 * - VITE_SUPABASE_ANON_KEY (Public anonymous key with Row-Level Security)
 * 
 * Provides fallback detection so build/runtime never crash if Supabase credentials
 * are not yet injected in Vercel environment settings.
 */

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey.length > 20
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
