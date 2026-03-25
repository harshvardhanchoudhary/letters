import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TimelineEntry } from '@/types/database'
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

function entryDate(e: TimelineEntry): string {
  return e.kind === 'moment' ? e.occurred_at : e.sent_at
}

export default async function TimelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all three types in parallel
  const [{ data: letters }, { data: postcards }, { data: moments }] =
    await Promise.all([
      supabase
        .from('letters')
        .select('id, subject, body, sent_at, read_at, created_at, from_id, to_id, from_profile:profiles!from_id(display_name, email)')
        .or(`from_id.eq.${user.id},to_id.eq.${user.id}`),
      supabase
        .from('postcards')
        .select('id, image_url, caption, sent_at, read_at, created_at, from_id, to_id, from_profile:profiles!from_id(display_name, email)')
        .or(`from_id.eq.${user.id},to_id.eq.${user.id}`),
      supabase
        .from('moments')
        .select('id, title, note, occurred_at, created_at, created_by, creator_profile:profiles!created_by(display_name, email)'),
    ])

  // Combine into a single timeline
  const entries = ([
    ...(letters || []).map(l => ({ kind: 'letter' as const, ...l })),
    ...(postcards || []).map(p => ({ kind: 'postcard' as const, ...p })),
    ...(moments || []).map(m => ({ kind: 'moment' as const, ...m })),
  ] as unknown as TimelineEntry[]).sort((a, b) => new Date(entryDate(a)).getTime() - new Date(entryDate(b)).getTime())

  const isEmpty = entries.length === 0

  return (
    <div className="max-w-lg">
      <div className="flex items-baseline justify-between mb-10">
        <h1 className="font-garamond text-2xl text-ink">Timeline</h1>
        <Link
          href="/timeline/add-moment"
          className="font-garamond text-sm italic text-ink-muted hover:text-ink transition-colors duration-200"
        >
          + add moment
        </Link>
      </div>

      {isEmpty && (
        <p className="font-garamond text-ink-muted italic">
          Nothing here yet. Your letters and postcards will appear here, along with any{' '}
          <Link
            href="/timeline/add-moment"
            className="hover:text-ink transition-colors duration-200 underline underline-offset-4 decoration-border-dark"
          >
            moments you add.
          </Link>
        </p>
      )}

      <div className="relative">
        {/* Vertical line */}
        {!isEmpty && (
          <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
        )}

        <div className="space-y-0">
          {entries.map((entry, i) => {
            const date = entry.kind === 'moment' ? entry.occurred_at : entry.sent_at
            const year = getYear(date)
            const prevDate = i > 0 ? entryDate(entries[i - 1]) : null
            const prevYear = prevDate ? getYear(prevDate) : null
            const showYear = year !== prevYear

            return (
              <div key={`${entry.kind}-${entry.id}`}>
                {showYear && (
                  <div className="flex items-center gap-4 py-6 pl-6">
                    <span className="font-garamond text-ink-faint text-sm italic">
                      {year}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}

                <div className="flex gap-6 pb-8">
                  {/* Dot on the line */}
                  <div className="relative shrink-0">
                    <div className={`w-2 h-2 rounded-full mt-1.5 -ml-[3px] border ${
                      entry.kind === 'moment'
                        ? 'bg-accent border-accent'
                        : 'bg-paper border-border-dark'
                    }`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 -mt-0.5">
                    {entry.kind === 'letter' && (
                      <LetterEntry entry={entry} userId={user.id} />
                    )}
                    {entry.kind === 'postcard' && (
                      <PostcardEntry entry={entry} userId={user.id} />
                    )}
                    {entry.kind === 'moment' && (
                      <MomentEntry entry={entry} />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function LetterEntry({ entry, userId }: { entry: TimelineEntry & { kind: 'letter' }, userId: string }) {
  const fromProfile = Array.isArray(entry.from_profile) ? entry.from_profile[0] : entry.from_profile
  const isFromMe = entry.from_id === userId
  const fromName = isFromMe ? 'you' : fromProfile?.display_name || fromProfile?.email?.split('@')[0] || '—'
  const preview = entry.subject || entry.body.split('\n')[0].substring(0, 80) + (entry.body.length > 80 ? '…' : '')

  return (
    <Link href={`/letters/${entry.id}`} className="block group">
      <div className="bg-paper-dark border border-border p-4 group-hover:border-border-dark transition-colors duration-200">
        <p className="font-garamond text-ink text-base leading-relaxed">
          {preview}
        </p>
        <p className="font-garamond text-ink-faint text-xs italic mt-2">
          {formatDate(entry.sent_at)} · letter from {fromName}
        </p>
      </div>
    </Link>
  )
}

function PostcardEntry({ entry, userId }: { entry: TimelineEntry & { kind: 'postcard' }, userId: string }) {
  const fromProfile = Array.isArray(entry.from_profile) ? entry.from_profile[0] : entry.from_profile
  const isFromMe = entry.from_id === userId
  const fromName = isFromMe ? 'you' : fromProfile?.display_name || fromProfile?.email?.split('@')[0] || '—'

  return (
    <Link href={`/postcards/${entry.id}`} className="block group">
      <div className="bg-white p-2 pb-6 shadow-sm group-hover:shadow-md transition-shadow duration-200 max-w-[200px]">
        <div className="aspect-square overflow-hidden bg-paper-dark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={entry.image_url}
            alt={entry.caption || 'postcard'}
            className="w-full h-full object-cover"
          />
        </div>
        {entry.caption && (
          <p className="font-garamond italic text-ink-muted text-xs text-center mt-2 px-1 leading-snug line-clamp-1">
            {entry.caption}
          </p>
        )}
      </div>
      <p className="font-garamond text-ink-faint text-xs italic mt-2">
        {formatDate(entry.sent_at)} · postcard from {fromName}
      </p>
    </Link>
  )
}

function MomentEntry({ entry }: { entry: TimelineEntry & { kind: 'moment' } }) {
  return (
    <div>
      <p className="font-garamond text-ink text-base">{entry.title}</p>
      {entry.note && (
        <p className="font-garamond text-ink-muted text-sm italic mt-1 leading-relaxed">
          {entry.note}
        </p>
      )}
      <p className="font-garamond text-ink-faint text-xs italic mt-1.5">
        {formatDate(entry.occurred_at)}
      </p>
    </div>
  )
}
