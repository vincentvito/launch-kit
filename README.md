# ClickStudio Starter

The standard Next.js starter for every ClickStudio project. Auth, i18n, database, and UI components — wired up so a fresh clone runs with **zero external services**.

> **Building with an AI agent?** Read [`AGENTS.md`](./AGENTS.md) first. It's the source of truth for stack, conventions, and what not to do.

## Stack

| Tech | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org) | 16 | App Router, RSC |
| [React](https://react.dev) | 19 | UI |
| [TypeScript](https://www.typescriptlang.org) | 5 | Types |
| [Tailwind CSS](https://tailwindcss.com) | 4 | Styling |
| [shadcn/ui](https://ui.shadcn.com) | — | Components |
| [Prisma](https://www.prisma.io) | 7 | ORM (SQLite default, Postgres-ready) |
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

That's it. Open <http://localhost:3000>. SQLite is created automatically on first run; no database server needed.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Run migrations then start Next dev server |
| `npm run build` | Run migrations then build for production |
| `npm run start` | Start the production server |
| `npm run lint` | ESLint |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Wipe and re-seed the local SQLite DB |

## Environment

See [`.env.example`](./.env.example). The defaults work as-is. Notable vars:

- `DATABASE_URL` — defaults to `file:./dev.db` (SQLite). Replace with a `postgres://` URL when graduating to Postgres.
- `BETTER_AUTH_SECRET` — generate with `openssl rand -base64 32` for any non-local environment.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — optional. Leave blank to disable the Google sign-in button locally.
- `OPENAI_API_KEY` — optional for Launch Kit AI generation. If omitted, Launch Kit returns template-based fallback content.
- `OPENAI_MODEL` — optional model override for Launch Kit generation (defaults to `gpt-4.1-mini`).
- `REPLICATE_IMAGE_MODEL` / `REPLICATE_VIDEO_MODEL` — optional model overrides for Launch Kit asset generation (defaults to `google/imagen-4-fast` and `google/veo-3.1-fast`).
- `LAUNCH_KIT_DISCOVERY_PROVIDER` / `LAUNCH_KIT_SEO_DISCOVERY_PROVIDER` — optional discovery providers for lead and backlink search. Leave as `mock` for local seeded results.
- `SERPAPI_API_KEY` — optional. Used only when a discovery provider is set to `serpapi`; otherwise the app falls back to seeded discovery.

## Going to Production

SQLite is for local dev only. Before deploying:

1. Switch Prisma to Postgres (see [`AGENTS.md`](./AGENTS.md) → "Switching SQLite → Postgres").
2. Set all env vars in Vercel (or your platform of choice).
3. `npm run build && npm run start`.

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
