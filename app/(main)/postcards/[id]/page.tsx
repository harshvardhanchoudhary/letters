import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { markPostcardAsRead } from '@/app/actions/postcards'
import Link from 'next/link'

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function PostcardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: postcard } = await supabase
    .from('postcards')
    .select(`
      id, image_url, caption, sent_at, read_at, from_id, to_id,
      from_profile:profiles!from_id(display_name, email)
    `)
    .eq('id', id)
    .single()

  if (!postcard) notFound()

  const isRecipient = postcard.to_id === user.id
  if (!isRecipient && postcard.from_id !== user.id) notFound()

  // Mark as read
  if (isRecipient && !postcard.read_at) {
    await markPostcardAsRead(id)
  }

  const fromProfile = Array.isArray(postcard.from_profile)
    ? postcard.from_profile[0]
    : postcard.from_profile
  const isFromMe = postcard.from_id === user.id
  const fromName = isFromMe
    ? 'you'
    : fromProfile?.display_name || fromProfile?.email?.split('@')[0] || '—'

  return (
    <div className="max-w-sm">
      <div className="mb-10">
        <Link
          href="/postcards"
          className="font-garamond text-ink-faint hover:text-ink-muted italic text-sm transition-colors duration-200"
        >
          ← postcards
        </Link>
      </div>

      {/* Polaroid */}
      <div className="bg-white p-3 pb-10 shadow-sm">
        <div className="overflow-hidden bg-paper-dark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={postcard.image_url}
            alt={postcard.caption || 'postcard'}
            className="w-full object-contain"
          />
        </div>
        {postcard.caption && (
          <p className="font-garamond italic text-ink-muted text-base text-center mt-5 px-2 leading-relaxed">
            {postcard.caption}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 px-0.5">
        <p className="font-garamond text-ink-faint text-sm italic">
          from {fromName} · {formatDate(postcard.sent_at)}
        </p>
        {!isFromMe && (
          <Link
            href="/postcards/send"
            className="font-garamond text-sm italic text-ink-muted hover:text-ink transition-colors duration-200"
          >
            send one back →
          </Link>
        )}
      </div>
    </div>
  )
}
