"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const tabs = [
  ["/letters", "Letters", "✉"],
  ["/timeline", "Our story", "◷"],
  ["/mood", "Check-in", "☼"],
  ["/library", "Library", "▤"],
  ["/together", "Together", "✧"],
];
export function MainTabBar({ unreadCount = 0 }: { unreadCount?: number }) {
  const path = usePathname();
  return (
    <nav className="journal-nav" aria-label="Journal">
      <div>
        {tabs.map(([href, label, icon]) => (
          <Link
            key={href}
            href={href}
            aria-current={path.startsWith(href) ? "page" : undefined}
          >
            <span aria-hidden="true" className="nav-icon">
              {icon}
            </span>
            <span>{label}</span>
            {href === "/letters" && unreadCount > 0 && (
              <span
                className="unread-dot"
                aria-label={`${unreadCount} unread letters`}
              />
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
