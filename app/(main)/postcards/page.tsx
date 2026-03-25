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

export default async function PostcardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: postcards } = await supabase
    .from('postcards')
    .select(`
      id, image_url, caption, sent_at, read_at, from_id, to_id,
      from_profile:profiles!from_id(display_name, email)
    `)
    .or(`from_id.eq.${user.id},to_id.eq.${user.id}`)
    .order('sent_at', { ascending: false })

  return (
    <div className="max-w-lg">
      <div className="flex items-baseline justify-between mb-10">
        <h1 className="font-garamond text-2xl text-ink">Postcards</h1>
        <Link
          href="/postcards/send"
          className="font-garamond text-sm italic text-ink-muted hover:text-ink transition-colors duration-200"
        >
          send one →
        </Link>
      </div>

      {(!postcards || postcards.length === 0) && (
        <p className="font-garamond text-ink-muted italic">
          No postcards yet.{' '}
          <Link
            href="/postcards/send"
            className="hover:text-ink transition-colors duration-200 underline underline-offset-4 decoration-border-dark"
          >
            Send the first one.
          </Link>
        </p>
      )}

      <div className="grid grid-cols-2 gap-5">
        {postcards?.map((postcard) => {
          const isFromMe = postcard.from_id === user.id
          const isUnread = !isFromMe && !postcard.read_at
          const fromProfile = Array.isArray(postcard.from_profile)
            ? postcard.from_profile[0]
            : postcard.from_profile
          const fromName = isFromMe
            ? 'you'
            : fromProfile?.display_name || fromProfile?.email?.split('@')[0] || '—'

          return (
            <Link
              key={postcard.id}
              href={`/postcards/${postcard.id}`}
              className="group block"
            >
              {/* Polaroid card */}
              <div className="bg-white p-2.5 pb-8 shadow-sm group-hover:shadow-md transition-shadow duration-200">
                <div className="aspect-square overflow-hidden bg-paper-dark">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={postcard.image_url}
                    alt={postcard.caption || 'postcard'}
                    className="w-full h-full object-cover"
                  />
                </div>
                {postcard.caption && (
                  <p className="font-garamond italic text-ink-muted text-sm text-center mt-3 leading-snug line-clamp-2 px-1">
                    {postcard.caption}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between mt-2 px-0.5">
                <p className="font-garamond text-ink-faint text-xs italic">
                  {formatDate(postcard.sent_at)} · from {fromName}
                </p>
                {isUnread && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
