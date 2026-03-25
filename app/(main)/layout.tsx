import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'

function resolveDisplayName(email: string | undefined | null, displayName: string | null | undefined): string {
  if (displayName) return displayName
  if (email?.toLowerCase() === process.env.ALLOWED_EMAIL_1?.toLowerCase()) return process.env.DISPLAY_NAME_1 || email?.split('@')[0] || '—'
  if (email?.toLowerCase() === process.env.ALLOWED_EMAIL_2?.toLowerCase()) return process.env.DISPLAY_NAME_2 || email?.split('@')[0] || '—'
  return email?.split('@')[0] || '—'
}

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: partner }] = await Promise.all([
    supabase.from('profiles').select('display_name, email').eq('id', user.id).single(),
    supabase.from('profiles').select('display_name, email').neq('id', user.id).single(),
  ])

  const myName = resolveDisplayName(profile?.email, profile?.display_name)
  const partnerName = resolveDisplayName(partner?.email, partner?.display_name)

  const [{ count: unreadLetters }, { count: unreadPostcards }] = await Promise.all([
    supabase.from('letters').select('*', { count: 'exact', head: true }).eq('to_id', user.id).is('read_at', null),
    supabase.from('postcards').select('*', { count: 'exact', head: true }).eq('to_id', user.id).is('read_at', null),
  ])

  return (
    <div className="min-h-screen bg-paper flex">
      <aside className="w-48 shrink-0 border-r border-border min-h-screen flex flex-col px-5 py-8">
        <div className="mb-10">
          <Link href="/" className="block group">
            <p className="font-garamond text-xs text-ink-faint mb-1">
              {myName} &amp; {partnerName}
            </p>
            <p className="font-garamond text-2xl italic text-ink group-hover:text-accent transition-colors duration-200">
              letters
            </p>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5">
          <Link href="/" className="block font-garamond text-base text-ink-muted hover:text-ink transition-colors duration-200 py-1.5">
            home
          </Link>

          <div className="flex items-center gap-2 py-1.5">
            <Link href="/letters" className="font-garamond text-base text-ink-muted hover:text-ink transition-colors duration-200">
              letters
            </Link>
            {(unreadLetters ?? 0) > 0 && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
          </div>

          <div className="flex items-center gap-2 py-1.5">
            <Link href="/postcards" className="font-garamond text-base text-ink-muted hover:text-ink transition-colors duration-200">
              postcards
            </Link>
            {(unreadPostcards ?? 0) > 0 && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
          </div>

          <Link href="/timeline" className="block font-garamond text-base text-ink-muted hover:text-ink transition-colors duration-200 py-1.5">
            timeline
          </Link>

          <Link href="/currently" className="block font-garamond text-base text-ink-muted hover:text-ink transition-colors duration-200 py-1.5">
            currently
          </Link>
        </nav>

        <div className="mt-auto pt-5 border-t border-border">
          <p className="font-garamond text-ink-faint text-sm italic mb-2 truncate">{myName}</p>
          <form action={signOut}>
            <button type="submit" className="font-garamond text-ink-faint hover:text-ink-muted text-sm italic transition-colors duration-200">
              leave
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 px-10 py-10 min-w-0">
        {children}
      </main>
    </div>
  )
}
