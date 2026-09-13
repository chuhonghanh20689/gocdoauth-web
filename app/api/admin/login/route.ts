import { NextResponse } from "next/server";
import { getSupabasePublic } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const supabase = getSupabasePublic();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(email).trim(),
      password: String(password),
    });
    if (error || !data.session || !data.user) {
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng." }, { status: 401 });
    }

    // IMPORTANT: query with the signed-in user's client, not an admin/secret client.
    // RLS calls public.is_admin(), which checks auth.uid() against admin_profiles.
    const { data: profile, error: profileError } = await supabase
      .from("admin_profiles")
      .select("id,email,name,role,is_active")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: `Không đọc được quyền quản trị: ${profileError.message}` }, { status: 500 });
    }
    if (!profile?.is_active) {
      await supabase.auth.signOut();
      return NextResponse.json({ error: "Tài khoản chưa được cấp quyền quản trị." }, { status: 403 });
    }

    const res = NextResponse.json({ ok: true, admin: profile });
    res.cookies.set("gda_sb_access", data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    res.cookies.set("gda_sb_refresh", data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Lỗi không xác định";
    return NextResponse.json({ error: `Không thể đăng nhập: ${message}` }, { status: 500 });
  }
}
