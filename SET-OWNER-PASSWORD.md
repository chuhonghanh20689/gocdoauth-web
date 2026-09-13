# Đặt mật khẩu Owner trực tiếp (không cần email reset)

Nếu email reset của Supabase bị giới hạn, có thể đặt lại mật khẩu Owner trực tiếp từ máy local bằng Supabase Service Role Key.

## 1. Kiểm tra `.env.local`

Đảm bảo project đang có:

```env
NEXT_PUBLIC_SUPABASE_URL=https://cgmfaoumrdcowpmlself.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`SUPABASE_SERVICE_ROLE_KEY` chỉ được lưu local/server, không đưa lên GitHub và không đưa vào code phía client.

## 2. Chạy lệnh

```bash
npm run set-owner-password
```

Nhập email Owner, mật khẩu mới (ít nhất 10 ký tự), rồi nhập lại mật khẩu.

Script sẽ dùng Service Role Key **chỉ trên máy local** để cập nhật mật khẩu Auth và đảm bảo user vẫn có `role=owner` trong `admin_profiles`.

Sau đó đăng nhập tại:

`http://localhost:3000/admin/login`

Không cần gửi password hoặc Service Role Key cho người khác.
