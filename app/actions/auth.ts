'use server'

// LEARN: "Server Actions" are functions that run on the server when a form
// is submitted or a button is clicked. The browser never sees this code.
// Marking a file 'use server' means everything exported from it is a server action.
// This is how we safely check the allowed emails without exposing them to the browser.

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function signIn(email: string): Promise<{ error?: string; success?: boolean }> {
  const allowedEmails = [
    process.env.ALLOWED_EMAIL_1?.toLowerCase().trim(),
    process.env.ALLOWED_EMAIL_2?.toLowerCase().trim(),
  ].filter(Boolean) as string[]

  if (!allowedEmails.includes(email.toLowerCase().trim())) {
    return { error: 'This space is private and by invitation only.' }
  }

  // Determine display name from env config
  const displayName =
    email.toLowerCase().trim() === process.env.ALLOWED_EMAIL_1?.toLowerCase().trim()
      ? (process.env.DISPLAY_NAME_1 || email.split('@')[0])
      : (process.env.DISPLAY_NAME_2 || email.split('@')[0])

  const headersList = await headers()
  const origin = headersList.get('origin') || ''

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // After clicking the magic link, user is redirected here to exchange the code for a session
      emailRedirectTo: `${origin}/auth/callback`,
      data: { display_name: displayName },
    },
  })

  if (error) return { error: error.message }

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
