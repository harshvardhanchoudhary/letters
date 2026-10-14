# Letters release guide

## Current state — 14 October 2026

Production release is READY at https://lettersforus.vercel.app. Canonical alias verified against deployment `dpl_B742hK71WFNgcuwj372AiN18gxFn` in project `prj_tNloDuBXRLHPDIoM6mxX6EgqFtNR`.

Published GitHub commit: `c97130229310afdbd0f1d5e0cd1aa336d331d8a5` on `codex/relationship-relaunch`. The connected GitHub API published the source after terminal credentials failed. Its tree `47f10d18bd1e7bac960bf9d71c4724fd81237d7c` exactly matches local tested commit `9ca24ea1173daef29a6e0723d4890f264b75646a`; commit histories differ, so do not force-push local history. GitHub Actions run `38416477703` passed. Existing production branch settings have not been changed; future releases need explicit promotion or production deployment.

Photo migration `letters_photo_member_access` is applied (eight policies); do not rerun it. The bucket is still public pending the user's manual dashboard change: Supabase → Storage → timeline-photos → bucket settings → Public off. Final read-only verification found 69 letters, 2 profiles, 1 postcard and 1 stored photo. Both users still need to verify login and original content on their own devices. Vercel build-log retrieval returned a connector scope 403; deployment READY and canonical alias were verified through their working endpoints.

Rollback deployment: `dpl_CVYAd16ZSBoKFFW2uxKzYnv7ShnU`. Preserve the database on rollback; the old app may not show photos after the bucket becomes private.

Working branch: `codex/relationship-relaunch` in `/Users/harshchoudhary/Documents/ChatGPT/Letters`.

Production URL: https://lettersforus.vercel.app
Supabase project: `djfegrqxxuzwdfllpwgs` (Letters).

Read-only live audit: **69 letters, 2 profiles, 1 postcard, 0 moments**. The relaunch schema is applied. Original data fingerprints matched before and after. The photo bucket privacy cutover remains pending. The Vercel repository mapping and production environment were confirmed before this release.

## 1. Preserve the current state

The ignored local `backups/` directory contains `recovery-2026-10-13.json` (legacy rows and policy/storage metadata) and `original-postcard.jpeg` (original image bytes). It is not a complete Supabase project backup: it does not include authentication secrets or provider configuration. Keep a private copy outside the repository. Never attach these files to a public issue or deploy them.

Before applying SQL, rerun this read-only count query. If the counts changed, refresh the backup first. Record the current Vercel production deployment URL/ID for rollback.

```sql
select
 (select count(*) from public.letters) as letters,
 (select count(*) from public.profiles) as profiles,
 (select count(*) from public.postcards) as postcards,
 (select count(*) from public.moments) as moments;
```

Do not delete users, reset the database, or rerun the historical schema.

## 2. Create a reviewable preview

In Vercel → Letters → Settings → Git, confirm the repository and production branch. Keep `codex/relationship-relaunch` as a preview branch. A push to the production branch may automatically replace the live website; do not merge before the checks below.

Run `npm run check`, `npm run test:e2e` and `npm run preflight` locally. Review `git diff` and verify `.env.local`, backups and browser test traces are excluded before committing. Push only the relaunch branch to the confirmed repository to create the preview.

In Vercel, confirm these environment variables for the intended environment:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`: the existing project's public client settings.
- `ALLOWED_EMAIL_1` and `ALLOWED_EMAIL_2`: the exact existing two users.
- `DISPLAY_NAME_1` and `DISPLAY_NAME_2`: optional display names.
- `SITE_URL`: `https://lettersforus.vercel.app` for production.

No service-role key is needed. Do not paste keys into chat. A preview linked to the production database can write real data when signed in; review only after signing in as an existing member. Use an isolated Supabase staging project for disposable integration testing if available.

In Supabase → Authentication → URL Configuration, keep the production Site URL and add the exact preview callback URL, `https://YOUR-PREVIEW-HOST/auth/callback`, to Redirect URLs. Avoid broad wildcard redirects. Preview code uses `VERCEL_URL`; production uses `SITE_URL`.

## 3. Database addition — applied; do not rerun

The `relationship_relaunch` migration was applied successfully. Do not rerun it. The instructions below document the reviewed behavior.

