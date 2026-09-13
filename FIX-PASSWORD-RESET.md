# Password reset flow

The password recovery email can land on `/` with an `#access_token=...` hash. The app now detects a recovery hash and redirects it to `/auth/reset-password` while preserving the hash.

The reset page uses the public Supabase key to establish the recovery session and calls `auth.updateUser({ password })`.

For production, add these redirect URLs in Supabase Authentication > URL Configuration:
- `http://localhost:3000/auth/reset-password`
- `https://gocdoauth.com/auth/reset-password`

For a local test, the existing recovery email can work because the app also catches a recovery hash arriving at `/`. If the link has expired, send a new password recovery email.
