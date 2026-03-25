import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TimelineEntry } from '@/types/database'
import Link from 'next/link'
import TimelineClient from './TimelineClient'

function entryDate(e: TimelineEntry): string {
  return e.kind === 'moment' ? e.occurred_at : e.sent_at
}

export default async function TimelinePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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

  const entries = ([
    ...(letters || []).map(l => ({ kind: 'letter' as const, ...l })),
    ...(postcards || []).map(p => ({ kind: 'postcard' as const, ...p })),
    ...(moments || []).map(m => ({ kind: 'moment' as const, ...m })),
  ] as unknown as TimelineEntry[]).sort(
    (a, b) => new Date(entryDate(a)).getTime() - new Date(entryDate(b)).getTime()
  )

  return (
    <div>
      <div className="flex items-baseline justify-between mb-12">
        <h1 className="font-garamond text-2xl text-ink">Timeline</h1>
        <Link
          href="/timeline/add-moment"
          className="font-garamond text-sm italic text-ink-muted hover:text-ink transition-colors duration-200"
        >
          + add moment
        </Link>
      </div>

      <TimelineClient entries={entries} userId={user.id} />
    </div>
  )
}