The script creates the new tables and policies, seeds membership from the existing two profiles, narrows write privileges on sealed letters/postcards, and revokes direct access to the signup trigger function. It contains no row deletion, table deletion or policy deletion. `BEGIN`/`COMMIT` makes the script atomic. A guard stops it if there are not exactly two profiles. It is deliberately not silently rerunnable: on an already-applied schema it should fail instead of hiding drift.

If the dashboard warns about changes, compare the actual highlighted statement with the file. `REVOKE UPDATE` removes a permission; it does not erase content. `GRANT DELETE` and a draft deletion policy allow owners to discard their own drafts; they do not delete rows when the script runs. Do not approve unfamiliar SQL or rerun after an error without checking the result.

Rerun the count query, and confirm all new tables have RLS enabled:

```sql
select tablename, rowsecurity from pg_tables
where schemaname='public' and tablename in
 ('letter_drafts','checkins','checkin_private','library_items','library_notes','plans');
```

All six rows must show `true`. Check Supabase Security Advisor and resolve any new findings before launch. Live checks remain necessary even though the local PostgreSQL suite passes.

## 4. Validate both accounts on the preview

Use two separate browser sessions, one per account.

- Original letters and the original photo are visible. Opening a received letter may set its read timestamp.
- Save a draft, leave the writer, reopen it, and verify its full text. The other user must not see it.
- Save a private cycle check-in and reflection. The other user should see the mood/needs but neither private field. Then explicitly share a separate check-in and confirm visibility.
- Add a book, update progress, save a private note and a shared note. Confirm the other user sees only the shared note. Try an article and a YouTube link.
- Create a plan, change its date, mark it done. Confirm the partner sees it but cannot edit someone else's plan.
- Close and reopen iPhone Safari and revisit the same preview URL. Confirm session persistence. Repeat on production after launch.

These create real records when using the live project. Use meaningful entries; do not send disposable test letters because sealed letters are permanent in the app.

## 5. Switch photo access during the release

The old site uses public photo URLs. The new app normalizes those old URLs and requests signed URLs, preserving the stored paths and original image.

`supabase/photo-access.sql` has been applied; do not rerun it. It limits reads to members, new uploads to each member's own folder, and cleanup to unreferenced uploads. It does not delete objects or change the bucket setting.

When the new deployment is ready to serve production, open Supabase → Storage → `timeline-photos` → bucket settings and turn **Public** off. This is the deliberate privacy cutover. Public download URLs bypass read policies while the bucket remains public; policies alone are insufficient. Old public URLs will stop working after the private switch, so coordinate it with the new app's deployment.

Verify the original photograph loads in a signed-in session, an anonymous public URL fails, and both partners can view a newly uploaded photo. Existing signed URLs remain usable until their one-hour expiry; making the bucket private does not instantly revoke previously issued signed links.

## 6. Publish and monitor

After preview checks, use the confirmed Vercel production workflow to deploy the reviewed commit. Check login, the 69 original letters, original photo, check-ins, library, plans, and mobile navigation. Verify no errors in Vercel logs and Supabase Security Advisor. Never include letter bodies, reflections or auth tokens in diagnostic logs.

## Recovery

If the UI release fails, use Vercel's previous deployment rollback. Keep the additive tables and their data; do not run a destructive down migration. The old app may not display photos once the bucket is private. Prefer fixing forward with signed URL support; do not automatically reopen public access.

If SQL fails before `COMMIT`, stop and inspect the error; the transaction should have rolled back. Confirm tables and counts before retrying. If actual data loss is observed, stop writes, preserve evidence and reconcile the private export against the database. Do not blindly overwrite existing rows from the snapshot, which may be older than new journal entries.

## Known limitations

- Authenticated live workflow and iPhone reopen checks are pending.
- Local database tests simulate Supabase auth/storage schemas; actual Storage API behavior must be verified after cutover.
- The last production dependency audit had zero reported vulnerabilities. Five high findings remain in the development-only ESLint dependency chain; the offered forced fix downgrades the lint stack, so it was not applied blindly.
- There are no demo routes or sample content in the deployed source. All private routes require one of the original accounts.

References: [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [Vercel deployment environments](https://vercel.com/docs/deployments/environments).
