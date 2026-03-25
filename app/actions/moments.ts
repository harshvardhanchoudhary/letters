'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function addMoment(
  formData: FormData
): Promise<{ error?: string } | void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const title = (formData.get('title') as string)?.trim()
  const note = (formData.get('note') as string)?.trim() || null
  const occurredAt = (formData.get('occurred_at') as string)?.trim()

  if (!title) return { error: 'A moment needs a title.' }
  if (!occurredAt) return { error: 'A moment needs a date.' }

  const { error } = await supabase.from('moments').insert({
    created_by: user.id,
    title,
    note,
    occurred_at: new Date(occurredAt).toISOString(),
  })

  if (error) return { error: error.message }

  redirect('/timeline')
}
