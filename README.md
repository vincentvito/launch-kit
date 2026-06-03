# Launch Kit

Launch Kit turns one product URL into the launch materials a founder needs to review, edit, and publish: Product Hunt copy, Show HN, Reddit drafts, story-first X posts, LinkedIn posts, email announcements, media kits, SEO growth ideas, and outreach workflows.

The app is designed to boot locally with no external services, then graduate to a Postgres-backed production deploy once real env vars, billing, auth, and delivery providers are supplied.

> Building with an AI agent? Read [`AGENTS.md`](./AGENTS.md) first. It is the source of truth for stack, conventions, and what not to do in this repository.

## Stack

| Tech | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org) | 16 | App Router, RSC |
| [React](https://react.dev) | 19 | UI |
| [TypeScript](https://www.typescriptlang.org) | 5 | Strict app code |
| [Tailwind CSS](https://tailwindcss.com) | 4 | Styling |
| [shadcn/ui](https://ui.shadcn.com) | - | Components |
| [Prisma](https://www.prisma.io) | 7 | ORM, SQLite local and Postgres production |
| [Better Auth](https://www.better-auth.com) | 1.6 | Email/password auth with optional Google OAuth |
| [next-intl](https://next-intl.dev) | 4 | EN/ES localization |
| [Lucide](https://lucide.dev) | - | Icons |

## Quick Start

Use Node 24. The repo includes `.nvmrc`, `.npmrc`, and `package.json` engines so local, CI, and deploy runtimes stay aligned.

```bash
nvm use
npm install
cp .env.example .env
npm run dev
```

Open <http://localhost:3000>. The default SQLite database is created and migrated automatically by the dev script.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Run Prisma migrations, then start the Next.js dev server |
| `npm run build` | Run Prisma migrations, then build the production bundle |
| `npm run start` | Start the built production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run the Vitest suite |
| `npm run preflight:production` | Check deploy-time production requirements |
| `npm run maintenance:run` | Prune expired rate limits, stale jobs, and old usage events |
| `npm run sample:assets` | Generate sample Launch Kit assets |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset and re-seed the local SQLite database |

CI runs `npm ci`, lint, tests, production build, dependency audit, and a visible production preflight report on pushes to `main` and pull requests.

## Local Defaults

The `.env.example` values are intentionally safe for a fresh clone:

- `DATABASE_URL=file:./dev.db` keeps local dev zero-config.
- `AUTH_ALLOW_PASSWORD_ONLY=true` lets auth work without Google OAuth locally.
- `LAUNCH_KIT_PUBLIC_FREE_ENABLED` defaults to enabled outside production.
- AI provider keys are optional locally; the generator can return deterministic fallback content.
- Outreach delivery is disabled when `OUTREACH_EMAIL_WEBHOOK_URL` is empty, but queued jobs are still tracked.

## Environment

See [`.env.example`](./.env.example) for local defaults and [`.env.production.example`](./.env.production.example) for deploy-time values.

Important production variables:

- `DATABASE_URL` must be a `postgres://` or `postgresql://` connection string.
- `BETTER_AUTH_SECRET` must be a strong secret with at least 32 characters.
- `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` must be public HTTPS production origins, such as `https://your-domain.example`, with no path or query string.
- `OPENAI_API_KEY` or `REPLICATE_API_TOKEN` enables live AI generation.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` enable Google sign-in. If Google is intentionally not used, set `AUTH_ALLOW_PASSWORD_ONLY=true`.
- `BILLING_PROVIDER=manual` plus a strong `BILLING_ADMIN_TOKEN` enables admin-granted premium access before Stripe is live.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_PRICE_ID` enable Stripe billing.
- `OUTREACH_EMAIL_WEBHOOK_URL` and `OUTREACH_EMAIL_WEBHOOK_TOKEN` connect reviewed outreach jobs to a delivery service.
- `LAUNCH_KIT_DISCOVERY_PROVIDER`, `LAUNCH_KIT_SEO_DISCOVERY_PROVIDER`, and optional `SERPAPI_API_KEY` control prospecting/backlink discovery, defaulting to seeded discovery when unset.
- `RATE_LIMIT_*` and `RATE_LIMIT_*_WINDOW_SECONDS` variables override persisted API rate-limit defaults when needed.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` or `CHROME_EXECUTABLE_PATH` can point screenshot asset generation at a host-provided Chromium binary.
- `REPLICATE_DEBUG` and `SAMPLE_ASSET_*` support provider debugging and filtered sample asset generation.
- `MAINTENANCE_*` variables override cleanup retention for queued jobs, completed jobs, and usage events.
- `MAINTENANCE_ADMIN_TOKEN` or `CRON_SECRET` secures the maintenance API route for scheduled cleanup.
- `LAUNCH_KIT_ADMIN_EMAILS` grants manual premium/admin access to comma-separated emails.

## Production Checklist

1. Switch Prisma from SQLite to Postgres:
   - Set `datasource.provider = "postgresql"` in [`prisma/schema.prisma`](./prisma/schema.prisma).
   - Set `provider = "postgresql"` in [`prisma/migrations/migration_lock.toml`](./prisma/migrations/migration_lock.toml).
   - Regenerate migrations against the production-style Postgres database as described in [`AGENTS.md`](./AGENTS.md).
2. Set the required production env vars in Vercel or the target host.
3. Run `npm run preflight:production`.
4. Run `npm run build`.
5. Deploy and verify `/api/health` and `/api/readiness`.
6. On Vercel, set `CRON_SECRET`; `vercel.json` schedules a daily GET to `/api/maintenance`. Other hosts can call `/api/maintenance` with `Authorization: Bearer $MAINTENANCE_ADMIN_TOKEN` or run `npm run maintenance:run`.

SQLite remains the local default by design. It is not suitable for Vercel production.

## Operational Endpoints

- `/api/health` - liveness check without a database dependency.
- `/api/readiness` - database connectivity plus production readiness gates.
- `/api/billing/webhook/stripe` - Stripe webhook endpoint.
- `/api/launch-kit/actions/send-outreach-email` and `/api/launch-kit/actions/send-backlink-emails` - reviewed outreach handoff routes.
- `/api/maintenance` - token-secured maintenance route for cron-triggered cleanup.

## Product Notes

Launch Kit is built around review-first generation. The app produces channel-specific drafts, but users stay in control of what gets published. X generation is intentionally titleless and story-led so posts read like honest build, launch, distribution, or lesson notes rather than sterile promo copy.

Signed-in users can keep up to 50 saved cloud projects. The dashboard includes project deletion so users can clear space before saving more.

## Project Structure

```text
app/                    Next.js App Router pages and API routes
  api/                  Auth, billing, health, readiness, and Launch Kit API routes
  auth/login/           Login page
  dashboard/            Launch Kit workspace
  changelog/            Product changelog
components/             App components
  ui/                   shadcn primitives
i18n/                   next-intl config
lib/
  auth.ts               better-auth server config
  auth-client.ts        better-auth client hooks
  env.ts                Runtime and production-readiness checks
  launch-kit/           Generator, exporters, persistence, billing, and growth logic
  prisma.ts             Prisma singleton
messages/               EN/ES translation files
prisma/
  schema.prisma         Database schema
  migrations/           Tracked migrations
scripts/                Production preflight and utility scripts
tests/                  Vitest coverage for production-critical behavior
```

## License

MIT - see [`LICENSE`](./LICENSE).
