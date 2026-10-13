# OVERHAUL WORKLOG

## Purpose
Rebuild **letters** into a mobile-first, emotionally intentional platform for two people only, designed to replace long-form email exchange with a more meaningful shared space.

## Context from user
- Current product feels too basic and not cohesive.
- Wants fresh IA/tabs/features based on relationship context (not constrained by current implementation).
- Needs significantly better phone UX (primary use: iPhone Safari).
- Auth currently works but session persistence feels broken (requires repeatedly opening magic links).
- Wants thoughtful effects/interaction design throughout.
- Wants improved timeline, including date photos.
- Wants a mood system with many options, including “Phase” for her self-expression.
- Wants a personal reading tracker for her with notes.
- Wants all work tracked and updated continuously in this file.
- Wants iterative decision-making with frequent questions.

## Decisions captured (2026-04-03)
- Home screen direction: **mixed dashboard**.
- Letters opening style: **hybrid approach selected** (assistant to choose specifics).
- Mood: rich/interactive with many options + includes **Phase**.
- Timeline priorities: 
  1. unified stream (letters + photos + other entries)
  2. date photos as anchors
  3. remaining priorities to be proposed
- Session issue observed on: **iPhone Safari**.
- Session symptom: opening `lettersforus` often requires following magic link again.

## Proposed next execution phases
1. Product blueprint (new IA + feature set + emotional design principles).
2. Authentication/session hardening for iPhone Safari.
3. Mobile-first navigation + core screen shells.
4. New timeline engine + date photo anchors.
5. Letters reading experience (focused open interaction).
6. Mood + Phase interactive module.
7. Reading tracker module (private-to-her + optional notes-to-you).
8. Effects/motion pass (purposeful, lightweight).
9. Notifications architecture plan (deferred implementation path).
10. QA, tests, regression hardening.

## Open questions to resolve next
- Final top-level tab set (max 5) for v1.
- Privacy boundaries: what parts of Mood/Books are private vs shared.
- Notifications priority and style (push vs email digest vs in-app).
- Visual tone direction reference set (3 concrete examples).

---
_Last updated: 2026-04-04 (UTC)_


## Decisions captured (2026-04-04)
- Selected recommended options for architecture and privacy as baseline for implementation.
- Tabs set to: **Home, Letters, Timeline, Mood, Library**.
- Privacy set to: **shared by default, private notes optional**.
- Letter open interaction accepted: **hybrid focused modal + full-screen expansion**.
- Visual direction chosen for now: **warm cinematic paper**.
- Added `docs/OVERHAUL_BLUEPRINT.md` as the execution blueprint for build steps.


## Implementation status
- Total planned phases: **10**.
- Completed phases: **2/10** (Phase 1 blueprint + Phase 2 auth/session hardening).
- Current phase: **Phase 3 — Mobile-first navigation + core screen shells**.
- Remaining phases until full implementation: **8**.


### Progress update (2026-04-04)
- Started engineering implementation with authentication/session reliability improvements.
- Added shared Supabase cookie configuration to strengthen session persistence behavior.
- Updated auth callback to support both `code` and `token_hash` magic-link flows.
- Improved sign-in redirect URL derivation to avoid unstable origin detection.
- Next: verify behavior on iPhone Safari and then move to Phase 3 shell/navigation.


### Verification update (2026-04-04)
- User confirmed one successful reopen test after sign-in (new tab reopen worked).
- Per agreed rule, Phase 2 is marked complete after one successful reopen test.
- Next active build phase is Phase 3 (mobile-first nav/shell implementation).

### Build update (2026-04-04, later)
- Implemented a new mobile-first shell with sticky header + fixed bottom tab bar.
- Replaced tab model with: Home, Letters, Timeline, Mood, Library.
- Redesigned Home into card-based mixed dashboard prioritizing:
  1) unread letter spotlight, 2) latest mood/phase snapshot.
- Added first Mood surface (`/mood`) with explicit shared `phase` + interactive option chips and persisted check-in save flow.
- Added Library scaffold route (`/library`) to complete navigation architecture and prepare for reading tracker implementation.
- Phase status update: **Phase 3 completed** (mobile shell/navigation + home in same pass). Active next phase: timeline + letters experience refresh.

