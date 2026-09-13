# Góc Đồ Auth — Catalogue v8

Bản này hoàn thiện phần catalogue theo Supabase:
- categories: Đồng hồ / Nước hoa
- brands: tự tạo khi thêm sản phẩm
- products: SKU, giá, tiền tệ, mô tả, chi tiết, tình trạng, trạng thái, nổi bật, thứ tự
- product_images: nhiều ảnh / sản phẩm
- Supabase Storage bucket `product-images`
- Admin CRUD sản phẩm + upload nhiều ảnh
- Public catalogue chỉ hiển thị sản phẩm `published`

## Làm một lần trên Supabase
Chạy file `SUPABASE-PRODUCT-COMPLETE.sql` trong SQL Editor.

## Local
Giữ `.env.local` với:
`NEXT_PUBLIC_SUPABASE_URL`
`NEXT_PUBLIC_SUPABASE_ANON_KEY` hoặc `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
`SUPABASE_SERVICE_ROLE_KEY` hoặc `SUPABASE_SECRET_KEY`

Không đưa service role key lên GitHub/Vercel client.
