# Auth v7

Bản này bỏ việc dùng Secret/Service Role Key để kiểm tra quyền khi đăng nhập.

Luồng mới:
1. Supabase Auth xác thực email + mật khẩu bằng Publishable/Anon Key.
2. Client vừa đăng nhập giữ JWT của user.
3. Query `admin_profiles` bằng chính JWT đó.
4. RLS `admins read profiles` gọi `public.is_admin()` và kiểm tra `auth.uid()`.
5. Nếu `role=owner/admin` và `is_active=true`, server lưu session vào HttpOnly cookies và cho vào `/admin`.

Secret key vẫn chỉ dùng cho các thao tác đặc quyền như tạo/xóa admin.
