'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function savePostcard(
  imageUrl: string,
  caption: string | null
): Promise<{ error?: string } | void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .neq('id', user.id)
    .limit(1)

  if (!profiles || profiles.length === 0) {
    return { error: 'No one to send to yet — the other person has not joined.' }
  }

  const { error } = await supabase.from('postcards').insert({
    from_id: user.id,
    to_id: profiles[0].id,
    image_url: imageUrl,
    caption: caption || null,
  })

  if (error) return { error: error.message }

  redirect('/postcards')
}

export async function markPostcardAsRead(postcardId: string): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('postcards')
    .update({ read_at: new Date().toISOString() })
    .eq('id', postcardId)
    .eq('to_id', user.id)
    .is('read_at', null)
}
