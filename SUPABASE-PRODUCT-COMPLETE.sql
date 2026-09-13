-- Góc Đồ Auth — product/catalogue hardening migration
-- Chạy sau schema chính. An toàn để chạy lại.

create extension if not exists pgcrypto;

-- Categories
insert into public.categories (name, slug, sort_order, is_active)
values ('Đồng hồ','watches',1,true),('Nước hoa','perfumes',2,true)
on conflict (slug) do update set name=excluded.name, sort_order=excluded.sort_order, is_active=true;

-- Product indexes / constraints
create index if not exists idx_products_created_at on public.products(created_at desc);
create index if not exists idx_products_slug on public.products(slug);
create index if not exists idx_product_images_sort on public.product_images(product_id, sort_order);

-- Public catalogue policies
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;

drop policy if exists "public read active categories" on public.categories;
create policy "public read active categories" on public.categories for select to anon, authenticated using (is_active = true);

drop policy if exists "public read active brands" on public.brands;
create policy "public read active brands" on public.brands for select to anon, authenticated using (is_active = true);

drop policy if exists "public read published products" on public.products;
create policy "public read published products" on public.products for select to anon, authenticated using (status = 'published');

drop policy if exists "public read published product images" on public.product_images;
create policy "public read published product images" on public.product_images for select to anon, authenticated using (exists (select 1 from public.products p where p.id=product_images.product_id and p.status='published'));

-- Admin CRUD is intentionally protected by the app's server-side admin guard.
-- These RLS policies also protect the tables if a client calls Supabase directly.
drop policy if exists "admins manage categories" on public.categories;
create policy "admins manage categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage brands" on public.brands;
create policy "admins manage brands" on public.brands for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage products" on public.products;
create policy "admins manage products" on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins manage product images" on public.product_images;
create policy "admins manage product images" on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Storage buckets
insert into storage.buckets(id,name,public) values ('product-images','product-images',true),('site-assets','site-assets',true) on conflict(id) do update set public=true;

drop policy if exists "public view product images" on storage.objects;
create policy "public view product images" on storage.objects for select to anon, authenticated using (bucket_id in ('product-images','site-assets'));

drop policy if exists "admins upload site files" on storage.objects;
create policy "admins upload site files" on storage.objects for insert to authenticated with check (bucket_id in ('product-images','site-assets') and public.is_admin());

drop policy if exists "admins update site files" on storage.objects;
create policy "admins update site files" on storage.objects for update to authenticated using (bucket_id in ('product-images','site-assets') and public.is_admin()) with check (bucket_id in ('product-images','site-assets') and public.is_admin());

drop policy if exists "admins delete site files" on storage.objects;
create policy "admins delete site files" on storage.objects for delete to authenticated using (bucket_id in ('product-images','site-assets') and public.is_admin());
