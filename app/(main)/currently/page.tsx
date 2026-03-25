'use client'

import { useState } from 'react'
import { saveCurrently } from '@/app/actions/currently'
import Link from 'next/link'
import { useEffect } from 'react'

const LABELS = ['reading', 'listening to', 'thinking about', 'watching', 'eating']

export default function CurrentlyPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Pre-fill from server — fetched via client on mount
  useEffect(() => {
    fetch('/api/currently')
      .then(r => r.json())
      .then((items: { label: string; value: string }[]) => {
        const map: Record<string, string> = {}
        items.forEach(i => { map[i.label] = i.value })
        setValues(map)
      })
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const formData = new FormData()
    LABELS.forEach(label => formData.set(label, values[label] || ''))
    const result = await saveCurrently(formData)
    if (result?.error) {
      setError(result.error)
      setSaving(false)
    }
  }

  return (
    <div className="max-w-sm">
      <div className="mb-10">
        <Link
          href="/"
          className="font-garamond text-ink-faint hover:text-ink-muted italic text-sm transition-colors duration-200"
        >
          ← home
        </Link>
      </div>

      <h1 className="font-garamond text-2xl text-ink mb-2">What you&apos;re sharing</h1>
      <p className="font-garamond text-ink-faint italic text-sm mb-10">
        This is what she sees when she opens the app. Keep it honest.
      </p>

      <form onSubmit={handleSubmit} className="space-y-7">
        {LABELS.map(label => (
          <div key={label}>
            <label className="font-garamond text-ink-faint text-sm italic block mb-1.5">
              {label}
            </label>
            <input
              type="text"
              value={values[label] || ''}
              onChange={e => setValues(v => ({ ...v, [label]: e.target.value }))}
              placeholder={placeholder(label)}
              className="w-full bg-transparent font-garamond text-ink placeholder:text-ink-faint border-b border-border pb-2 focus:border-ink-muted transition-colors duration-200"
            />
          </div>
        ))}

        {error && (
          <p className="font-garamond text-accent italic text-sm">{error}</p>
        )}

        <div className="flex justify-end border-t border-border pt-5">
          <button
            type="submit"
            disabled={saving}
            className="font-garamond italic text-ink-muted hover:text-ink text-base transition-colors duration-200 disabled:opacity-40"
          >
            {saving ? 'saving…' : 'Save →'}
          </button>
        </div>
      </form>
    </div>
  )
}

function placeholder(label: string) {
  const map: Record<string, string> = {
    'reading': 'Norwegian Wood',
    'listening to': 'Cigarettes After Sex',
    'thinking about': 'our next trip',
    'watching': 'Severance',
    'eating': 'too much rice',
  }
  return map[label] || ''
}
