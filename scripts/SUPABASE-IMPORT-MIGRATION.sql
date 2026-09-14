-- Chạy 1 lần trong Supabase SQL Editor trước khi import.
alter table public.products
  add column if not exists cost numeric(14,2),
  add column if not exists volume text;
