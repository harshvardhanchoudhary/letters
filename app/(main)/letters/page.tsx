import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LettersListClient from './LettersListClient'

export default async function LettersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: letters } = await supabase
    .from('letters')
    .select(`
      id, body, sent_at, read_at, from_id, to_id,
      from_profile:profiles!from_id(display_name, email)
    `)
    .or(`from_id.eq.${user.id},to_id.eq.${user.id}`)
    .order('sent_at', { ascending: true })

  return (
    <div className="max-w-xl">
      <div className="mb-12 flex items-baseline justify-between">
        <h1 className="font-garamond text-2xl text-ink">Letters</h1>
        <Link href="/letters/write" className="font-garamond text-sm italic text-ink-muted transition-colors duration-200 hover:text-ink">
          write →
        </Link>
      </div>

      {(!letters || letters.length === 0) && (
        <p className="font-garamond italic text-ink-muted">
          No letters yet.{' '}
          <Link href="/letters/write" className="underline decoration-border-dark underline-offset-4 transition-colors duration-200 hover:text-ink">
            Write the first one.
          </Link>
        </p>
      )}

      {letters && letters.length > 0 && (
        <LettersListClient letters={letters} userId={user.id} />
      )}
    </div>
  )
}
