'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const MOOD_LABELS = ['mood', 'phase', 'energy', 'social battery', 'need from partner', 'note']

export async function saveMoodCheckIn(formData: FormData): Promise<{ error?: string } | void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const updates: { user_id: string; label: string; value: string; updated_at: string }[] = []
  const deletes: string[] = []

  for (const label of MOOD_LABELS) {
    const value = (formData.get(label) as string | null)?.trim()
    if (value) {
      updates.push({ user_id: user.id, label, value, updated_at: new Date().toISOString() })
    } else {
      deletes.push(label)
    }
  }

  if (updates.length > 0) {
    const { error } = await supabase.from('currently').upsert(updates, { onConflict: 'user_id,label' })
    if (error) return { error: error.message }
  }

  if (deletes.length > 0) {
    await supabase.from('currently').delete().eq('user_id', user.id).in('label', deletes)
  }

  revalidatePath('/')
  revalidatePath('/mood')
  redirect('/mood?saved=1')
}
