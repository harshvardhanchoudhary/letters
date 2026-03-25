import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { markAsRead } from '@/app/actions/letters'

// LEARN: In Next.js 15, dynamic route params are a Promise — you must await them.
// [id] in the folder name becomes params.id in the component.
// The page is a Server Component: it runs on the server, fetches the letter,
// and streams the rendered HTML to the browser. No loading state needed.

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
      id, subject, body, sent_at, read_at, from_id, to_id,
      from_profile:profiles!from_id(display_name, email)
    `)
    .eq('id', id)
    .single()

  if (!letter) notFound()

  // Security: only sender or recipient may read this letter
  if (letter.from_id !== user.id && letter.to_id !== user.id) notFound()

  // Mark as read when the recipient opens it
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
      {/* Back */}
      <div className="mb-12">
        <Link
          href="/letters"
          className="font-garamond text-ink-faint hover:text-ink-muted italic text-sm transition-colors duration-200"
        >
          ← all letters
        </Link>
      </div>

      {/* Letter header */}
      <div className="mb-8 pb-6 border-b border-border">
        {letter.subject && (
          <h1 className="font-garamond text-2xl text-ink mb-4">{letter.subject}</h1>
        )}
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="font-garamond text-ink-muted italic text-sm">from {fromName}</span>
          <span className="font-garamond text-ink-faint text-sm">
            {formatLetterDate(letter.sent_at)}
          </span>
        </div>
      </div>

      {/* Letter body */}
      <div className="letter-body font-garamond mb-16">{letter.body}</div>

      {/* Write back — only shown when reading a letter from the other person */}
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
