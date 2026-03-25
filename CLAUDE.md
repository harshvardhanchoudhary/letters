# letters — project guide for Claude

## What this is
A private, two-person digital space for letters, music, photos, a shared bookshelf,
a commonplace book, and a timeline. Built for two people only. Feels intentional,
calm, and unlike any chat app.

## Before every commit — always run these
```
npm run typecheck   # catches type errors before they reach production
npm run lint        # catches code style issues
```
If either fails, fix it before committing. Never commit broken code.

## Core product rules
- Preserve the feeling of letter-writing — never make it feel like texting
- No real-time features: no typing indicators, no "online now", no read receipts with timestamps
- Letters are permanent — never add a delete feature for letters
- No feature should weaken anticipation, rereading, or emotional weight
- Two users only — never build for scale or multi-tenancy

## Architecture
- **Framework**: Next.js 15 App Router
- **Database + Auth**: Supabase (magic link auth, Row Level Security on all tables)
- **Styling**: Tailwind CSS with custom design tokens (see globals.css + tailwind.config.ts)
- **Font**: EB Garamond (self-hosted via next/font)
- **Deployment**: Vercel (auto-deploys on push to main)

## Colour palette (never hardcode colours — use these tokens)
- `bg-paper` / `text-ink` — primary surface and text
- `text-ink-muted` — secondary text
- `text-ink-faint` — timestamps, labels
- `text-accent` / `bg-accent` — terracotta highlight
- `border` / `border-dark` — dividers

## Folder structure
```
app/
  (auth)/login/        — login page (magic link)
  (main)/              — all authenticated pages
    page.tsx           — home
    letters/           — list, write, [id]
  actions/             — server actions (auth, letters, ...)
  auth/callback/       — magic link callback route
lib/supabase/          — browser + server clients
types/database.ts      — shared TypeScript types
supabase/schema.sql    — full database schema (run in Supabase SQL editor)
```

## Two-person access control
Allowed emails live in env vars: `ALLOWED_EMAIL_1` and `ALLOWED_EMAIL_2`.
Display names: `DISPLAY_NAME_1` and `DISPLAY_NAME_2`.
These are server-side only — never prefixed with NEXT_PUBLIC_.

## Phase tracker
- [x] Phase 1 — Auth + Letters (write, list, read)
- [ ] Phase 2 — Timeline + Postcards
- [ ] Phase 3 — Bookshelf + Commonplace Book + Private notes
- [ ] Phase 4 — Music embeds, "Currently" cards, Chapter markers
- [ ] Phase 5 — Design polish

## Known Supabase setup requirements
1. Run `supabase/schema.sql` in the SQL editor
2. Set Site URL in Auth → URL Configuration
3. Add `/auth/callback` to Redirect URLs
4. Magic link emails are sent by Supabase — no extra email setup needed
