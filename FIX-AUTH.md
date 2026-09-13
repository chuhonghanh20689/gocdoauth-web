# Auth fix

Authentication/profile lookup now uses the Supabase publishable/anon key. The service-role/secret key is only used by server-side admin operations that require elevated privileges.

After replacing the project, restart the dev server so `.env.local` is reloaded:

```bash
Ctrl+C
npm run dev
```

Make sure `.env.local` contains real values (not `...` or empty strings).
