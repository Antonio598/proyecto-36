import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side client — used by API routes
// We disable SSL verification for self-hosted Supabase with self-signed certs
export function createServerSupabase() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

// Client-side singleton — only used for session management in the browser
// NOTE: Direct browser → Supabase calls may fail if Supabase has an invalid SSL cert.
// Use API routes (/api/auth/*) as proxy instead.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