### Build update (2026-04-04, evening)
- Implemented letters list focused-open interaction: tap opens centered paper modal with subtle blur backdrop.
- Added drag/expand behavior on mobile for letter modal to move toward immersive reading.
- Implemented timeline "photo days" hero cards: each day with postcards/photos now renders a visual hero card above the timeline track.
- User preference captured: phase options are free-typed by her (not fixed presets).
- Next expected focus: refine full-screen letter reading polish and timeline filters.

## Relaunch update — 2026-10-13 (supersedes earlier phase counts)

The working branch is now in `/Users/harshchoudhary/Documents/ChatGPT/Letters`; the audited Desktop copy remains preserved.

Implemented five complete local surfaces: Letters, Our story, Check-in, Library and Together. Warm paper/terracotta design, responsive navigation, focused letter reading, manual drafts, metadata-stripped photo uploads, optional private cycle/reflection data, book progress, saved video/article discussions and editable plans. Added fictional `/demo` routes for review without personal data.

Authentication uses validated Supabase users and a two-email allowlist. Cookie refresh is preserved through redirects. The relaunch database scripts add membership and privacy policies, retaining legacy data. A separate photo policy script and manual bucket privacy cutover are prepared.

Verified: TypeScript, ESLint, production build, five tests including an isolated PostgreSQL privacy integration test, and 16 browser tests across Chromium and iPhone WebKit. Desktop and mobile screenshots reviewed. Local servers bind only to 127.0.0.1. GitHub Actions, environment template and `docs/RELEASE.md` added.

Live read-only audit still shows 69 letters, 2 profiles, 1 postcard, 0 moments, no checkins table, public photo bucket. Private recovery row export and original photograph are stored under ignored `backups/`. This is not a full authentication/provider backup.

Remaining: confirm Vercel Git mapping and production branch; commit/push reviewed source to preview; manually apply the reviewed SQL; verify actual two-account behavior and Safari reopening; coordinate private photo bucket and production release. Neither migration nor deployment has been performed. User requested manual account/production steps for learning, and desktop control is disabled.


## Personal app release — 2026-10-14

User explicitly rejected a generic/demo experience. Removed every demo route, fictional fixture, stock photo, sample link and demo save bypass. Real names now lead the home page and writer; the first original letter dates the shared history; library filters distinguish each person's finds; check-ins name the actual partner. Personal names and history remain private runtime data, never checked into source.

New interaction design: charcoal navigation, real photo backdrop, envelope inbox, conversation prompts, random letter rediscovery, timeline year chapters, a browsable bookshelf, energy-linked care suggestions, date idea picker and shared calendar.

Database `relationship_relaunch` applied successfully. Original row fingerprints before/after were identical for 69 letters, 2 profiles and 1 postcard; moments remain empty. All six new tables have RLS enabled. Security Advisor reports intentionally closed private.members plus the existing leaked-password protection warning. Local PostgreSQL tests verify member/outsider boundaries and private notes/drafts/cycle data.

Vercel confirmed: project prj_tNloDuBXRLHPDIoM6mxX6EgqFtNR owns lettersforus.vercel.app. Original alias deployment dpl_CVYAd16ZSBoKFFW2uxKzYnv7ShnU retained as rollback reference. Explicit team-slug lookup failed but project-ID lookup through the connected account succeeded. Production SITE_URL configured to the existing website. Deployment still pending at this checkpoint.

The earlier 26 UI tests passed before demo removal. Current automated browser suite tests real login boundaries; do not report the older suite as authenticated production verification. Real two-account save/reopen checks remain necessary.

Release checkpoint: the real-app build, lint, typecheck and five unit/database tests pass. Six browser checks pass across desktop Chromium and iPhone WebKit, including login layouts at 320, 375, 768 and 1366 pixels. The complete earlier interaction suite passed before public fixture routes were removed; real authenticated-device verification remains pending. Sign-in now uses shouldCreateUser:false for the existing two accounts.

Local implementation committed. Git push was blocked by automatic approval review because the existing GitHub repository is public and requires explicit approval to publish the source. The user has been asked; do not bypass that rejection through another Git publishing mechanism. No source push or new production deployment has occurred. Vercel's existing project and alias have been verified through the connected account, and production SITE_URL was added. Photo privacy cutover remains pending deployment.
