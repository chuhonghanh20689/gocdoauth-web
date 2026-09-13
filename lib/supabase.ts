import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

export function getSupabaseBrowserConfig() {
  if (!url || !anonKey) throw new Error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc Publishable/Anon Key.");
  return { url, anonKey };
}

export function getSupabaseAdmin() {
  if (!url || !serviceKey) throw new Error("Thiếu SUPABASE_SECRET_KEY hoặc SUPABASE_SERVICE_ROLE_KEY.");
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

export function getSupabasePublic() {
  if (!url || !anonKey) throw new Error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc Publishable/Anon Key.");
  return createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
}
