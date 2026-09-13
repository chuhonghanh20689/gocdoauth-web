# v14 — Supabase server key fix

The server client now prioritizes `SUPABASE_SERVICE_ROLE_KEY` before `SUPABASE_SECRET_KEY`.
This avoids accidentally using a stale `SUPABASE_SECRET_KEY` if both variables exist in `.env.local`.

Keep only the current server key if possible:
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

Do not expose this key in client code, screenshots, Git, or NEXT_PUBLIC_ variables.
Restart `npm run dev` after changing `.env.local`.
