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

function dayKey(dateString: string) {
  return new Date(dateString).toISOString().slice(0, 10)
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeModal])

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

  const photoDays = entries
    .filter((entry): entry is TimelineEntry & { kind: 'postcard' } => entry.kind === 'postcard')
    .reduce<Record<string, (TimelineEntry & { kind: 'postcard' })[]>>((acc, entry) => {
      const key = dayKey(entry.sent_at)
      acc[key] = acc[key] || []
      acc[key].push(entry)
      return acc
    }, {})

  const photoDayCards = Object.entries(photoDays)
    .map(([key, cards]) => ({ key, cards }))
    .sort((a, b) => new Date(b.key).getTime() - new Date(a.key).getTime())

  function handleDotClick(i: number) {
    setSelected(i)
    setModalOpen(true)
  }

  return (
    <>
      {photoDayCards.length > 0 && (
        <section className="mb-10">
          <p className="font-garamond text-xs italic text-ink-faint mb-3">Photo days</p>
          <div className="space-y-5">
            {photoDayCards.map(({ key, cards }) => {
              const hero = cards[0]
              return (
                <article key={key} className="rounded-lg border border-border p-3">
                  <p className="mb-3 font-garamond text-sm italic text-ink-faint">{formatDate(key)}</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={hero.image_url} alt={hero.caption || 'date photo'} className="h-60 w-full rounded-md object-cover" />
                  {hero.caption && <p className="mt-3 font-garamond text-sm italic text-ink-muted">{hero.caption}</p>}
                  {cards.length > 1 && (
                    <p className="mt-2 font-garamond text-xs italic text-ink-faint">+ {cards.length - 1} more photos that day</p>
                  )}
                </article>
              )
            })}
          </div>
        </section>
      )}

      <div
        ref={trackRef}
        className="overflow-x-auto px-1"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="relative" style={{ width: `${entries.length * DOT_SPACING + 80}px`, height: '88px' }}>
          <div className="absolute left-0 right-0 h-px bg-border" style={{ top: '44px' }} />

          {entries.map((entry, i) => {
            const year = getYear(entryDate(entry))
            const prevYear = i > 0 ? getYear(entryDate(entries[i - 1])) : null
            if (year === prevYear) return null
            return (
              <span
                key={`year-${i}`}
                className="absolute select-none font-garamond text-xs italic text-ink-faint"
                style={{ left: `${i * DOT_SPACING + 40}px`, top: '6px', transform: 'translateX(-50%)' }}
              >
                {year}
              </span>
            )
          })}

          {entries.map((entry, i) => {
            const isSelected = selected === i && modalOpen
            const isMoment = entry.kind === 'moment'
            const isPostcard = entry.kind === 'postcard'

            return (
              <button
                key={`${entry.kind}-${entry.id}`}
                ref={(el) => { dotRefs.current[i] = el }}
                onClick={() => handleDotClick(i)}
                className="absolute group cursor-pointer"
                style={{ left: `${i * DOT_SPACING + 40}px`, top: '36px', transform: 'translateX(-50%)' }}
                title={`${formatShortDate(entryDate(entry))} — ${entry.kind}`}
              >
                <div className={`transition-all duration-200 ${
                  isMoment
                    ? `h-3.5 w-3.5 rotate-45 border-2 ${isSelected ? 'scale-125 border-accent bg-accent' : 'border-accent/60 bg-paper group-hover:scale-110 group-hover:border-accent'}`
                    : isPostcard
                      ? `h-3 w-3 rounded-sm ${isSelected ? 'scale-125 bg-accent' : 'bg-border-dark group-hover:scale-110 group-hover:bg-ink-faint'}`
                      : `h-2.5 w-2.5 rounded-full border-2 ${isSelected ? 'scale-125 border-accent bg-accent' : 'border-border-dark bg-paper group-hover:scale-110 group-hover:border-ink-muted'}`
                }`} />
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-6 border-t border-border pt-5">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full border-2 border-border-dark bg-paper" />
          <span className="font-garamond text-xs italic text-ink-faint">letter</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 flex-shrink-0 rounded-sm bg-border-dark" />
          <span className="font-garamond text-xs italic text-ink-faint">postcard/photo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 flex-shrink-0 rotate-45 border-2 border-accent/60 bg-paper" />
          <span className="font-garamond text-xs italic text-ink-faint">moment</span>
        </div>
      </div>

      {modalOpen && selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={closeModal}>
          <div className="absolute inset-0 bg-ink/30" />

          <div
            className="relative max-h-[80vh] w-full max-w-lg overflow-y-auto bg-paper shadow-xl"
            style={{ padding: '2.5rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute right-5 top-5 font-garamond text-sm italic text-ink-faint hover:text-ink transition-colors duration-200"
            >
              close
            </button>

            {selectedEntry.kind === 'letter' && <LetterModal entry={selectedEntry} userId={userId} onClose={closeModal} />}
            {selectedEntry.kind === 'postcard' && <PostcardModal entry={selectedEntry} userId={userId} />}
            {selectedEntry.kind === 'moment' && <MomentModal entry={selectedEntry} />}
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
      <p className="mb-6 font-garamond text-sm italic text-ink-faint">
        {formatDate(entry.sent_at)} · {isFromMe ? 'you wrote' : `from ${fromName}`}
      </p>
      <div className="letter-body mb-8 font-garamond leading-relaxed text-ink">{entry.body}</div>
      <Link href={`/letters/${entry.id}`} onClick={onClose} className="font-garamond text-sm italic text-ink-muted hover:text-ink transition-colors duration-200">
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
      <p className="mb-5 font-garamond text-sm italic text-ink-faint">
        {formatDate(entry.sent_at)} · {isFromMe ? 'you sent' : `from ${fromName}`}
      </p>
      <div className="bg-white p-2 pb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={entry.image_url} alt={entry.caption || 'postcard'} className="w-full object-cover" />
        {entry.caption && <p className="mt-4 px-2 text-center font-garamond text-sm italic text-ink-muted">{entry.caption}</p>}
      </div>
    </div>
  )
}

function MomentModal({ entry }: { entry: TimelineEntry & { kind: 'moment' } }) {
  return (
    <div>
      <p className="mb-4 font-garamond text-sm italic text-ink-faint">{formatDate(entry.occurred_at)}</p>
      <p className="mb-4 font-garamond text-2xl text-ink">{entry.title}</p>
      {entry.note && <p className="font-garamond text-[1.0625rem] italic leading-[1.9] text-ink-muted">{entry.note}</p>}
    </div>
  )
}
