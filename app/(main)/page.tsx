import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Profile, Currently } from '@/types/database'

function resolveDisplayName(email: string | undefined | null, displayName: string | null | undefined): string {
  if (displayName) return displayName
  if (email?.toLowerCase() === process.env.ALLOWED_EMAIL_1?.toLowerCase()) return process.env.DISPLAY_NAME_1 || email?.split('@')[0] || '—'
  if (email?.toLowerCase() === process.env.ALLOWED_EMAIL_2?.toLowerCase()) return process.env.DISPLAY_NAME_2 || email?.split('@')[0] || '—'
  return email?.split('@')[0] || '—'
}

function timeAgo(dateString: string) {
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
  if (hour < 5) return 'Still up?'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
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
    { data: partnerCurrently },
    { count: unreadPostcards },
  ] = await Promise.all([
    supabase.from('profiles').select('id, display_name, email').eq('id', user.id).single(),
    supabase.from('profiles').select('id, display_name, email').neq('id', user.id).single<Profile>(),
    supabase.from('letters').select('id, body, sent_at').eq('to_id', user.id).is('read_at', null).order('sent_at', { ascending: false }),
    supabase.from('letters').select('id, body, sent_at, from_id').or(`from_id.eq.${user.id},to_id.eq.${user.id}`).order('sent_at', { ascending: false }).limit(1),
    supabase.from('letters').select('*', { count: 'exact', head: true }).or(`from_id.eq.${user.id},to_id.eq.${user.id}`),
    supabase.from('currently').select('label, value').neq('user_id', user.id).order('updated_at', { ascending: true }),
    supabase.from('postcards').select('*', { count: 'exact', head: true }).eq('to_id', user.id).is('read_at', null),
  ])

  const myName = resolveDisplayName(myProfile?.email, myProfile?.display_name)
  const partnerName = resolveDisplayName(partner?.email, partner?.display_name)
  const hasUnread = unread && unread.length > 0
  const firstUnread = hasUnread ? unread![0] : null
  const lastLetter = lastLetters?.[0]
  const theirCurrently = (partnerCurrently as Currently[] | null) || []

  const unreadBodyPreview = firstUnread
    ? (() => {
        const first = firstUnread.body.split('\n').find((l: string) => l.trim()) || ''
        return first.length > 360 ? first.substring(0, 360) + '…' : first
      })()
    : null

  return (
    <div className="max-w-lg">

      {/* ── Unread letter — her words fill the page ── */}
      {hasUnread && firstUnread && unreadBodyPreview && (
        <div>
          <p className="font-garamond text-ink-faint text-sm italic mb-10">
            {partnerName} wrote · {timeAgo(firstUnread.sent_at)}
            {unread!.length > 1 && (
              <span className="ml-3 text-accent">and {unread!.length - 1} more</span>
            )}
          </p>

          <Link href={`/letters/${firstUnread.id}`} className="block group">
            <p
              className="font-garamond text-ink group-hover:text-accent transition-colors duration-300"
              style={{ fontSize: '1.25rem', lineHeight: '2.1' }}
            >
              {unreadBodyPreview}
            </p>
            <p className="font-garamond text-ink-faint italic text-sm mt-8 group-hover:text-ink-muted transition-colors duration-200">
              continue reading →
            </p>
          </Link>

          <div className="mt-16 pt-6 border-t border-border flex items-center gap-8">
            <Link href="/letters/write" className="font-garamond italic text-ink-muted hover:text-ink text-sm transition-colors duration-200">
              Write back →
            </Link>
            {(unreadPostcards ?? 0) > 0 && (
              <Link href="/postcards" className="font-garamond italic text-accent hover:text-ink text-sm transition-colors duration-200">
                {unreadPostcards} postcard{(unreadPostcards ?? 0) > 1 ? 's' : ''} →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── No unread — quiet home ── */}
      {!hasUnread && (
        <div>
          <p className="font-garamond text-2xl text-ink mb-12">
            {getGreeting()}{myName ? `, ${myName}.` : '.'}
          </p>

          {/* Partner's currently — only shown if they've set something */}
          {theirCurrently.length > 0 && (
            <div className="mb-12">
              <p className="font-garamond text-ink-faint text-xs italic mb-4">
                {partnerName} is —
              </p>
              <div className="space-y-2">
                {theirCurrently.map(item => (
                  <p key={item.label} className="font-garamond text-ink">
                    <span className="text-ink-faint italic">{item.label} </span>
                    {item.value}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Letter count */}
          {(totalLetters ?? 0) > 0 && (
            <p className="font-garamond text-ink-faint text-sm italic mb-10">
              {totalLetters} letters between you.
            </p>
          )}

          {/* Last letter preview */}
          {lastLetter && (
            <div className="mb-12">
              <p className="font-garamond text-ink-faint text-xs italic mb-3">
                Last letter · {timeAgo(lastLetter.sent_at)}
              </p>
              <Link href={`/letters/${lastLetter.id}`} className="block group">
                <p
                  className="font-garamond text-ink-muted italic group-hover:text-ink transition-colors duration-200 leading-relaxed"
                  style={{ fontSize: '1.0625rem', lineHeight: '1.9' }}
                >
                  {(() => {
                    const first = lastLetter.body.split('\n').find((l: string) => l.trim()) || ''
                    return first.length > 180 ? first.substring(0, 180) + '…' : first
                  })()}
                </p>
              </Link>
            </div>
          )}

          {!partner && (
            <p className="font-garamond text-ink-muted italic mb-10">
              No one else is here yet.
            </p>
          )}

          {partner && !lastLetter && (
            <p className="font-garamond text-ink-muted italic mb-10">
              {partnerName} is here. Write the first letter.
            </p>
          )}

          <div className="flex items-center gap-8">
            <Link href="/letters/write" className="font-garamond italic text-ink-muted hover:text-ink text-base transition-colors duration-200">
              Write a letter →
            </Link>
            {(unreadPostcards ?? 0) > 0 && (
              <Link href="/postcards" className="font-garamond italic text-accent hover:text-ink text-sm transition-colors duration-200">
                {unreadPostcards} postcard{(unreadPostcards ?? 0) > 1 ? 's' : ''} →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
