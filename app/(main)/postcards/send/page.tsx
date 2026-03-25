'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { savePostcard } from '@/app/actions/postcards'
import Link from 'next/link'

export default function SendPostcardPage() {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || sending) return

    setSending(true)
    setError('')

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('timeline-photos')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw new Error(uploadError.message)

      const { data: { publicUrl } } = supabase.storage
        .from('timeline-photos')
        .getPublicUrl(path)

      const result = await savePostcard(publicUrl, caption.trim() || null)
      if (result?.error) throw new Error(result.error)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setSending(false)
    }
  }

  return (
    <div className="max-w-sm">
      <div className="mb-10">
        <Link
          href="/postcards"
          className="font-garamond text-ink-faint hover:text-ink-muted italic text-sm transition-colors duration-200"
        >
          ← postcards
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Photo area */}
        <div
          className="bg-white p-3 pb-10 shadow-sm mb-8 cursor-pointer"
          onClick={() => !preview && inputRef.current?.click()}
        >
          {preview ? (
            <div className="relative">
              <div className="aspect-square overflow-hidden bg-paper-dark">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setPreview(null)
                  setFile(null)
                  if (inputRef.current) inputRef.current.value = ''
                }}
                className="absolute top-2 right-2 bg-white/80 font-garamond text-ink-muted text-xs px-2 py-1 hover:text-ink transition-colors"
              >
                change
              </button>
            </div>
          ) : (
            <div className="aspect-square bg-paper-darker flex flex-col items-center justify-center gap-3">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-ink-faint">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p className="font-garamond italic text-ink-faint text-sm">tap to choose a photo</p>
            </div>
          )}

          {/* Caption inside polaroid */}
          <div className="mt-4 px-1">
            <input
              type="text"
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="add a caption…"
              className="w-full bg-transparent font-garamond italic text-ink-muted text-sm text-center placeholder:text-ink-faint border-none focus:outline-none"
            />
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {!preview && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full font-garamond text-base italic text-ink-muted hover:text-ink transition-colors duration-200 border border-border py-3 mb-4"
          >
            Choose photo
          </button>
        )}

        {error && (
          <p className="font-garamond text-accent italic text-sm mb-5">{error}</p>
        )}

        <div className="flex justify-end border-t border-border pt-5">
          <button
            type="submit"
            disabled={!file || sending}
            className="font-garamond text-base italic text-ink-muted hover:text-ink transition-colors duration-200 disabled:opacity-40"
          >
            {sending ? 'sending…' : 'Send postcard →'}
          </button>
        </div>
      </form>
    </div>
  )
}
