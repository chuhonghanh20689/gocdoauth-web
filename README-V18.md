# Góc Đồ Auth v18

- Homepage hero title, kicker, subtitle and CTA are editable from Admin > Nội dung > Trang chủ.
- Homepage collection heading/count, featured section labels and About teaser are also editable.
- Public content/settings are read server-side with the Supabase secret key, avoiding public RLS issues and ensuring the latest admin changes appear immediately.
- Keep the existing .env.local values. Do not commit secrets.
