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

export default async function LettersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all letters involving this user, with sender info
  // LEARN: The !from_id hint tells Supabase which foreign key to follow
  // when the same table (profiles) is referenced twice in one query.
  const { data: letters } = await supabase
    .from('letters')
    .select(`
      id, subject, body, sent_at, read_at, from_id, to_id,
      from_profile:profiles!from_id(display_name, email)
    `)
    .or(`from_id.eq.${user.id},to_id.eq.${user.id}`)
    .order('sent_at', { ascending: false })

  return (
    <div className="max-w-lg">
      <div className="flex items-baseline justify-between mb-10">
        <h1 className="font-garamond text-2xl text-ink">All letters</h1>
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
        {letters?.map((letter: any) => {
          const isFromMe = letter.from_id === user.id
          const isUnread = !isFromMe && !letter.read_at
          const fromName = isFromMe
            ? 'you'
            : letter.from_profile?.display_name ||
              letter.from_profile?.email?.split('@')[0] ||
              '—'
          const preview =
            letter.subject ||
            letter.body.split('\n')[0].substring(0, 72) +
              (letter.body.length > 72 ? '…' : '')

          return (
            <Link
              key={letter.id}
              href={`/letters/${letter.id}`}
              className="flex items-start gap-3 py-4 border-b border-border group"
            >
              {/* Unread dot column */}
              <div className="w-2 shrink-0 pt-1.5">
                {isUnread && (
                  <span className="block w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-4">
                  <span
                    className={`font-garamond text-base truncate transition-colors duration-200 group-hover:text-accent ${
                      isUnread ? 'text-ink' : 'text-ink-muted'
                    }`}
                  >
                    {preview}
                  </span>
                  <span className="font-garamond text-ink-faint text-sm italic shrink-0">
                    {formatDate(letter.sent_at)}
                  </span>
                </div>
                <p className="font-garamond text-ink-faint text-sm italic mt-0.5">
                  from {fromName}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
