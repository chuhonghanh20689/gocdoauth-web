# Fix homepage content

Nguyên nhân: cột `pages.content` của Supabase là JSON/JSONB nên khi đọc về nó đã là object. Code cũ lại `JSON.parse(object)`, khiến toàn bộ nội dung tùy chỉnh bị bỏ qua và homepage dùng text mặc định.

Bản này đã sửa:
- `lib/content.ts`: đọc JSONB object trực tiếp.
- `/api/admin/content`: đọc JSONB đúng và PUT lưu object trực tiếp.
- Admin Content: kiểm tra response, chỉ báo “Đã lưu” khi API thực sự thành công.

Không cần chạy SQL mới nếu bảng `pages` đã tồn tại.
