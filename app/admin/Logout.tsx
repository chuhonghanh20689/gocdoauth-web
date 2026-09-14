"use client";

import { useRouter } from "next/navigation";

export default function Logout({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }
  return (
    <button
      type="button"
      className={compact ? "admin-nav-logout" : "btn"}
      onClick={handleLogout}
    >
      Đăng xuất{compact ? "" : " →"}
    </button>
  );
}
