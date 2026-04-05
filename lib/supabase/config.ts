export function getSiteUrlFromEnv(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL

  if (!raw) return null

  const withProtocol = raw.startsWith('http://') || raw.startsWith('https://')
    ? raw
    : `https://${raw}`

  return withProtocol.replace(/\/$/, '')
}

export function getCookieOptions() {
  return {
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  }
}
