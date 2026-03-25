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
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
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

  // Scroll selected dot into view
  useEffect(() => {
    if (selected === null) return
    const dot = dotRefs.current[selected]
    const track = trackRef.current
    if (!dot || !track) return
    const dotLeft = dot.offsetLeft
    const dotWidth = dot.offsetWidth
    const trackWidth = track.offsetWidth
    const scrollTarget = dotLeft - trackWidth / 2 + dotWidth / 2
    track.scrollTo({ left: scrollTarget, behavior: 'smooth' })
  }, [selected])

  if (entries.length === 0) {
    return (
      <p className="font-garamond text-ink-muted italic">
        Nothing here yet. Letters and postcards will appear as you exchange them.
      </p>
    )
  }

  const selectedEntry = selected !== null ? entries[selected] : null

  return (
    <div>
      {/* Horizontal scrollable track */}
      <div
        ref={trackRef}
        className="overflow-x-auto pb-2 -mx-10 px-10"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="relative" style={{ minWidth: `${entries.length * 56 + 80}px` }}>

          {/* Year labels — above the line */}
          <div className="relative h-6 mb-1">
            {entries.map((entry, i) => {
              const year = getYear(entryDate(entry))
              const prevYear = i > 0 ? getYear(entryDate(entries[i - 1])) : null
              if (year === prevYear) return null
              return (
                <span
                  key={`year-${i}`}
                  className="absolute font-garamond text-xs text-ink-faint italic"
                  style={{ left: `${i * 56 + 28}px`, transform: 'translateX(-50%)' }}
                >
                  {year}
                </span>
              )
            })}
          </div>

          {/* The line */}
          <div className="absolute left-0 right-0 h-px bg-border" style={{ top: '46px' }} />

          {/* Dots */}
          <div className="relative h-16 flex items-center">
            {entries.map((entry, i) => {
              const isSelected = selected === i
              const isLetter = entry.kind === 'letter'
              const isPostcard = entry.kind === 'postcard'
              const isMoment = entry.kind === 'moment'

              return (
                <button
                  key={`${entry.kind}-${entry.id}`}
                  ref={el => { dotRefs.current[i] = el }}
                  onClick={() => setSelected(isSelected ? null : i)}
                  className="absolute flex flex-col items-center gap-1 group"
                  style={{ left: `${i * 56 + 28}px`, transform: 'translateX(-50%)' }}
                  title={formatShortDate(entryDate(entry))}
                >
                  {/* Dot */}
                  <div className={`
                    transition-all duration-200
                    ${isMoment
                      ? `w-3 h-3 rotate-45 border ${isSelected ? 'bg-accent border-accent scale-125' : 'bg-paper border-accent group-hover:scale-110'}`
                      : isPostcard
                        ? `w-2.5 h-2.5 rounded-sm ${isSelected ? 'bg-accent scale-125' : 'bg-border-dark group-hover:bg-ink-faint group-hover:scale-110'}`
                        : `w-2 h-2 rounded-full border ${isSelected ? 'bg-accent border-accent scale-125' : 'bg-paper border-border-dark group-hover:border-ink-muted group-hover:scale-110'}`
                    }
                  `} />
                </button>
              )
            })}
          </div>

          {/* Short date labels below line for selected */}
          <div className="relative h-5">
            {selected !== null && (
              <span
                className="absolute font-garamond text-xs text-accent italic"
                style={{ left: `${selected * 56 + 28}px`, transform: 'translateX(-50%)' }}
              >
                {formatShortDate(entryDate(entries[selected]))}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded card */}
      <div className={`transition-all duration-300 overflow-hidden ${selectedEntry ? 'mt-8' : 'mt-0'}`}>
        {selectedEntry && (
          <div className="border-t border-border pt-8">
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
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-10 pt-6 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full border border-border-dark bg-paper" />
          <span className="font-garamond text-ink-faint text-xs italic">letter</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-sm bg-border-dark" />
          <span className="font-garamond text-ink-faint text-xs italic">postcard</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rotate-45 border border-accent bg-paper" />
          <span className="font-garamond text-ink-faint text-xs italic">moment</span>
        </div>
      </div>
    </div>
  )
}

function LetterCard({ entry, userId }: { entry: TimelineEntry & { kind: 'letter' }, userId: string }) {
  const fromProfile = Array.isArray(entry.from_profile) ? entry.from_profile[0] : entry.from_profile
  const isFromMe = entry.from_id === userId
  const fromName = isFromMe ? 'you' : fromProfile?.display_name || fromProfile?.email?.split('@')[0] || '—'
  const firstLine = entry.body.split('\n').find((l: string) => l.trim()) || ''
  const preview = firstLine.length > 200 ? firstLine.substring(0, 200) + '…' : firstLine

  return (
    <div className="max-w-lg">
      <p className="font-garamond text-ink-faint text-sm italic mb-4">
        {formatDate(entry.sent_at)} · from {fromName}
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
      <p className="font-garamond text-ink-faint text-sm italic mb-4">
        {formatDate(entry.sent_at)} · from {fromName}
      </p>
      <Link href={`/postcards/${entry.id}`} className="block group inline-block">
        <div className="bg-white p-2 pb-8 shadow-sm group-hover:shadow-md transition-shadow duration-200 max-w-xs">
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
      <p className="font-garamond text-ink-faint text-sm italic mb-3">
        {formatDate(entry.occurred_at)}
      </p>
      <p className="font-garamond text-ink text-xl mb-3">{entry.title}</p>
      {entry.note && (
        <p className="font-garamond text-ink-muted italic leading-relaxed" style={{ fontSize: '1.0625rem', lineHeight: '1.9' }}>
          {entry.note}
        </p>
      )}
    </div>
  )
}
