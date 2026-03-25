'use client'

import { useState, useRef, useEffect } from 'react'
import { sendLetter } from '@/app/actions/letters'
import Link from 'next/link'

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export default function WritePage() {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
    formData.set('body', body)

    const result = await sendLetter(formData)

    if (result?.error) {
      setError(result.error)
      setSending(false)
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-12">
        <Link
          href="/letters"
          className="font-garamond text-ink-faint hover:text-ink-muted italic text-sm transition-colors duration-200"
        >
          ← letters
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-10">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Begin your letter here…"
            rows={16}
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
