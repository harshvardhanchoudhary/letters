"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Mail, Clock, Sparkles, BookHeart } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Utility for clean tailwind class merging */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FloatingNavProps {
  unreadCount: number;
}

export default function FloatingNav({ unreadCount }: FloatingNavProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: Home, count: 0 },
    { name: "Letters", href: "/letters", icon: Mail, count: unreadCount },
    { name: "Timeline", href: "/timeline", icon: Clock, count: 0 },
    { name: "Mood", href: "/mood", icon: Sparkles, count: 0 },
    { name: "Library", href: "/library", icon: BookHeart, count: 0 },
  ];

  return (
    <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50 px-4 pointer-events-none">
      <motion.nav 
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="pointer-events-auto flex items-center gap-2 p-2 rounded-full bg-paper/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className="relative flex items-center justify-center w-12 h-12 rounded-full transition-colors group"
              aria-label={item.name}
            >
              {/* Active Background Bubble */}
              {isActive && (
                <motion.div
                  layoutId="active-nav-pill"
                  className="absolute inset-0 bg-white/80 rounded-full shadow-sm"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              
              {/* Icon */}
              <item.icon 
                strokeWidth={isActive ? 2.5 : 1.5} 
                className={cn(
                  "w-[22px] h-[22px] relative z-10 transition-colors duration-300", 
                  isActive ? "text-accent" : "text-ink-muted group-hover:text-ink"
                )} 
              />

              {/* Unread Indicator Dot */}
              {item.count > 0 && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2.5 w-2 h-2 bg-accent rounded-full border border-paper z-20 shadow-sm"
                />
              )}
            </Link>
          );
        })}
      </motion.nav>
    </div>
  );
}
