'use client'

// LEARN: 'use client' means this component runs in the browser.
// We need it here because we're managing local state (what the user typed,
// whether we've sent the link, etc). Server components can't do that.
// The actual sign-in logic still runs on the server via the signIn action.

import { useState } from 'react'
import { signIn } from '@/app/actions/auth'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const linkExpired = searchParams.get('error') === 'link_expired'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError('')

    const result = await signIn(email.trim())

    if (result?.error) {
      setError(result.error)
    } else {
      setSent(true)
    }

    setLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center max-w-sm">
        <p className="font-garamond text-3xl italic text-ink mb-10">letters</p>
        <p className="font-garamond text-ink text-lg mb-2">
          A letter is on its way to you.
        </p>
        <p className="font-garamond text-ink-muted italic text-base">
          Open your inbox and click the link inside to enter.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-xs">
      <div className="text-center mb-14">
        <h1 className="font-garamond text-4xl italic text-ink tracking-wide">letters</h1>
        <p className="font-garamond text-ink-muted mt-2 text-base italic">
          A private space for two.
        </p>
      </div>

      {linkExpired && (
        <p className="font-garamond text-accent text-sm italic text-center mb-6">
          That link has expired. Enter your email to get a new one.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your email"
          required
          autoFocus
          className="w-full bg-transparent border-b border-border-dark text-ink font-garamond text-lg py-2.5 placeholder:text-ink-faint focus:border-ink-muted transition-colors duration-200"
        />

        {error && (
          <p className="font-garamond text-accent text-sm italic">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="w-full font-garamond text-base italic py-2 text-ink-muted hover:text-ink transition-colors duration-200 disabled:opacity-40"
        >
          {loading ? 'sending...' : 'enter →'}
        </button>
      </form>

      <p className="text-center text-ink-faint font-garamond text-xs mt-16 italic">
        A magic link will be sent to your email.
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
