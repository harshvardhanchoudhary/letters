"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Mail, Clock, Sparkles, BookHeart } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Letters", href: "/letters", icon: Mail },
  { name: "Timeline", href: "/timeline", icon: Clock },
  { name: "Mood", href: "/mood", icon: Sparkles },
  { name: "Library", href: "/library", icon: BookHeart },
];

export default function FloatingNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50 px-4 pointer-events-none">
      <motion.nav 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="pointer-events-auto flex items-center gap-1 p-2 rounded-full bg-white/40 backdrop-blur-xl border border-white/40 shadow-lg shadow-black/5"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className="relative flex items-center justify-center w-12 h-12 rounded-full text-ink-muted transition-colors hover:text-ink"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-white/60 rounded-full shadow-sm"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <item.icon 
                strokeWidth={isActive ? 2.5 : 1.5} 
                className={clsx("w-5 h-5 relative z-10", isActive ? "text-accent" : "text-ink-muted")} 
              />
            </Link>
          );
        })}
      </motion.nav>
    </div>
  );
}
