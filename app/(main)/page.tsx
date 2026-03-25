import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Profile, Currently } from '@/types/database'

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

  const [
    { data: myProfile },
    { data: partner },
    { data: unread },
    { data: lastLetters },
    { count: totalLetters },
    { data: mineCurrently },
    { data: theirsCurrently },
    { count: unreadPostcards },
    { data: firstLetter },
  ] = await Promise.all([
    supabase.from('profiles').select('id, display_name, email').eq('id', user.id).single(),
    supabase.from('profiles').select('id, display_name, email').neq('id', user.id).single<Profile>(),
    supabase.from('letters').select('id, body, sent_at').eq('to_id', user.id).is('read_at', null).order('sent_at', { ascending: false }),
    supabase.from('letters').select('id, body, sent_at, from_id').or(`from_id.eq.${user.id},to_id.eq.${user.id}`).order('sent_at', { ascending: false }).limit(1),
    supabase.from('letters').select('*', { count: 'exact', head: true }).or(`from_id.eq.${user.id},to_id.eq.${user.id}`),
    supabase.from('currently').select('label, value').eq('user_id', user.id),
    supabase.from('currently').select('label, value').neq('user_id', user.id),
    supabase.from('postcards').select('*', { count: 'exact', head: true }).eq('to_id', user.id).is('read_at', null),
    supabase.from('letters').select('sent_at').or(`from_id.eq.${user.id},to_id.eq.${user.id}`).order('sent_at', { ascending: true }).limit(1),
  ])

  const partnerName = partner?.display_name || partner?.email?.split('@')[0] || 'her'
  const myName = myProfile?.display_name || myProfile?.email?.split('@')[0] || 'you'
  const hasUnread = unread && unread.length > 0
  const firstUnread = hasUnread ? unread![0] : null
  const lastLetter = lastLetters?.[0]

  const bodyPreview = firstUnread
    ? (() => {
        const first = firstUnread.body.split('\n').find((l: string) => l.trim()) || ''
        return first.length > 320 ? first.substring(0, 320) + '…' : first
      })()
    : null

  const sinceDate = firstLetter?.[0]?.sent_at
    ? new Date(firstLetter[0].sent_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="max-w-2xl">

      {/* Currently — always shown */}
      {(partner) && (
        <div className="mb-14">
          <div className="grid grid-cols-2 gap-10">
            {/* Mine */}
            <div>
              <div className="flex items-baseline justify-between mb-4">
                <p className="font-garamond text-ink-faint text-xs italic tracking-wide">{myName}</p>
                <Link
                  href="/currently"
                  className="font-garamond text-ink-faint hover:text-ink-muted text-xs italic transition-colors duration-200"
                >
                  update →
                </Link>
              </div>
              {(mineCurrently as Currently[] || []).length === 0 ? (
                <p className="font-garamond text-ink-faint italic text-sm">
                  <Link href="/currently" className="hover:text-ink-muted transition-colors duration-200">
                    What are you into right now?
                  </Link>
                </p>
              ) : (
                <div className="space-y-2.5">
                  {(mineCurrently as Currently[]).map(item => (
                    <div key={item.label}>
                      <span className="font-garamond text-ink-faint text-xs italic">{item.label} </span>
                      <span className="font-garamond text-ink text-sm">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Theirs */}
            <div>
              <p className="font-garamond text-ink-faint text-xs italic tracking-wide mb-4">{partnerName}</p>
              {(theirsCurrently as Currently[] || []).length === 0 ? (
                <p className="font-garamond text-ink-faint italic text-sm">nothing yet</p>
              ) : (
                <div className="space-y-2.5">
                  {(theirsCurrently as Currently[]).map(item => (
                    <div key={item.label}>
                      <span className="font-garamond text-ink-faint text-xs italic">{item.label} </span>
                      <span className="font-garamond text-ink text-sm">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Divider with stats */}
      {(totalLetters ?? 0) > 0 && (
        <div className="flex items-center gap-4 mb-14">
          <div className="flex-1 h-px bg-border" />
          <p className="font-garamond text-ink-faint text-xs italic shrink-0">
            {totalLetters} letter{(totalLetters ?? 0) !== 1 ? 's' : ''}
            {sinceDate ? ` · since ${sinceDate}` : ''}
          </p>
          <div className="flex-1 h-px bg-border" />
        </div>
      )}

      {/* Unread letter — her words fill the page */}
      {hasUnread && firstUnread && bodyPreview && (
        <div>
          <p className="font-garamond text-ink-faint text-sm italic mb-8">
            {partnerName} wrote · {formatDate(firstUnread.sent_at)}
            {unread!.length > 1 && (
              <span className="ml-3 text-accent">+{unread!.length - 1} more</span>
            )}
          </p>

          <Link href={`/letters/${firstUnread.id}`} className="block group">
            <p
              className="font-garamond text-ink group-hover:text-accent transition-colors duration-300"
              style={{ fontSize: '1.25rem', lineHeight: '2.1', letterSpacing: '0.01em' }}
            >
              {bodyPreview}
            </p>
            <p className="font-garamond text-ink-faint italic text-sm mt-6 group-hover:text-ink-muted transition-colors duration-200">
              continue reading →
            </p>
          </Link>

          <div className="mt-14 pt-6 border-t border-border flex items-center gap-8">
            <Link href="/letters/write" className="font-garamond italic text-ink-muted hover:text-ink text-sm transition-colors duration-200">
              Write back →
            </Link>
            {(unreadPostcards ?? 0) > 0 && (
              <Link href="/postcards" className="font-garamond italic text-ink-muted hover:text-ink text-sm transition-colors duration-200">
                {unreadPostcards} postcard{(unreadPostcards ?? 0) > 1 ? 's' : ''} waiting →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* No unread — quiet state */}
      {!hasUnread && (
        <div>
          <p className="font-garamond text-2xl text-ink mb-8">{getGreeting()}</p>

          {partner && lastLetter && (
            <div className="mb-10">
              <p className="font-garamond text-ink-faint text-sm italic mb-6">
                Last letter · {formatDate(lastLetter.sent_at)}
              </p>
              <Link href={`/letters/${lastLetter.id}`} className="block group">
                <p
                  className="font-garamond text-ink-muted italic group-hover:text-ink transition-colors duration-200 leading-relaxed"
                  style={{ fontSize: '1.0625rem', lineHeight: '1.9' }}
                >
                  {(() => {
                    const first = lastLetter.body.split('\n').find((l: string) => l.trim()) || ''
                    return first.length > 200 ? first.substring(0, 200) + '…' : first
                  })()}
                </p>
              </Link>
            </div>
          )}

          {partner && !lastLetter && (
            <p className="font-garamond text-ink-muted italic mb-8">
              {partnerName} is here. Write the first letter.
            </p>
          )}

          <div className="flex items-center gap-8 mt-10">
            <Link href="/letters/write" className="font-garamond italic text-ink-muted hover:text-ink text-base transition-colors duration-200">
              Write a letter →
            </Link>
            {(unreadPostcards ?? 0) > 0 && (
              <Link href="/postcards" className="font-garamond italic text-accent hover:text-ink text-sm transition-colors duration-200">
                {unreadPostcards} postcard{(unreadPostcards ?? 0) > 1 ? 's' : ''} waiting →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
