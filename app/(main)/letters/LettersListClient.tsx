'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

type LetterItem = {
  id: string
  body: string
  sent_at: string
  read_at: string | null
  from_id: string
  to_id: string
  from_profile: { display_name: string | null; email: string | null } | { display_name: string | null; email: string | null }[] | null
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getYear(dateString: string) {
  return new Date(dateString).getFullYear()
}

export default function LettersListClient({ letters, userId }: { letters: LetterItem[]; userId: string }) {
  const [selected, setSelected] = useState<LetterItem | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [startY, setStartY] = useState<number | null>(null)

  const bodyPreview = useMemo(() => {
    if (!selected) return ''
    const first = selected.body.split('\n').find((l) => l.trim()) || ''
    return first.length > 420 ? `${first.slice(0, 420)}…` : first
  }, [selected])

  function closeModal() {
    setSelected(null)
    setExpanded(false)
    setDragY(0)
    setStartY(null)
  }

  function onTouchStart(y: number) {
    setStartY(y)
  }

  function onTouchMove(y: number) {
    if (startY === null) return
    const delta = y - startY
    setDragY(Math.min(40, delta))
  }

  function onTouchEnd() {
    if (dragY < -70) setExpanded(true)
    setDragY(0)
    setStartY(null)
  }

  return (
    <>
      <div>
        {letters.map((letter, i) => {
          const isFromMe = letter.from_id === userId
          const isUnread = !isFromMe && !letter.read_at
          const fromProfile = Array.isArray(letter.from_profile) ? letter.from_profile[0] : letter.from_profile
          const fromName = isFromMe ? 'you' : fromProfile?.display_name || fromProfile?.email?.split('@')[0] || '—'
          const firstLine = letter.body.split('\n').find((l) => l.trim()) || ''
          const preview = firstLine.length > 140 ? `${firstLine.substring(0, 140)}…` : firstLine
          const year = getYear(letter.sent_at)
          const prevYear = i > 0 ? getYear(letters[i - 1].sent_at) : null
          const showYear = year !== prevYear

          return (
            <div key={letter.id}>
              {showYear && (
                <div className="mt-2 flex items-center gap-4 py-5">
                  <span className="shrink-0 font-garamond text-sm italic text-ink-faint">{year}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}

              <button
                onClick={() => setSelected(letter)}
                className="group block w-full border-b border-border py-5 text-left last:border-b-0"
              >
                <div className={`flex gap-4 ${isFromMe ? 'pl-6' : ''}`}>
                  {!isFromMe && (
                    <div className="w-1.5 shrink-0 pt-2">
                      {isUnread && <span className="block h-1.5 w-1.5 rounded-full bg-accent" />}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className={`font-garamond text-base leading-relaxed transition-colors duration-200 group-hover:text-accent ${isFromMe ? 'italic text-ink-muted' : isUnread ? 'text-ink' : 'text-ink-muted'}`}>
                      {preview}
                    </p>
                    <p className="mt-1.5 font-garamond text-sm italic text-ink-faint">
                      {fromName} · {formatDate(letter.sent_at)}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6" onClick={closeModal}>
          <div className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]" />

          <div
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => onTouchStart(e.touches[0].clientY)}
            onTouchMove={(e) => onTouchMove(e.touches[0].clientY)}
            onTouchEnd={onTouchEnd}
            className={`relative w-full bg-paper shadow-xl transition-all duration-300 ${expanded ? 'max-h-[96vh] sm:max-h-[90vh]' : 'max-h-[78vh] sm:max-h-[82vh] sm:max-w-2xl'} overflow-y-auto rounded-t-2xl sm:rounded-xl`}
            style={{ transform: `translateY(${dragY > 0 ? dragY : 0}px)` }}
          >
            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-border sm:hidden" />

            <div className="p-6 sm:p-10">
              <div className="mb-6 flex items-center justify-between">
                <p className="font-garamond text-sm italic text-ink-faint">{formatDate(selected.sent_at)}</p>
                <div className="flex items-center gap-4">
                  {!expanded && (
                    <button onClick={() => setExpanded(true)} className="font-garamond text-sm italic text-ink-faint hover:text-ink-muted">
                      expand
                    </button>
                  )}
                  <button onClick={closeModal} className="font-garamond text-sm italic text-ink-faint hover:text-ink-muted">
                    close
                  </button>
                </div>
              </div>

              <p className="font-garamond text-lg leading-9 text-ink">{bodyPreview}</p>

              <div className="mt-8 border-t border-border pt-4">
                <Link href={`/letters/${selected.id}`} onClick={closeModal} className="font-garamond text-sm italic text-ink-muted hover:text-ink">
                  Open full letter →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
