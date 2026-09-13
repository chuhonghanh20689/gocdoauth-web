import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { getSupabaseAdmin, getSupabasePublic } from "@/lib/supabase";
export const runtime = "nodejs";
export async function PUT(req: Request) {
  const a = await currentAdmin(); if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { currentPassword, newPassword } = await req.json();
  if (String(newPassword).length < 10) return NextResponse.json({ error: "Mật khẩu mới cần ít nhất 10 ký tự." }, { status: 400 });
  const publicSupabase = getSupabasePublic();
  const { error: checkError } = await publicSupabase.auth.signInWithPassword({ email: String(a.email), password: String(currentPassword) });
  const supabase = getSupabaseAdmin();
  if (checkError) return NextResponse.json({ error: "Mật khẩu hiện tại không đúng." }, { status: 400 });
  const { error } = await supabase.auth.admin.updateUserById(a.id, { password: String(newPassword) });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 }); return NextResponse.json({ ok: true });
}
