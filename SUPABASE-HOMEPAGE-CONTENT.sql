-- Góc Đồ Auth — Homepage content seed/migration
-- Chạy 1 lần trong Supabase SQL Editor.
-- Toàn bộ text chính trên homepage được lưu trong pages.content (JSON).

insert into public.pages (page_key, title, content, is_published)
values (
  'home',
  'Trang chủ',
  $$
  {
    "heroKicker": "Góc Đồ Auth / Tuyển chọn",
    "heroTitle": "Đồ chính hãng,\nđược tuyển chọn kỹ.",
    "heroSubtitle": "Catalogue đồng hồ và nước hoa chính hãng, trình bày đơn giản để bạn tập trung vào sản phẩm.",
    "heroButton": "Xem catalogue →",
    "collectionTitle": "Bộ sưu tập",
    "collectionCount": "02 danh mục",
    "watchKicker": "01 / Đồng hồ",
    "watchTitle": "Đồng hồ",
    "watchLink": "Xem sản phẩm →",
    "perfumeKicker": "02 / Hương thơm",
    "perfumeTitle": "Nước hoa",
    "perfumeLink": "Xem sản phẩm →",
    "featuredTitle": "Sản phẩm nổi bật",
    "featuredLink": "Xem tất cả →",
    "featuredEmpty": "Chưa có sản phẩm nổi bật.",
    "aboutKicker": "Về Góc Đồ Auth",
    "aboutTitle": "Một catalogue\nđơn giản, dễ xem.",
    "aboutBody": "Chúng tôi tập trung vào đồng hồ và nước hoa chính hãng, với thông tin sản phẩm rõ ràng và cách liên hệ đơn giản.",
    "aboutButton": "Tìm hiểu thêm →"
  }
  $$,
  true
)
on conflict (page_key) do update
set title=excluded.title, content=excluded.content, is_published=true, updated_at=now();

-- Các setting ảnh vẫn nằm riêng trong site_settings để Admin có thể thay ảnh mà không sửa text.
insert into public.site_settings(key,value) values
('site_name','GÓC ĐỒ AUTH'),
('home_banner_path',''),
('category_watches_image',''),
('category_perfumes_image','')
on conflict (key) do nothing;
