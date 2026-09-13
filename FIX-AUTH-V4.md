# Auth fix v4

Fixed the admin login/profile lookup. After Supabase Auth signs the user in, the server now validates the access token with Supabase Auth and reads `admin_profiles` with the server-only key. This avoids the RLS issue where the profile lookup was made without the user's JWT.

No new SQL is required. Keep `.env.local` in the project root and restart `npm run dev` after replacing the project.
