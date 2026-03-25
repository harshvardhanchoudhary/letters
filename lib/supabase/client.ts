// LEARN: "Browser client" — runs in the user's browser.
// Used inside interactive components (buttons, forms) where the user
// is already logged in and we need to fetch data client-side.
// It reads auth state from a cookie that Supabase sets on login.

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
