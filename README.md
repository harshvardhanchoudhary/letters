# Letters

A private journal for two people: letters, a shared timeline, check-ins, a reading and discussion library, and plans together.

## Local development

Use Node.js 24 and `npm ci`. Copy `.env.example` to `.env.local` and fill in your own settings. Never commit `.env.local` or `backups/`.

```sh
npm run dev
```

Visit `http://127.0.0.1:3000/login`. All journal routes require one of the two existing accounts. There are no public sample routes or fictional entries. Names and history are loaded from the existing Supabase project.

## Checks

```sh
npm run check
npx playwright install chromium webkit
npm run test:e2e
npm run preflight
```

`check` runs TypeScript, ESLint, unit and local PostgreSQL privacy tests, then a production build. Browser tests verify sign-in boundaries on desktop Chromium and iPhone-sized WebKit. Authenticated interaction checks require a real user session. GitHub Actions runs the same checks on pull requests and pushes to `main` and `codex/**`.

The database suite uses isolated PGlite with synthetic users and the legacy schema. It runs the actual relaunch SQL and verifies private data, sealed letters, membership and photo policies. It never connects to Supabase. It does not replace authenticated testing on the actual deployment.

## Features

- **Letters:** searchable archive, focused reader, expanded reading mode, manual draft saving and confirmation before sealing.
- **Our story:** unified letters, photos and milestones. New uploads strip image metadata and use signed image URLs.
- **Check-in:** mood, energy, needs and free-form life phase. Optional self-reported cycle and reflections remain private unless explicitly shared. No cycle predictions.
- **Library:** book progress, articles and YouTube links, with private notes by default and shared discussion when chosen. Links open at their source; third-party embeds are not loaded.
- **Together:** ideas filtered by energy, optional dates, editable scheduling and completion status.

## Release and recovery

Follow [the release guide](docs/RELEASE.md). Existing production data must be retained. **Do not rerun `supabase/schema.sql` on the existing project**: it is the historical schema used by the local test fixture.

`supabase/relaunch.sql` and `supabase/photo-access.sql` are reviewed one-time transactional release scripts, not automatically applied migrations. The relationship_relaunch migration has been applied and original row fingerprints matched before and after. Photo policy application and bucket privacy cutover are tracked in the release guide. No app startup or CI job applies database changes.

See [the current worklog](docs/OVERHAUL_WORKLOG.md) for verified status and remaining steps.

