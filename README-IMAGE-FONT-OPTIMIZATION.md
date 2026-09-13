# Image + Vietnamese font optimization

Bản này giữ nguyên giao diện/dữ liệu hiện tại nhưng tối ưu 2 điểm:

1. Ảnh public dùng `next/image` thay cho `<img>` ở hero, ảnh danh mục và ảnh sản phẩm.
   - Tự resize theo kích thước màn hình.
   - Browser nhận WebP/AVIF khi phù hợp.
   - Ảnh card bên dưới viewport được lazy-load mặc định.
   - Hero được ưu tiên tải.
2. Font bỏ Google Fonts `@import` trong CSS và chuyển sang `next/font/google`.
   - Libre Baskerville cho heading/serif.
   - Noto Sans Mono cho phần mono.
   - Cả hai khai báo subset `vietnamese` để dấu tiếng Việt không bị fallback/hiển thị lệch.
3. Next.js được giữ ở 15.5.24 (security patch).

## Chạy local

Trong thư mục project:

```powershell
npm install
npm run build
npm run dev
```

Nếu build local OK thì commit cả `package.json` và `package-lock.json` rồi push lên GitHub để Vercel deploy.
