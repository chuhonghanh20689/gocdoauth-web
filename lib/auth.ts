import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabasePublic } from "./supabase";

const ACCESS = "gda_sb_access";
const REFRESH = "gda_sb_refresh";

export async function getServerSupabase() {
  const jar = await cookies();
  const access = jar.get(ACCESS)?.value;
  const refresh = jar.get(REFRESH)?.value;
  if (!access || !refresh) return null;
  const supabase = getSupabasePublic();
  const { data, error } = await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
  if (error || !data.user) return null;
  return supabase;
}

export async function currentAdmin() {
  try {
    const supabase = await getServerSupabase();
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile, error } = await supabase
      .from("admin_profiles")
      .select("id,email,name,role,is_active")
      .eq("id", user.id)
      .maybeSingle();
    if (error || !profile?.is_active) return null;
    return profile;
  } catch { return null; }
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ACCESS, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  res.cookies.set(REFRESH, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

export const authCookieNames = { access: ACCESS, refresh: REFRESH };
