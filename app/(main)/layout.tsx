// LEARN: Route groups like (main) and (auth) let us apply different layouts
// to different parts of the app without affecting the URL.
// /letters still shows as /letters in the browser — the (main) part is invisible.
// This layout wraps every page inside the main app with the sidebar navigation.

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('id', user.id)
    .single()

  const displayName = profile?.display_name || profile?.email?.split('@')[0] || 'you'

  // Unread count — drives the dot indicator on the nav
  const { count: unreadCount } = await supabase
    .from('letters')
    .select('*', { count: 'exact', head: true })
    .eq('to_id', user.id)
    .is('read_at', null)

  return (
    <div className="min-h-screen bg-paper flex">
      {/* Sidebar */}
      <aside className="w-48 shrink-0 border-r border-border min-h-screen flex flex-col px-5 py-8">
        <div className="mb-10">
          <Link
            href="/"
            className="font-garamond text-2xl italic text-ink hover:text-accent transition-colors duration-200"
          >
            letters
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5">
          <Link
            href="/"
            className="block font-garamond text-base text-ink-muted hover:text-ink transition-colors duration-200 py-1.5"
          >
            home
          </Link>

          <div className="flex items-center gap-2 py-1.5">
            <Link
              href="/letters"
              className="font-garamond text-base text-ink-muted hover:text-ink transition-colors duration-200"
            >
              letters
            </Link>
            {(unreadCount ?? 0) > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            )}
          </div>
        </nav>

        <div className="mt-auto pt-5 border-t border-border">
          <p className="font-garamond text-ink-faint text-sm italic mb-2 truncate">
            {displayName}
          </p>
          <form action={signOut}>
            <button
              type="submit"
              className="font-garamond text-ink-faint hover:text-ink-muted text-sm italic transition-colors duration-200"
            >
              leave
            </button>
          </form>
        </div>
      </aside>

      {/* Page content */}
      <main className="flex-1 px-10 py-10 min-w-0">
        {children}
      </main>
    </div>
  )
}
