// LEARN: "Server client" — runs only on the server (never shipped to the browser).
// Used in Server Components and Server Actions to fetch data.
// Because it runs server-side, it can safely read cookies and
// has access to private env vars that never leave the server.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getCookieOptions } from './config'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getCookieOptions(),
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Parameters<typeof cookieStore.set>[2] }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — safe to ignore.
            // Middleware handles session refresh in that case.
          }
        },
      },
    }
  )
}
