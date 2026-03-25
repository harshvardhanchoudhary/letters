import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Profile } from '@/types/database'

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning.'
  if (hour < 17) return 'Good afternoon.'
  return 'Good evening.'
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: partner } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .neq('id', user.id)
    .single<Profile>()

  const partnerName = partner?.display_name || partner?.email?.split('@')[0] || 'her'

  // Unread letters — most recent first
  const { data: unread } = await supabase
    .from('letters')
    .select('id, body, sent_at')
    .eq('to_id', user.id)
    .is('read_at', null)
    .order('sent_at', { ascending: false })

  // Last letter exchanged (for quiet state)
  const { data: lastLetters } = await supabase
    .from('letters')
    .select('id, body, sent_at, from_id')
    .or(`from_id.eq.${user.id},to_id.eq.${user.id}`)
    .order('sent_at', { ascending: false })
    .limit(1)

  const lastLetter = lastLetters?.[0]

  // Unread postcard count
  const { count: unreadPostcards } = await supabase
    .from('postcards')
    .select('*', { count: 'exact', head: true })
    .eq('to_id', user.id)
    .is('read_at', null)

  const hasUnreadLetter = unread && unread.length > 0
  const firstUnread = hasUnreadLetter ? unread[0] : null

  // Body preview — first meaningful paragraph, up to 320 chars
  const bodyPreview = firstUnread
    ? (() => {
        const first = firstUnread.body.split('\n').find((l: string) => l.trim()) || ''
        return first.length > 320 ? first.substring(0, 320) + '…' : first
      })()
    : null

  return (
    <div className="max-w-lg">

      {/* State 1: Unread letter — her words fill the page */}
      {hasUnreadLetter && firstUnread && bodyPreview && (
        <div>
          <p className="font-garamond text-ink-faint text-sm italic mb-8">
            {partnerName} wrote · {formatDate(firstUnread.sent_at)}
            {unread.length > 1 && (
              <span className="ml-2 text-accent">+{unread.length - 1} more</span>
            )}
          </p>

          <Link href={`/letters/${firstUnread.id}`} className="block group">
            <p
              className="font-garamond text-ink group-hover:text-accent transition-colors duration-300"
              style={{ fontSize: '1.25rem', lineHeight: '2', letterSpacing: '0.01em' }}
            >
              {bodyPreview}
            </p>
            <p className="font-garamond text-ink-faint italic text-sm mt-6 group-hover:text-ink-muted transition-colors duration-200">
              continue reading →
            </p>
          </Link>

          <div className="mt-14 pt-6 border-t border-border flex items-center justify-between">
            <Link
              href="/letters/write"
              className="font-garamond italic text-ink-muted hover:text-ink text-sm transition-colors duration-200"
            >
              Write back →
            </Link>
            {(unreadPostcards ?? 0) > 0 && (
              <Link
                href="/postcards"
                className="font-garamond italic text-ink-muted hover:text-ink text-sm transition-colors duration-200"
              >
                {unreadPostcards} postcard{(unreadPostcards ?? 0) > 1 ? 's' : ''} waiting →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* State 2: No unread — quiet, warm */}
      {!hasUnreadLetter && (
        <div>
          <p className="font-garamond text-2xl text-ink mb-10">{getGreeting()}</p>

          {!partner && (
            <p className="font-garamond text-ink-muted italic mb-8">
              No one else is here yet.
            </p>
          )}

          {partner && !lastLetter && (
            <p className="font-garamond text-ink-muted italic mb-8">
              {partnerName} is here. Write the first letter.
            </p>
          )}

          {partner && lastLetter && (
            <div className="mb-10">
              <p className="font-garamond text-ink-faint text-sm italic mb-6">
                No new letters. The last one was {formatDate(lastLetter.sent_at)}.
              </p>

              {/* Quiet preview of last letter */}
              <Link href={`/letters/${lastLetter.id}`} className="block group">
                <p className="font-garamond text-ink-muted italic leading-relaxed group-hover:text-ink transition-colors duration-200"
                  style={{ fontSize: '1.0625rem', lineHeight: '1.9' }}>
                  {(() => {
                    const first = lastLetter.body.split('\n').find((l: string) => l.trim()) || ''
                    return first.length > 180 ? first.substring(0, 180) + '…' : first
                  })()}
                </p>
              </Link>
            </div>
          )}

          <div className="mt-10 flex items-center gap-8">
            <Link
              href="/letters/write"
              className="font-garamond italic text-ink-muted hover:text-ink text-base transition-colors duration-200"
            >
              Write a letter →
            </Link>
            {(unreadPostcards ?? 0) > 0 && (
              <Link
                href="/postcards"
                className="font-garamond italic text-ink-muted hover:text-ink text-sm transition-colors duration-200"
              >
                {unreadPostcards} postcard{(unreadPostcards ?? 0) > 1 ? 's' : ''} waiting →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
