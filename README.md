# ClickStudio Starter

The standard Next.js starter for every ClickStudio project. Auth, i18n, database, and UI components — wired for Supabase Postgres in local development and production.

> **Building with an AI agent?** Read [`AGENTS.md`](./AGENTS.md) first. It's the source of truth for stack, conventions, and what not to do.

## Stack

| Tech | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org) | 16 | App Router, RSC |
| [React](https://react.dev) | 19 | UI |
| [TypeScript](https://www.typescriptlang.org) | 5 | Types |
| [Tailwind CSS](https://tailwindcss.com) | 4 | Styling |
| [shadcn/ui](https://ui.shadcn.com) | — | Components |
| [Prisma](https://www.prisma.io) | 7 | ORM (Postgres/Supabase) |
| [Better Auth](https://www.better-auth.com) | 1.4 | Auth (email/password + optional Google OAuth) |
| [next-intl](https://next-intl.dev) | 4 | i18n (EN/ES included) |
| [Lucide](https://lucide.dev) | — | Icons |

## Quick Start

```bash
gh repo create my-app --template clickstudio/clickstudio-starter --private --clone
cd my-app
npm install
cp .env.example .env
npm run dev
```

Set `DATABASE_URL` and `DIRECT_URL` in `.env` before running `npm run dev`. Open <http://localhost:3000> after migrations finish.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Run migrations then start Next dev server |
| `npm run build` | Run migrations then build for production |
| `npm run start` | Start the production server |
| `npm run lint` | ESLint |
| `npm run preflight:production` | Check required production env and provider readiness |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset the configured Postgres database |

## Environment

See [`.env.example`](./.env.example). Database vars must point at the same Postgres database:

- `WAITING_LIST_ENABLED` — set to `true` in production to show a waitlist page at `/` instead of the full landing page. Leave unset locally so the landing page renders by default.
- `DATABASE_URL` — pooled Supabase/Postgres runtime URL. For Supabase, use the transaction pooler on port `6543` with `pgbouncer=true&connection_limit=1`.
- `DIRECT_URL` — direct/session Supabase/Postgres URL for Prisma migrations. For Supabase, use port `5432`; set this in Vercel too because `npm run build` runs `prisma migrate deploy`.
- `BETTER_AUTH_SECRET` — generate with `openssl rand -base64 32` for any non-local environment.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — optional. Leave blank to disable the Google sign-in button locally.
- `OPENAI_API_KEY` — optional for Launch Kit AI generation. If omitted, Launch Kit returns template-based fallback content.
- `OPENAI_MODEL` — optional model override for Launch Kit generation (defaults to `gpt-4.1-mini`).
- `REPLICATE_IMAGE_MODEL` / `REPLICATE_VIDEO_MODEL` — optional model overrides for Launch Kit asset generation (defaults to `google/imagen-4-fast` and `google/veo-3.1-fast`).
- `LAUNCH_KIT_DISCOVERY_PROVIDER` / `LAUNCH_KIT_SEO_DISCOVERY_PROVIDER` — optional discovery providers for lead and backlink search. Leave as `seeded` for local deterministic results.
- `SERPAPI_API_KEY` — optional. Used only when a discovery provider is set to `serpapi`; otherwise the app falls back to seeded discovery.
- `LAUNCH_KIT_PUBLIC_FREE_ENABLED` — enables anonymous free URL ingest/generation. Defaults to enabled locally and disabled in production.
- `LAUNCH_KIT_ADMIN_EMAILS` — comma-separated emails that receive premium/admin entitlement without billing.
- `RATE_LIMIT_*` — optional overrides for persisted API rate limits.
- `BILLING_PROVIDER` — set to `manual` for admin-granted premium during private production before Stripe is configured.
- `BILLING_ADMIN_TOKEN` — strong bearer token for the manual entitlement endpoint; required when `BILLING_PROVIDER=manual`.
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `STRIPE_PRICE_ID` — Stripe checkout, portal, and webhook configuration.
- `OUTREACH_EMAIL_WEBHOOK_URL` / `OUTREACH_EMAIL_WEBHOOK_TOKEN` — optional server-to-server webhook for real outreach delivery. Without it, outreach remains a tracked no-delivery workflow.

## Going to Production

1. Set `DATABASE_URL` and `DIRECT_URL` in Vercel. `DATABASE_URL` may use the Supabase pooler; `DIRECT_URL` must be the direct/session connection used by Prisma migrations.
2. Set the required auth, app URL, AI, billing, and optional OAuth env vars.
3. Run `npm run preflight:production`.
4. `npm run build && npm run start`.

The production API surface includes persisted rate limiting, usage events, plan entitlement checks, Stripe-ready billing routes, and admin-granted manual premium entitlement for private launches before billing keys are present.

Operational endpoints:

- `/api/health` — liveness check with no database dependency.
- `/api/readiness` — readiness check for database connectivity and production env gates.

## Project Structure

```
app/                    Next.js App Router pages and API routes
  api/auth/[...all]/    better-auth handler
  auth/login/           Login page
  dashboard/            Protected dashboard
  changelog/            Changelog
components/             App components
  ui/                   shadcn primitives
i18n/                   next-intl config
lib/
  auth.ts               better-auth server config
  auth-client.ts        better-auth client hooks
  prisma.ts             Prisma singleton
messages/               Translation files (en, es)
prisma/
  schema.prisma         Database schema
  migrations/           Tracked migrations
```

## Updating the Starter

This repo is a **GitHub Template Repository**. Downstream apps are independent clones — updates here do not flow into them automatically. That's intentional: shipped projects shouldn't churn because the template moved.

To pull a future improvement into an existing app, cherry-pick the commit by hand.

## License

MIT — see [`LICENSE`](./LICENSE).
