'use client'

import { useState, useRef, useEffect } from 'react'
import { TimelineEntry } from '@/types/database'
import Link from 'next/link'

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatShortDate(dateString: string) {
  const d = new Date(dateString)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
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
  const trackRef = useRef<HTMLDivElement>(null)
  const dotRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    if (selected === null) return
    const dot = dotRefs.current[selected]
    const track = trackRef.current
    if (!dot || !track) return
    const scrollTarget = dot.offsetLeft - track.offsetWidth / 2 + dot.offsetWidth / 2
    track.scrollTo({ left: scrollTarget, behavior: 'smooth' })
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

  return (
    <div>
      {/* Track */}
      <div
        ref={trackRef}
        className="overflow-x-auto -mx-10 px-10"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div
          className="relative"
          style={{ width: `${entries.length * DOT_SPACING + 80}px`, height: '96px' }}
        >
          {/* Horizontal line */}
          <div
            className="absolute left-0 right-0 h-px bg-border"
            style={{ top: '40px' }}
          />

          {/* Year labels */}
          {entries.map((entry, i) => {
            const year = getYear(entryDate(entry))
            const prevYear = i > 0 ? getYear(entryDate(entries[i - 1])) : null
            if (year === prevYear) return null
            return (
              <span
                key={`year-${i}`}
                className="absolute font-garamond text-xs text-ink-faint italic select-none"
                style={{
                  left: `${i * DOT_SPACING + 40}px`,
                  top: '4px',
                  transform: 'translateX(-50%)',
                }}
              >
                {year}
              </span>
            )
          })}

          {/* Dots */}
          {entries.map((entry, i) => {
            const isSelected = selected === i
            const isMoment = entry.kind === 'moment'
            const isPostcard = entry.kind === 'postcard'

            return (
              <button
                key={`${entry.kind}-${entry.id}`}
                ref={el => { dotRefs.current[i] = el }}
                onClick={() => setSelected(isSelected ? null : i)}
                className="absolute flex flex-col items-center gap-2 group cursor-pointer"
                style={{
                  left: `${i * DOT_SPACING + 40}px`,
                  top: '32px',
                  transform: 'translateX(-50%)',
                }}
                title={`${formatShortDate(entryDate(entry))} — ${entry.kind}`}
              >
                {/* Dot */}
                <div
                  className={`
                    transition-all duration-200 flex-shrink-0
                    ${isMoment
                      ? `w-3.5 h-3.5 rotate-45 border-2 ${isSelected ? 'bg-accent border-accent' : 'bg-paper border-accent/60 group-hover:border-accent'}`
                      : isPostcard
                        ? `w-3 h-3 rounded-sm ${isSelected ? 'bg-accent' : 'bg-border-dark group-hover:bg-ink-faint'}`
                        : `w-2.5 h-2.5 rounded-full border-2 ${isSelected ? 'bg-accent border-accent' : 'bg-paper border-border-dark group-hover:border-ink-muted'}`
                    }
                    ${isSelected ? 'scale-125' : 'group-hover:scale-110'}
                  `}
                />

                {/* Connector tick down when selected */}
                {isSelected && (
                  <div className="w-px bg-border-dark" style={{ height: '20px' }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected date label */}
      {selected !== null && (
        <p className="font-garamond text-xs text-accent italic mt-1 mb-6">
          {formatDate(entryDate(entries[selected]))}
        </p>
      )}

      {/* Expanded card */}
      {selectedEntry && (
        <div className="border-t border-border pt-8 pb-4">
          {selectedEntry.kind === 'letter' && (
            <LetterCard entry={selectedEntry} userId={userId} />
          )}
          {selectedEntry.kind === 'postcard' && (
            <PostcardCard entry={selectedEntry} userId={userId} />
          )}
          {selectedEntry.kind === 'moment' && (
            <MomentCard entry={selectedEntry} />
          )}
        </div>
      )}

      {/* Legend */}
      <div className={`flex items-center gap-6 ${selectedEntry ? 'mt-8' : 'mt-4'} pt-5 border-t border-border`}>
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
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>
    </div>
  )
}

function LetterCard({ entry, userId }: { entry: TimelineEntry & { kind: 'letter' }, userId: string }) {
  const fromProfile = Array.isArray(entry.from_profile) ? entry.from_profile[0] : entry.from_profile
  const isFromMe = entry.from_id === userId
  const fromName = isFromMe ? 'you' : fromProfile?.display_name || fromProfile?.email?.split('@')[0] || '—'
  const firstLine = entry.body.split('\n').find((l: string) => l.trim()) || ''
  const preview = firstLine.length > 260 ? firstLine.substring(0, 260) + '…' : firstLine

  return (
    <div className="max-w-lg">
      <p className="font-garamond text-ink-faint text-sm italic mb-5">
        {isFromMe ? 'you wrote' : `${fromName} wrote`}
      </p>
      <p className="font-garamond text-ink leading-relaxed mb-6" style={{ fontSize: '1.0625rem', lineHeight: '1.9' }}>
        {preview}
      </p>
      <Link
        href={`/letters/${entry.id}`}
        className="font-garamond text-sm italic text-ink-muted hover:text-ink transition-colors duration-200"
      >
        Read full letter →
      </Link>
    </div>
  )
}

function PostcardCard({ entry, userId }: { entry: TimelineEntry & { kind: 'postcard' }, userId: string }) {
  const fromProfile = Array.isArray(entry.from_profile) ? entry.from_profile[0] : entry.from_profile
  const isFromMe = entry.from_id === userId
  const fromName = isFromMe ? 'you' : fromProfile?.display_name || fromProfile?.email?.split('@')[0] || '—'

  return (
    <div>
      <p className="font-garamond text-ink-faint text-sm italic mb-5">
        {isFromMe ? 'you sent a postcard' : `${fromName} sent a postcard`}
      </p>
      <Link href={`/postcards/${entry.id}`} className="group inline-block">
        <div className="bg-white p-2.5 pb-10 shadow-sm group-hover:shadow-md transition-shadow duration-200" style={{ maxWidth: '280px' }}>
          <div className="overflow-hidden bg-paper-dark">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entry.image_url}
              alt={entry.caption || 'postcard'}
              className="w-full object-cover"
            />
          </div>
          {entry.caption && (
            <p className="font-garamond italic text-ink-muted text-sm text-center mt-4 px-2 leading-relaxed">
              {entry.caption}
            </p>
          )}
        </div>
      </Link>
    </div>
  )
}

function MomentCard({ entry }: { entry: TimelineEntry & { kind: 'moment' } }) {
  return (
    <div className="max-w-lg">
      <p className="font-garamond text-2xl text-ink mb-3">{entry.title}</p>
      {entry.note && (
        <p
          className="font-garamond text-ink-muted italic leading-relaxed"
          style={{ fontSize: '1.0625rem', lineHeight: '1.9' }}
        >
          {entry.note}
        </p>
      )}
    </div>
  )
}
