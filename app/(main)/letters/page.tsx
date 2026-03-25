import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getYear(dateString: string) {
  return new Date(dateString).getFullYear()
}

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
      <div className="flex items-baseline justify-between mb-12">
        <h1 className="font-garamond text-2xl text-ink">Letters</h1>
        <Link
          href="/letters/write"
          className="font-garamond text-sm italic text-ink-muted hover:text-ink transition-colors duration-200"
        >
          write →
        </Link>
      </div>

      {(!letters || letters.length === 0) && (
        <p className="font-garamond text-ink-muted italic">
          No letters yet.{' '}
          <Link
            href="/letters/write"
            className="hover:text-ink transition-colors duration-200 underline underline-offset-4 decoration-border-dark"
          >
            Write the first one.
          </Link>
        </p>
      )}

      <div>
        {letters?.map((letter, i) => {
          const isFromMe = letter.from_id === user.id
          const isUnread = !isFromMe && !letter.read_at
          const fromProfile = Array.isArray(letter.from_profile) ? letter.from_profile[0] : letter.from_profile
          const fromName = isFromMe
            ? 'you'
            : fromProfile?.display_name || fromProfile?.email?.split('@')[0] || '—'

          // Body preview — first non-empty line, up to 140 chars
          const firstLine = letter.body.split('\n').find((l: string) => l.trim()) || ''
          const preview = firstLine.length > 140 ? firstLine.substring(0, 140) + '…' : firstLine

          // Year divider
          const year = getYear(letter.sent_at)
          const prevYear = i > 0 ? getYear(letters[i - 1].sent_at) : null
          const showYear = year !== prevYear

          return (
            <div key={letter.id}>
              {showYear && (
                <div className="flex items-center gap-4 py-5 mt-2">
                  <span className="font-garamond text-ink-faint text-sm italic shrink-0">{year}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}

              <Link
                href={`/letters/${letter.id}`}
                className="block group py-5 border-b border-border last:border-b-0"
              >
                <div className={`flex gap-4 ${isFromMe ? 'pl-6' : ''}`}>
                  {/* Unread dot */}
                  {!isFromMe && (
                    <div className="w-1.5 shrink-0 pt-2">
                      {isUnread && (
                        <span className="block w-1.5 h-1.5 rounded-full bg-accent" />
                      )}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Body preview */}
                    <p className={`font-garamond text-base leading-relaxed group-hover:text-accent transition-colors duration-200 ${
                      isFromMe
                        ? 'text-ink-muted italic'
                        : isUnread
                          ? 'text-ink'
                          : 'text-ink-muted'
                    }`}>
                      {preview}
                    </p>

                    {/* Meta */}
                    <p className="font-garamond text-ink-faint text-sm italic mt-1.5">
                      {fromName} · {formatDate(letter.sent_at)}
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
