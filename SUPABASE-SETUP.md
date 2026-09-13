# Kết nối Góc Đồ Auth với Supabase

## 1) Lấy API keys
Trong Supabase: **Project Settings → API**.

Điền vào `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

`SUPABASE_SERVICE_ROLE_KEY` chỉ được dùng phía server. Không đưa nó vào biến có tiền tố `NEXT_PUBLIC_`, không commit lên GitHub và không gửi cho người khác.

## 2) Tạo owner đầu tiên
Trong Supabase: **Authentication → Users → Add user**.

Tạo user bằng email và mật khẩu owner mà bạn muốn dùng để đăng nhập `/admin`.
Bật **Auto Confirm User** nếu giao diện có tùy chọn này.

Sau khi tạo, copy **User UID**.

Vào **SQL Editor** và chạy:

```sql
insert into public.admin_profiles (id, email, name, role, is_active)
values ('PASTE_USER_UID_HERE', 'YOUR_EMAIL_HERE', 'Owner', 'owner', true)
on conflict (id) do update set role='owner', is_active=true;
```

## 3) Chạy website
```bash
npm install
npm run dev
```

Mở `/admin/login` để đăng nhập.

## 4) Production / Vercel
Thêm 3 biến môi trường trên vào Vercel Project Settings → Environment Variables.
Không upload `.env.local` lên GitHub.
