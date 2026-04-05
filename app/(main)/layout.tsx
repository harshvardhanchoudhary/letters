import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'
import { MainTabBar } from './MainTabBar'

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

  const [{ data: profile }, { data: partner }, { count: unreadLetters }] = await Promise.all([
    supabase.from('profiles').select('display_name, email').eq('id', user.id).single(),
    supabase.from('profiles').select('display_name, email').neq('id', user.id).single(),
    supabase.from('letters').select('*', { count: 'exact', head: true }).eq('to_id', user.id).is('read_at', null),
  ])

  const myName = resolveDisplayName(profile?.email, profile?.display_name)
  const partnerName = resolveDisplayName(partner?.email, partner?.display_name)

  const tabs = [
    { href: '/', label: 'home' },
    { href: '/letters', label: 'letters', dot: (unreadLetters ?? 0) > 0 },
    { href: '/timeline', label: 'timeline' },
    { href: '/mood', label: 'mood' },
    { href: '/library', label: 'library' },
  ]

  return (
    <div className="min-h-screen bg-paper pb-20">
      <header className="sticky top-0 z-30 border-b border-border bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between px-4 py-3">
          <Link href="/" className="group">
            <p className="font-garamond text-[0.7rem] text-ink-faint">{myName} &amp; {partnerName}</p>
            <p className="font-garamond text-xl italic text-ink transition-colors duration-200 group-hover:text-accent">letters</p>
          </Link>

          <form action={signOut}>
            <button type="submit" className="font-garamond text-sm italic text-ink-faint transition-colors duration-200 hover:text-ink-muted">
              leave
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl px-4 py-6">
        {children}
      </main>

      <MainTabBar tabs={tabs} />
    </div>
  )
}
