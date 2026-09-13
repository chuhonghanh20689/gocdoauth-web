# Góc Đồ Auth

Website catalogue tiếng Việt cho đồng hồ và nước hoa chính hãng.

## Công nghệ
- Next.js 15 + React 19 + TypeScript
- Supabase Postgres + Storage + Auth
- Vercel phù hợp cho production

## Dữ liệu
Database schema nằm trong `gocdoauth-supabase-schema.sql`.

Hướng dẫn kết nối Supabase nằm trong `SUPABASE-SETUP.md`.

## Admin
- `/admin/login` — đăng nhập
- `/admin` — dashboard
- Quản lý sản phẩm
- Quản lý nội dung
- Quản lý logo
- Quản lý admin
- Đổi mật khẩu

## Bảo mật
`SUPABASE_SERVICE_ROLE_KEY` chỉ được dùng server-side. Không đặt biến này dưới `NEXT_PUBLIC_` và không commit secret lên Git.

## Đặt lại mật khẩu Owner không cần email

Nếu Supabase báo email rate limit exceeded, chạy `npm run set-owner-password`. Xem `SET-OWNER-PASSWORD.md`.
