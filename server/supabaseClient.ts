import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * BALIRAJA KRISHI SEVA KENDRA — Server-Side Supabase Client (Service Role)
 * 
 * Secure server-only Supabase adapter using elevated privileges (service_role):
 * - Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY exclusively on the server runtime.
 * - Used ONLY by Express/Vercel serverless backend routes.
 * - NEVER imported in client-side / browser code (Vite bundle).
 * - Fails gracefully when credentials are absent, allowing local filesystem fallback.
 */

export const SUPABASE_STORAGE_BUCKET = (
  process.env.SUPABASE_STORAGE_BUCKET || 'baliraja-assets'
).trim();

function getSupabaseUrl(): string {
  return (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
}

function getSupabaseServiceKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    ''
  ).trim();
}

export function isSupabaseServerConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceKey();
  return Boolean(
    url &&
    key &&
    url.startsWith('https://') &&
    key.length > 20
  );
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseServerConfigured()) {
    return null;
  }

  if (!cachedClient) {
    try {
      const url = getSupabaseUrl();
      const key = getSupabaseServiceKey();
      cachedClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.warn('[SUPABASE_SERVER] Failed to initialize Supabase admin client:', err instanceof Error ? err.message : String(err));
      return null;
    }
  }

  return cachedClient;
}
