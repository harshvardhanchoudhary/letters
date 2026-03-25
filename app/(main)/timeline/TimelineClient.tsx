'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { TimelineEntry } from '@/types/database'
import Link from 'next/link'

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatShortDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function entryDate(e: TimelineEntry): string {
  return e.kind === 'moment' ? e.occurred_at : e.sent_at
}

function getYear(dateString: string) {
  return new Date(dateString).getFullYear()
}

interface Props {
  entries: TimelineEntry[]
  userId: string
}

export default function TimelineClient({ entries, userId }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const dotRefs = useRef<(HTMLButtonElement | null)[]>([])

  const closeModal = useCallback(() => setModalOpen(false), [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeModal])

  // Scroll selected dot into view
  useEffect(() => {
    if (selected === null) return
    const dot = dotRefs.current[selected]
    const track = trackRef.current
    if (!dot || !track) return
    track.scrollTo({ left: dot.offsetLeft - track.offsetWidth / 2 + dot.offsetWidth / 2, behavior: 'smooth' })
  }, [selected])

  if (entries.length === 0) {
    return (
      <p className="font-garamond text-ink-muted italic">
        Nothing here yet. Your letters and postcards will appear as you exchange them.{' '}
        <Link href="/timeline/add-moment" className="underline underline-offset-4 decoration-border-dark hover:text-ink transition-colors">
          Add a moment.
        </Link>
      </p>
    )
  }

  const selectedEntry = selected !== null ? entries[selected] : null
  const DOT_SPACING = 52

  function handleDotClick(i: number) {
    setSelected(i)
    setModalOpen(true)
  }

  return (
    <>
      {/* Track */}
      <div
        ref={trackRef}
        className="overflow-x-auto -mx-10 px-10"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="relative" style={{ width: `${entries.length * DOT_SPACING + 80}px`, height: '88px' }}>

          {/* Line */}
          <div className="absolute left-0 right-0 h-px bg-border" style={{ top: '44px' }} />

          {/* Year labels */}
          {entries.map((entry, i) => {
            const year = getYear(entryDate(entry))
            const prevYear = i > 0 ? getYear(entryDate(entries[i - 1])) : null
            if (year === prevYear) return null
            return (
              <span
                key={`year-${i}`}
                className="absolute font-garamond text-xs text-ink-faint italic select-none"
                style={{ left: `${i * DOT_SPACING + 40}px`, top: '6px', transform: 'translateX(-50%)' }}
              >
                {year}
              </span>
            )
          })}

          {/* Dots */}
          {entries.map((entry, i) => {
            const isSelected = selected === i && modalOpen
            const isMoment = entry.kind === 'moment'
            const isPostcard = entry.kind === 'postcard'

            return (
              <button
                key={`${entry.kind}-${entry.id}`}
                ref={el => { dotRefs.current[i] = el }}
                onClick={() => handleDotClick(i)}
                className="absolute group cursor-pointer"
                style={{ left: `${i * DOT_SPACING + 40}px`, top: '36px', transform: 'translateX(-50%)' }}
                title={`${formatShortDate(entryDate(entry))} — ${entry.kind}`}
              >
                <div className={`
                  transition-all duration-200
                  ${isMoment
                    ? `w-3.5 h-3.5 rotate-45 border-2 ${isSelected ? 'bg-accent border-accent scale-125' : 'bg-paper border-accent/60 group-hover:border-accent group-hover:scale-110'}`
                    : isPostcard
                      ? `w-3 h-3 rounded-sm ${isSelected ? 'bg-accent scale-125' : 'bg-border-dark group-hover:bg-ink-faint group-hover:scale-110'}`
                      : `w-2.5 h-2.5 rounded-full border-2 ${isSelected ? 'bg-accent border-accent scale-125' : 'bg-paper border-border-dark group-hover:border-ink-muted group-hover:scale-110'}`
                  }
                `} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 pt-5 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full border-2 border-border-dark bg-paper flex-shrink-0" />
          <span className="font-garamond text-ink-faint text-xs italic">letter</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-border-dark flex-shrink-0" />
          <span className="font-garamond text-ink-faint text-xs italic">postcard</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rotate-45 border-2 border-accent/60 bg-paper flex-shrink-0" />
          <span className="font-garamond text-ink-faint text-xs italic">moment</span>
        </div>
        <span className="font-garamond text-ink-faint text-xs italic ml-auto">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'} · click any dot
        </span>
      </div>

      {/* Modal */}
      {modalOpen && selectedEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          onClick={closeModal}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-ink/30" />

          {/* Card */}
          <div
            className="relative bg-paper max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-xl"
            style={{ padding: '2.5rem' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={closeModal}
              className="absolute top-5 right-5 font-garamond text-ink-faint hover:text-ink text-sm italic transition-colors duration-200"
            >
              close
            </button>

            {selectedEntry.kind === 'letter' && (
              <LetterModal entry={selectedEntry} userId={userId} onClose={closeModal} />
            )}
            {selectedEntry.kind === 'postcard' && (
              <PostcardModal entry={selectedEntry} userId={userId} />
            )}
            {selectedEntry.kind === 'moment' && (
              <MomentModal entry={selectedEntry} />
            )}
          </div>
        </div>
      )}
    </>
  )
}

function LetterModal({ entry, userId, onClose }: { entry: TimelineEntry & { kind: 'letter' }, userId: string, onClose: () => void }) {
  const fromProfile = Array.isArray(entry.from_profile) ? entry.from_profile[0] : entry.from_profile
  const isFromMe = entry.from_id === userId
  const fromName = isFromMe ? 'you' : fromProfile?.display_name || fromProfile?.email?.split('@')[0] || '—'

  return (
    <div>
      <p className="font-garamond text-ink-faint text-sm italic mb-6">
        {formatDate(entry.sent_at)} · {isFromMe ? 'you wrote' : `from ${fromName}`}
      </p>
      <div
        className="font-garamond text-ink leading-relaxed mb-8 letter-body"
      >
        {entry.body}
      </div>
      <Link
        href={`/letters/${entry.id}`}
        onClick={onClose}
        className="font-garamond text-sm italic text-ink-muted hover:text-ink transition-colors duration-200"
      >
        Open full letter →
      </Link>
    </div>
  )
}

function PostcardModal({ entry, userId }: { entry: TimelineEntry & { kind: 'postcard' }, userId: string }) {
  const fromProfile = Array.isArray(entry.from_profile) ? entry.from_profile[0] : entry.from_profile
  const isFromMe = entry.from_id === userId
  const fromName = isFromMe ? 'you' : fromProfile?.display_name || fromProfile?.email?.split('@')[0] || '—'

  return (
    <div>
      <p className="font-garamond text-ink-faint text-sm italic mb-5">
        {formatDate(entry.sent_at)} · {isFromMe ? 'you sent' : `from ${fromName}`}
      </p>
      <div className="bg-white p-2 pb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={entry.image_url} alt={entry.caption || 'postcard'} className="w-full object-cover" />
        {entry.caption && (
          <p className="font-garamond italic text-ink-muted text-sm text-center mt-4 px-2">{entry.caption}</p>
        )}
      </div>
    </div>
  )
}

function MomentModal({ entry }: { entry: TimelineEntry & { kind: 'moment' } }) {
  return (
    <div>
      <p className="font-garamond text-ink-faint text-sm italic mb-4">{formatDate(entry.occurred_at)}</p>
      <p className="font-garamond text-2xl text-ink mb-4">{entry.title}</p>
      {entry.note && (
        <p className="font-garamond text-ink-muted italic leading-relaxed" style={{ fontSize: '1.0625rem', lineHeight: '1.9' }}>
          {entry.note}
        </p>
      )}
    </div>
  )
}
