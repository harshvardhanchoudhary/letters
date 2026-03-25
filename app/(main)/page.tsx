import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Letter, Profile } from '@/types/database'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning.'
  if (hour < 17) return 'Good afternoon.'
  return 'Good evening.'
}

function formatShortDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Partner profile
  const { data: partner } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .neq('id', user.id)
    .single<Profile>()

  const partnerName = partner?.display_name || partner?.email?.split('@')[0] || 'someone special'

  // Unread letters sent to me
  const { data: unread } = await supabase
    .from('letters')
    .select('id, subject, body, sent_at')
    .eq('to_id', user.id)
    .is('read_at', null)
    .order('sent_at', { ascending: false })

  // Recent letters (both directions)
  const { data: recent } = await supabase
    .from('letters')
    .select('id, subject, body, sent_at, read_at, from_id, to_id')
    .or(`from_id.eq.${user.id},to_id.eq.${user.id}`)
    .order('sent_at', { ascending: false })
    .limit(4)

  return (
    <div className="max-w-lg">
      <p className="font-garamond text-2xl text-ink mb-10">{getGreeting()}</p>

      {/* Unread notice */}
      {unread && unread.length > 0 && (
        <div className="mb-10 px-5 py-4 border border-border-dark bg-paper-dark rounded-sm">
          <p className="font-garamond text-ink-faint text-xs uppercase tracking-widest mb-2">
            waiting for you
          </p>
          {unread.length === 1 ? (
            <Link
              href={`/letters/${unread[0].id}`}
              className="font-garamond text-base text-ink hover:text-accent transition-colors duration-200"
            >
              There is a letter from {partnerName}. →
            </Link>
          ) : (
            <Link
              href="/letters"
              className="font-garamond text-base text-ink hover:text-accent transition-colors duration-200"
            >
              There are {unread.length} letters from {partnerName}. →
            </Link>
          )}
        </div>
      )}

      {/* Quiet state — no unread */}
      {(!unread || unread.length === 0) && (
        <p className="font-garamond text-ink-muted italic mb-10">
          {!partner
            ? 'No one else is here yet.'
            : !recent || recent.length === 0
            ? `${partnerName} is here. Write the first letter.`
            : 'No new letters.'}
        </p>
      )}

      <div className="mb-14">
        <Link
          href="/letters/write"
          className="font-garamond text-base italic text-ink-muted hover:text-ink transition-colors duration-200"
        >
          Write a letter →
        </Link>
      </div>

      {/* Recent letters */}
      {recent && recent.length > 0 && (
        <div>
          <p className="font-garamond text-ink-faint text-xs uppercase tracking-widest mb-5">
            Recent
          </p>
          <div className="space-y-1">
            {(recent as Letter[]).map(letter => {
              const isFromMe = letter.from_id === user.id
              const isUnread = !isFromMe && !letter.read_at
              const preview =
                letter.subject ||
                letter.body.split('\n')[0].substring(0, 65) +
                  (letter.body.length > 65 ? '…' : '')

              return (
                <Link
                  key={letter.id}
                  href={`/letters/${letter.id}`}
                  className="flex items-baseline justify-between gap-4 py-3 border-b border-border group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isUnread && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                    )}
                    <span
                      className={`font-garamond text-base truncate transition-colors duration-200 group-hover:text-accent ${
                        isUnread ? 'text-ink' : 'text-ink-muted'
                      }`}
                    >
                      {preview}
                    </span>
                  </div>
                  <span className="font-garamond text-ink-faint text-sm italic shrink-0">
                    {formatShortDate(letter.sent_at)}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
