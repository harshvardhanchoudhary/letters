'use client'

import { useState } from 'react'
import { addMoment } from '@/app/actions/moments'
import Link from 'next/link'

export default function AddMomentPage() {
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !date || saving) return

    setSaving(true)
    setError('')

    const formData = new FormData()
    formData.set('title', title)
    formData.set('note', note)
    formData.set('occurred_at', date)

    const result = await addMoment(formData)
    if (result?.error) {
      setError(result.error)
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-10">
        <Link
          href="/timeline"
          className="font-garamond text-ink-faint hover:text-ink-muted italic text-sm transition-colors duration-200"
        >
          ← timeline
        </Link>
      </div>

      <h1 className="font-garamond text-2xl text-ink mb-10">Add a moment</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What was this moment?"
            autoFocus
            className="w-full bg-transparent font-garamond text-lg text-ink placeholder:text-ink-faint border-b border-border pb-2.5 focus:border-ink-muted transition-colors duration-200"
          />
        </div>

        <div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="A note about it… (optional)"
            rows={5}
            className="w-full bg-transparent font-garamond text-ink placeholder:text-ink-faint"
            style={{ fontSize: '1.0625rem', lineHeight: '1.9' }}
          />
        </div>

        <div>
          <label className="font-garamond text-ink-faint text-sm italic block mb-2">
            When did this happen?
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="bg-transparent font-garamond text-ink-muted border-b border-border pb-1.5 focus:border-ink-muted transition-colors duration-200"
          />
        </div>

        {error && (
          <p className="font-garamond text-accent italic text-sm">{error}</p>
        )}

        <div className="flex justify-end border-t border-border pt-5">
          <button
            type="submit"
            disabled={saving || !title.trim() || !date}
            className="font-garamond text-base italic text-ink-muted hover:text-ink transition-colors duration-200 disabled:opacity-40"
          >
            {saving ? 'saving…' : 'Add to timeline →'}
          </button>
        </div>
      </form>
    </div>
  )
}
