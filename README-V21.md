# Góc Đồ Auth v21

Fix trang Admin > Nội dung:
- Sửa lỗi `null value in column "title" of relation "pages" violates not-null constraint`.
- Nội dung JSON được flatten đúng khi load vào form.
- Mỗi ô có nút `LƯU Ô NÀY` riêng, lưu từng field độc lập.
- API vẫn hỗ trợ whole-section save cũ.
- Homepage đọc content từ DB và không cần sửa code khi thay text.

Không cần SQL mới.
