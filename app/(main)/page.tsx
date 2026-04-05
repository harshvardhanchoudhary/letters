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
  if (diffDays <= 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function firstLine(body: string, max: number) {
  const first = body.split('\n').find((line) => line.trim()) || ''
  return first.length > max ? `${first.substring(0, max)}…` : first
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: myProfile },
    { data: partner },
    { data: unread },
    { data: partnerCurrently },
    { count: unreadCount },
  ] = await Promise.all([
    supabase.from('profiles').select('id, display_name, email').eq('id', user.id).single(),
    supabase.from('profiles').select('id, display_name, email').neq('id', user.id).single<Profile>(),
    supabase.from('letters').select('id, body, sent_at').eq('to_id', user.id).is('read_at', null).order('sent_at', { ascending: false }).limit(1),
    supabase.from('currently').select('label, value').neq('user_id', user.id).order('updated_at', { ascending: false }),
    supabase.from('letters').select('*', { count: 'exact', head: true }).eq('to_id', user.id).is('read_at', null),
  ])

  const myName = resolveDisplayName(myProfile?.email, myProfile?.display_name)
  const partnerName = resolveDisplayName(partner?.email, partner?.display_name)

  const unreadLetter = unread?.[0]
  const moodItems = ((partnerCurrently as Currently[] | null) || []).filter((item) =>
    ['mood', 'phase', 'energy', 'social battery', 'need from partner', 'note'].includes(item.label)
  )

  const moodMap = new Map(moodItems.map((item) => [item.label, item.value]))

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-border px-4 py-5">
        <p className="font-garamond text-xs italic text-ink-faint">Unread letter spotlight</p>

        {unreadLetter ? (
          <>
            <p className="mt-2 font-garamond text-sm italic text-ink-faint">
              from {partnerName} · {timeAgo(unreadLetter.sent_at)}
              {(unreadCount ?? 0) > 1 ? ` · ${(unreadCount ?? 0) - 1} more waiting` : ''}
            </p>

            <Link href={`/letters/${unreadLetter.id}`} className="mt-3 block">
              <p className="font-garamond text-lg leading-8 text-ink">{firstLine(unreadLetter.body, 220)}</p>
              <p className="mt-3 font-garamond text-sm italic text-ink-muted">Open letter →</p>
            </Link>
          </>
        ) : (
          <>
            <p className="mt-2 font-garamond text-ink-muted italic">No unread letters right now.</p>
            <Link href="/letters/write" className="mt-3 inline-block font-garamond text-sm italic text-ink-muted hover:text-ink">
              Write one now →
            </Link>
          </>
        )}
      </section>

      <section className="rounded-lg border border-border px-4 py-5">
        <p className="font-garamond text-xs italic text-ink-faint">Latest mood + phase</p>

        {partner ? (
          <>
            <p className="mt-2 font-garamond text-sm italic text-ink-faint">{partnerName} shared</p>

            {(moodMap.get('mood') || moodMap.get('phase')) ? (
              <div className="mt-3 space-y-2">
                {moodMap.get('mood') && (
                  <p className="font-garamond text-ink">
                    <span className="text-ink-faint italic">mood </span>{moodMap.get('mood')}
                  </p>
                )}
                {moodMap.get('phase') && (
                  <p className="font-garamond text-ink">
                    <span className="text-ink-faint italic">phase </span>{moodMap.get('phase')}
                  </p>
                )}
                {moodMap.get('need from partner') && (
                  <p className="font-garamond text-ink-muted">
                    <span className="text-ink-faint italic">need </span>{moodMap.get('need from partner')}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-3 font-garamond italic text-ink-muted">No mood check-in yet.</p>
            )}

            <Link href="/mood" className="mt-4 inline-block font-garamond text-sm italic text-ink-muted hover:text-ink">
              Open mood space →
            </Link>
          </>
        ) : (
          <p className="mt-2 font-garamond italic text-ink-muted">Waiting for both people to join.</p>
        )}
      </section>

      <section className="rounded-lg border border-border px-4 py-5">
        <p className="font-garamond text-xs italic text-ink-faint">Quick routes</p>
        <div className="mt-3 flex flex-wrap gap-4">
          <Link href="/letters/write" className="font-garamond italic text-ink-muted hover:text-ink">Write letter</Link>
          <Link href="/timeline" className="font-garamond italic text-ink-muted hover:text-ink">Open timeline</Link>
          <Link href="/library" className="font-garamond italic text-ink-muted hover:text-ink">Open library</Link>
        </div>
      </section>

      <p className="px-1 font-garamond text-xs italic text-ink-faint">{myName}, this home now prioritizes unread letters and mood visibility first.</p>
    </div>
  )
}
