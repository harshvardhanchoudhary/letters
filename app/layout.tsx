// LEARN: This is the root layout — it wraps every single page in the app.
// We load the font here once so it's available everywhere.
// next/font/google downloads the font at build time and self-hosts it,
// meaning no request goes to Google at runtime (faster + privacy-respecting).

import type { Metadata } from 'next'
import { EB_Garamond } from 'next/font/google'
import './globals.css'

const garamond = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-garamond',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'letters',
  description: 'A private space for two.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={garamond.variable}>
      <body className="font-garamond bg-paper text-ink antialiased">
        {children}
      </body>
    </html>
  )
}
