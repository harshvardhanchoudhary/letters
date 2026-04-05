'use client'

import { useEffect, useState } from 'react'
import { saveMoodCheckIn } from '@/app/actions/mood'

const OPTIONS = {
  mood: ['warm', 'tender', 'anxious', 'playful', 'low-energy', 'hopeful'],
  phase: ['deep focus', 'social', 'resting', 'sensitive'],
}

export default function MoodPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSaved(new URLSearchParams(window.location.search).get('saved') === '1')

    fetch('/api/currently')
      .then((r) => r.json())
      .then((items: { label: string; value: string }[]) => {
        const map: Record<string, string> = {}
        items.forEach((item) => {
          map[item.label] = item.value
        })
        setValues(map)
      })
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const formData = new FormData()
    const labels = ['mood', 'phase', 'energy', 'social battery', 'need from partner', 'note']
    labels.forEach((label) => formData.set(label, values[label] || ''))

    const result = await saveMoodCheckIn(formData)
    if (result?.error) {
      setError(result.error)
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="font-garamond text-3xl text-ink">Mood check-in</h1>
      <p className="mt-2 font-garamond text-sm italic text-ink-faint">
        Shared with your partner by default. Phase is explicitly visible.
      </p>

      {saved && (
        <p className="mt-4 font-garamond text-sm italic text-accent">Saved.</p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <Field label="mood" value={values.mood || ''} onChange={(v) => setValues((prev) => ({ ...prev, mood: v }))} options={OPTIONS.mood} />
        <Field label="phase" value={values.phase || ''} onChange={(v) => setValues((prev) => ({ ...prev, phase: v }))} options={OPTIONS.phase} />
        <TextField label="energy" value={values['energy'] || ''} onChange={(v) => setValues((prev) => ({ ...prev, energy: v }))} placeholder="0-100, or words" />
        <TextField label="social battery" value={values['social battery'] || ''} onChange={(v) => setValues((prev) => ({ ...prev, 'social battery': v }))} placeholder="full / medium / empty" />
        <TextField label="need from partner" value={values['need from partner'] || ''} onChange={(v) => setValues((prev) => ({ ...prev, 'need from partner': v }))} placeholder="reassurance, space, voice note, hug" />

        <div>
          <label className="mb-1.5 block font-garamond text-sm italic text-ink-faint">note</label>
          <textarea
            value={values.note || ''}
            onChange={(e) => setValues((prev) => ({ ...prev, note: e.target.value }))}
            rows={4}
            placeholder="Anything you want to say with this check-in"
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 font-garamond text-ink placeholder:text-ink-faint focus:border-ink-muted"
          />
        </div>

        {error && <p className="font-garamond text-sm italic text-accent">{error}</p>}

        <div className="border-t border-border pt-4">
          <button type="submit" disabled={saving} className="font-garamond text-base italic text-ink-muted transition-colors duration-200 hover:text-ink disabled:opacity-50">
            {saving ? 'saving…' : 'Save mood →'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, value, onChange, options }: { label: string; value: string; onChange: (next: string) => void; options: string[] }) {
  return (
    <div>
      <label className="mb-2 block font-garamond text-sm italic text-ink-faint">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`rounded-full border px-3 py-1 font-garamond text-sm transition-colors duration-200 ${selected ? 'border-accent text-ink' : 'border-border text-ink-muted hover:text-ink'}`}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (next: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="mb-1.5 block font-garamond text-sm italic text-ink-faint">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-b border-border bg-transparent pb-2 font-garamond text-ink placeholder:text-ink-faint focus:border-ink-muted"
      />
    </div>
  )
}
