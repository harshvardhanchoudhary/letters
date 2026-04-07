import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'
import FloatingNav from './FloatingNav'

function resolveDisplayName(email: string | undefined | null, displayName: string | null | undefined): string {
  if (displayName) return displayName
  
  // This tells Vercel to stop strictly checking the environment variables
  const env = process.env as any
  
  if (email?.toLowerCase() === env.ALLOWED_EMAIL_1?.toLowerCase()) return env.DISPLAY_NAME_1 || email?.split('@')[0] || '—'
  if (email?.toLowerCase() === env.ALLOWED_EMAIL_2?.toLowerCase()) return env.DISPLAY_NAME_2 || email?.split('@')[0] || '—'
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

  return (
    <div className="min-h-[100dvh] w-full flex flex-col relative selection:bg-accent selection:text-paper">
      
      <header className="absolute top-0 w-full z-30 pt-8 px-6">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
          <Link href="/" className="group mix-blend-multiply">
            <p className="font-garamond text-[0.65rem] uppercase tracking-widest text-ink-muted/60">{myName} &amp; {partnerName}</p>
          </Link>

          <form action={signOut}>
            <button type="submit" className="font-garamond text-[0.65rem] uppercase tracking-widest text-ink-muted/60 transition-colors duration-200 hover:text-ink">
              Leave
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-24 pb-32">
        {children}
      </main>

      <FloatingNav />
    </div>
  )
}
