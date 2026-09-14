import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import { getSetting } from "@/lib/content";
import { currentAdmin } from "@/lib/auth";
import RecoveryRedirect from "@/components/RecoveryRedirect";
import Logout from "@/app/admin/Logout";
import { displayFont, brandFont, monoFont } from "@/app/fonts";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Góc Đồ Auth — Đồng hồ & Nước hoa chính hãng",
  description: "Catalogue đồng hồ và nước hoa chính hãng được tuyển chọn.",
  icons: { icon: "/favicon.png" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [logo, siteName, admin] = await Promise.all([
    getSetting("logo_path", "/logo-placeholder.svg"),
    getSetting("site_name", "GÓC ĐỒ AUTH"),
    currentAdmin(),
  ]);

  return (
    <html lang="vi">
      <body className={`${displayFont.variable} ${brandFont.variable} ${monoFont.variable}`}>
        <RecoveryRedirect />
        <div className="site-shell">
          <header className="header">
            <div className="container">
              <div className="topbar">
                <Link href="/" className="brand-lockup" aria-label={siteName}>
                  <span className="logo-wrap">
                    <Image src={logo} alt={siteName} width={180} height={80} priority unoptimized />
                  </span>
                  <span className="brand-name">{siteName}</span>
                </Link>
                <form className="search-form" action="/products" method="get">
                  <input className="search" name="q" placeholder="Tìm trong catalogue..." aria-label="Tìm trong catalogue" />
                </form>
              </div>

              <nav className="nav">
                <Link href="/">Trang chủ</Link>
                <Link href="/products">Sản phẩm</Link>
                <Link href="/products/watches">Đồng hồ</Link>
                <Link href="/products/perfumes">Nước hoa</Link>
                <Link href="/about">Giới thiệu</Link>
                <Link href="/contact">Liên hệ</Link>
                {admin && <Link href="/admin">Quản trị</Link>}
              </nav>

              {admin && (
                <nav className="admin-nav" aria-label="Quản trị">
                  <span className="admin-nav-label">ADMIN</span>
                  <Link href="/admin">Tổng quan</Link>
                  <Link href="/admin/products">Sản phẩm</Link>
                  <Link href="/admin/branding">Nhận diện</Link>
                  <Link href="/admin/content">Nội dung</Link>
                  <Link href="/admin/admins">Admin</Link>
                  <Link href="/admin/settings">Tài khoản</Link>
                  <Logout compact />
                </nav>
              )}
            </div>
          </header>

          {children}

          <footer className="footer">
            <div className="container footer-grid">
              <div>
                <h3>{siteName}</h3>
                <p className="mono" style={{ fontSize: 12 }}>ĐỒNG HỒ & NƯỚC HOA / CATALOGUE</p>
              </div>
              <div>
                <h3>Sản phẩm</h3>
                <Link href="/products/watches">Đồng hồ</Link>
                <Link href="/products/perfumes">Nước hoa</Link>
              </div>
              <div>
                <h3>Thông tin</h3>
                <Link href="/about">Giới thiệu</Link>
                <Link href="/contact">Liên hệ</Link>
                <Link href="/privacy">Chính sách bảo mật</Link>
                <Link href="/terms">Điều khoản & điều kiện</Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
