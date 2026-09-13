"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }, []);

  useEffect(() => {
    if (!supabase) {
      setError("Thiếu cấu hình Supabase.");
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setReady(!!data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [supabase]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!supabase) return setError("Thiếu cấu hình Supabase.");
    if (password.length < 10) return setError("Mật khẩu mới cần ít nhất 10 ký tự.");
    if (password !== confirm) return setError("Mật khẩu xác nhận không khớp.");
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await supabase.auth.signOut();
    setMessage("Đổi mật khẩu thành công. Bạn sẽ được chuyển đến trang đăng nhập.");
    setTimeout(() => router.replace("/admin/login"), 900);
  }

  return (
    <main className="page">
      <div className="container" style={{ maxWidth: 600 }}>
        <div className="kicker">Khu vực quản trị</div>
        <h1>Đặt lại mật khẩu</h1>
        <div className="admin-box">
          {!ready && !error ? (
            <p>Đang xác thực liên kết đặt lại mật khẩu...</p>
          ) : (
            <form onSubmit={submit}>
              <label className="mono">Mật khẩu mới</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                minLength={10}
                required
                style={{display:"block",width:"100%",padding:12,border:"1px solid #211f1a",background:"transparent",margin:"8px 0 18px"}}
              />
              <label className="mono">Nhập lại mật khẩu</label>
              <input
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                type="password"
                minLength={10}
                required
                style={{display:"block",width:"100%",padding:12,border:"1px solid #211f1a",background:"transparent",margin:"8px 0 18px"}}
              />
              {error && <p style={{color:"#7b3028"}}>{error}</p>}
              {message && <p>{message}</p>}
              <button className="btn" disabled={loading}>{loading ? "Đang cập nhật..." : "Đổi mật khẩu →"}</button>
            </form>
          )}
          {error && !ready && <p style={{marginTop:12,color:"#7b3028"}}>Liên kết có thể đã hết hạn. Hãy gửi lại email đặt lại mật khẩu từ Supabase.</p>}
        </div>
      </div>
    </main>
  );
}
