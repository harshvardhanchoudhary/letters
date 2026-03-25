'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function sendLetter(formData: FormData): Promise<{ error?: string } | void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const subject = (formData.get('subject') as string)?.trim() || null
  const body = (formData.get('body') as string)?.trim()

  if (!body) return { error: 'A letter cannot be empty.' }

  // Find the other person — there are only ever two users in this app
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .neq('id', user.id)
    .limit(1)

  if (!profiles || profiles.length === 0) {
    return { error: 'No one to write to yet — the other person has not joined.' }
  }

  const { error } = await supabase.from('letters').insert({
    from_id: user.id,
    to_id: profiles[0].id,
    subject,
    body,
  })

  if (error) return { error: error.message }

  redirect('/letters')
}

export async function markAsRead(letterId: string): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Only mark as read if this user is the recipient and it hasn't been read yet
  await supabase
    .from('letters')
    .update({ read_at: new Date().toISOString() })
    .eq('id', letterId)
    .eq('to_id', user.id)
    .is('read_at', null)
}
