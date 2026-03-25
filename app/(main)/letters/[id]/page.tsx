import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { markAsRead } from '@/app/actions/letters'

function formatLetterDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function LetterPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: letter } = await supabase
    .from('letters')
    .select(`
      id, body, sent_at, read_at, from_id, to_id,
      from_profile:profiles!from_id(display_name, email)
    `)
    .eq('id', id)
    .single()

  if (!letter) notFound()

  if (letter.from_id !== user.id && letter.to_id !== user.id) notFound()

  if (letter.to_id === user.id && !letter.read_at) {
    await markAsRead(id)
  }

  const isFromMe = letter.from_id === user.id
  const fromProfile = Array.isArray(letter.from_profile) ? letter.from_profile[0] : letter.from_profile
  const fromName = isFromMe
    ? 'you'
    : fromProfile?.display_name || fromProfile?.email?.split('@')[0] || '—'

  return (
    <div className="max-w-lg">
      <div className="mb-12">
        <Link
          href="/letters"
          className="font-garamond text-ink-faint hover:text-ink-muted italic text-sm transition-colors duration-200"
        >
          ← letters
        </Link>
      </div>

      {/* Date + from */}
      <div className="mb-10">
        <p className="font-garamond text-ink-faint text-sm italic">
          {formatLetterDate(letter.sent_at)}
        </p>
        {!isFromMe && (
          <p className="font-garamond text-ink-muted text-sm italic mt-0.5">
            from {fromName}
          </p>
        )}
      </div>

      {/* Letter body */}
      <div className="letter-body font-garamond mb-16">{letter.body}</div>

      {/* Write back */}
      {!isFromMe && (
        <div className="pt-5 border-t border-border">
          <Link
            href="/letters/write"
            className="font-garamond text-base italic text-ink-muted hover:text-ink transition-colors duration-200"
          >
            Write back →
          </Link>
        </div>
      )}
    </div>
  )
}
