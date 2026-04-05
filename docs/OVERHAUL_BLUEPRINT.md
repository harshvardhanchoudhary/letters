# OVERHAUL BLUEPRINT (V1)

## Product North Star
A two-person private platform that replaces long-form email with a calmer, richer ritual:
- thoughtful writing over fast messaging,
- emotionally expressive check-ins,
- shared memory-building over passive scrolling,
- mobile-first interaction (especially iPhone Safari).

## Chosen Decisions (from latest alignment)
1. Tabs: **Home, Letters, Timeline, Mood, Library**.
2. Privacy model: **shared by default, private notes optional**.
3. Letter open behavior: **hybrid** (focused modal, expandable full-screen).
4. Visual tone (picked for now): **warm cinematic paper** with subtle tactile motion and soft depth.

## Information Architecture
### 1) Home
Purpose: mixed dashboard that answers “what matters right now” at a glance.

Sections:
- **Unread letter spotlight** (single strongest CTA)
- **Latest mood / phase update**
- **Library pulse** (current read + recent note)
- **Timeline memory of the day** (photo/date card)

### 2) Letters
Long-form composition and reading with emotional focus.

Core interactions:
- Open letter in centered “paper focus” modal.
- Drag up / tap expand for full-screen immersive read.
- Keep archival list with better import formatting, typography, and spacing.

### 3) Timeline
Unified stream of shared life entries, chronologically coherent and visual.

Entry types:
- letters
- date photos
- postcards (optional styling, not a standalone mental model)
- moments / milestones
- mood highlights (lightweight)
- book milestones (started/finished)

Priority behaviors:
- chronological unity first
- date photos as major visual anchors
- lightweight filters: All / Photos / Letters / Moments

### 4) Mood
Interactive check-in surface with expressive options.

Model:
- mood state (single select or multi-tag)
- energy
- social battery
- “need from partner”
- **phase** (free + selectable preset, her-centered)
- optional note (shared or private)

### 5) Library
Her reading tracker with optional notes to self or to partner.

Model:
- currently reading
- progress (% or page)
- quote capture
- private reflection note
- optional “note to partner”
- finished list + rating

## Design Language
- Visual identity: warm paper textures, restrained contrast, poetic typography.
- Motion language: subtle and purposeful (sheet rise, fade blur, gentle parallax).
- Mobile ergonomics: thumb-zone CTAs, bottom tab bar, large readable line-height.
- Avoid novelty effects that feel game-like or distract from meaning.

## Session/Auth Hardening Plan (iPhone Safari)
1. Verify Supabase auth cookie persistence and refresh flow.
2. Audit callback handling and cookie domain/path/secure/samesite settings.
3. Ensure middleware refreshes sessions for App Router server components.
4. Add explicit “remembered session” acceptance checks on iOS Safari.
5. Add regression checks for reopen behavior.

## Implementation Sequencing
1. Auth/session reliability fixes.
2. New tab shell + nav scaffold (mobile-first).
3. Home mixed dashboard.
4. Letter read/write redesign + import readability overhaul.
5. Unified timeline engine + date photo anchors.
6. Mood module.
7. Library module.
8. Motion/effects pass.
9. Notifications architecture (deferred to phase 2 implementation).

## Success Metrics (qualitative, v1)
- Can open app repeatedly on iPhone Safari without re-auth every launch.
- Letter reading feels focused and immersive on mobile.
- Timeline feels like “our story,” not an activity feed.
- Mood and Library feel meaningful and used weekly.
