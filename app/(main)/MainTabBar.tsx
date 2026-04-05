'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Tab = {
  href: string
  label: string
  dot?: boolean
}

export function MainTabBar({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <ul className="mx-auto flex max-w-xl items-center justify-between px-4 py-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`)

          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`relative inline-flex flex-col items-center gap-1 rounded-md px-3 py-1.5 font-garamond text-sm transition-colors duration-200 ${
                  active ? 'text-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`h-px w-8 ${active ? 'bg-accent' : 'bg-transparent'}`} />
                {tab.dot && (
                  <span className="absolute right-1 top-0.5 h-1.5 w-1.5 rounded-full bg-accent" />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
