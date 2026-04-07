import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'
import FloatingNav from './FloatingNav'

// Strictly typed resolver to prevent Vercel build failures
function resolveDisplayName(email: string | undefined | null, displayName: string | null | undefined): string {
  if (displayName) return displayName
  
  const targetEmail = email?.toLowerCase()
  const allowedEmail1 = process.env.ALLOWED_EMAIL_1?.toLowerCase()
  const allowedEmail2 = process.env.ALLOWED_EMAIL_2?.toLowerCase()

  if (targetEmail && allowedEmail1 && targetEmail === allowedEmail1) {
    return process.env.DISPLAY_NAME_1 || targetEmail.split('@')[0] || '—'
  }
  if (targetEmail && allowedEmail2 && targetEmail === allowedEmail2) {
    return process.env.DISPLAY_NAME_2 || targetEmail.split('@')[0] || '—'
  }
  
  return email?.split('@')[0] || '—'
}

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  
  // 1. Securely fetch user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/login')

  // 2. Fetch all necessary data in parallel for performance
  const [profileResult, partnerResult, unreadResult] = await Promise.all([
    supabase.from('profiles').select('display_name, email').eq('id', user.id).single(),
    supabase.from('profiles').select('display_name, email').neq('id', user.id).single(),
    supabase.from('letters').select('*', { count: 'exact', head: true }).eq('to_id', user.id).is('read_at', null),
  ])

  const myName = resolveDisplayName(profileResult.data?.email, profileResult.data?.display_name)
  const partnerName = resolveDisplayName(partnerResult.data?.email, partnerResult.data?.display_name)
  const unreadLettersCount = unreadResult.count ?? 0

  return (
    <div className="min-h-[100dvh] w-full flex flex-col relative selection:bg-accent selection:text-paper">
      
      {/* A deeply minimal header. Removed the sticky background and border.
        This allows the app to feel like an open canvas.
      */}
      <header className="absolute top-0 w-full z-30 pt-6 px-6">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between">
          <Link href="/" className="group mix-blend-multiply focus-visible:outline-none">
            <h1 className="font-garamond text-[0.65rem] uppercase tracking-[0.2em] text-ink-muted/50 transition-colors group-hover:text-ink">
              {myName} &amp; {partnerName}
            </h1>
          </Link>

          <form action={signOut}>
            <button 
              type="submit" 
              className="font-garamond text-[0.65rem] uppercase tracking-[0.2em] text-ink-muted/50 transition-colors duration-300 hover:text-ink focus-visible:outline-none"
            >
              Leave
            </button>
          </form>
        </div>
      </header>

      {/* The main content wrapper. 
        Pushed down to accommodate the absolute header and padded at the bottom for the floating nav.
      */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 pt-24 pb-40">
        {children}
      </main>

      {/* The new production-grade navigation engine */}
      <FloatingNav unreadCount={unreadLettersCount} />
    </div>
  )
}
