'use client'

import { useState, useRef, useEffect } from 'react'
import { sendLetter } from '@/app/actions/letters'
import Link from 'next/link'

// LEARN: This is a Client Component because it needs interactivity:
// - auto-growing textarea (needs to measure DOM element height)
// - live word count
// - loading state while sending
// Server Components can't do any of that — they only render HTML once.

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export default function WritePage() {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-grow the textarea as the user types
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [body])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || sending) return

    setSending(true)
    setError('')

    const formData = new FormData()
    formData.set('subject', subject)
    formData.set('body', body)

    const result = await sendLetter(formData)

    if (result?.error) {
      setError(result.error)
      setSending(false)
    }
    // On success, sendLetter redirects to /letters — no need to handle here
  }

  return (
    <div className="max-w-lg">
      <div className="mb-10">
        <Link
          href="/letters"
          className="font-garamond text-ink-faint hover:text-ink-muted italic text-sm transition-colors duration-200"
        >
          ← letters
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Optional subject */}
        <div className="mb-8">
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject (optional)"
            className="w-full bg-transparent font-garamond text-lg text-ink placeholder:text-ink-faint border-b border-border pb-2.5 focus:border-ink-muted transition-colors duration-200"
          />
        </div>

        {/* Body */}
        <div className="mb-10">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Begin your letter here…"
            rows={14}
            autoFocus
            className="w-full bg-transparent font-garamond text-ink placeholder:text-ink-faint overflow-hidden"
            style={{ fontSize: '1.0625rem', lineHeight: '1.9' }}
          />
        </div>

        {error && (
          <p className="font-garamond text-accent italic text-sm mb-5">{error}</p>
        )}

        <div className="flex items-center justify-between border-t border-border pt-5">
          <p className="font-garamond text-ink-faint text-xs italic">
            {body.trim() ? `${wordCount(body)} words` : ''}
          </p>
          <button
            type="submit"
            disabled={sending || !body.trim()}
            className="font-garamond text-base italic text-ink-muted hover:text-ink transition-colors duration-200 disabled:opacity-40"
          >
            {sending ? 'sealing…' : 'Seal & send →'}
          </button>
        </div>
      </form>
    </div>
  )
}
