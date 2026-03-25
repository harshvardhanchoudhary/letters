// Auth pages (just /login for now) get a simple centered layout —
// no navigation, no chrome, just the form on the paper background.

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-6">
      {children}
    </div>
  )
}
