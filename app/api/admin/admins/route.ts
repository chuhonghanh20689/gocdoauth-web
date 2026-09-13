import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  const a = await currentAdmin(); if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = getSupabaseAdmin(); const { data, error } = await supabase.from("admin_profiles").select("id,email,name,role,is_active,created_at").order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 }); return NextResponse.json(data || []);
}

export async function POST(req: Request) {
  const a = await currentAdmin(); if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (a.role !== "owner") return NextResponse.json({ error: "Chỉ owner được thêm admin." }, { status: 403 });
  try {
    const body = await req.json(); const email = String(body.email || "").trim(); const password = String(body.password || "");
    if (!email || password.length < 10) return NextResponse.json({ error: "Cần email và mật khẩu ít nhất 10 ký tự." }, { status: 400 });
    const supabase = getSupabaseAdmin(); const { data: created, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !created.user) throw error || new Error("Không tạo được tài khoản.");
    const { data: profile, error: pError } = await supabase.from("admin_profiles").insert({ id: created.user.id, email, name: String(body.name || "Admin"), role: "admin", is_active: true }).select("id,email,name,role,is_active").single();
    if (pError) { await supabase.auth.admin.deleteUser(created.user.id); throw pError; }
    return NextResponse.json(profile, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Không thể tạo admin." }, { status: 500 }); }
}

export async function DELETE(req: Request) {
  const a = await currentAdmin(); if (!a) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (a.role !== "owner") return NextResponse.json({ error: "Chỉ owner được xóa admin." }, { status: 403 });
  const { id } = await req.json(); if (id === a.id) return NextResponse.json({ error: "Không thể tự xóa tài khoản đang đăng nhập." }, { status: 400 });
  const supabase = getSupabaseAdmin(); const { error } = await supabase.auth.admin.deleteUser(id); if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from("admin_profiles").delete().eq("id", id); return NextResponse.json({ ok: true });
}
