import { requireUser } from "@/lib/session";
import { displayName } from "@/lib/access";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { MainTabBar } from "./MainTabBar";
export const dynamic = "force-dynamic";
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user } = await requireUser();
  const [{ data: profiles }, { count }] = await Promise.all([
    supabase.from("profiles").select("id,email,display_name"),
    supabase
      .from("letters")
      .select("id", { count: "exact", head: true })
      .eq("to_id", user.id)
      .is("read_at", null),
  ]);
  const names =
    profiles?.map((p) => displayName(p.email, p.display_name)).join(" & ") ||
    "A space for two";
  return (
    <div className="journal-shell">
      <a className="skip-link" href="#main">
        Skip to journal
      </a>
      <header className="masthead">
        <Link href="/" className="wordmark">
          letters<span className="wordmark-dot">.</span>
        </Link>
        <span className="masthead-names">{names}</span>
        <form action={signOut}>
          <button className="quiet-button">Sign out ↗</button>
        </form>
      </header>
      <MainTabBar unreadCount={count || 0} />
      <main id="main" className="journal-main">
        {children}
      </main>
      <footer className="journal-footer">
        <span>FOR THE TWO OF YOU</span>
        <span>A little more of us, every day.</span>
      </footer>
    </div>
  );
}
