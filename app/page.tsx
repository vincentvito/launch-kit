import { getTranslations, getLocale } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import {
  Shield,
  Globe,
  Database,
  Layers,
  ArrowRight,
  Sparkles,
  Check,
  Zap,
  Rocket,
  Terminal,
  Code2,
} from 'lucide-react'

export default async function LandingPage() {
  const t = await getTranslations('Landing')
  const locale = await getLocale()

  const stackItems = [
    { name: 'Next.js 16', color: 'from-zinc-500 to-zinc-700 dark:from-zinc-300 dark:to-zinc-500' },
    { name: 'React 19', color: 'from-sky-400 to-sky-600 dark:from-sky-300 dark:to-sky-500' },
    { name: 'TypeScript', color: 'from-blue-500 to-blue-700 dark:from-blue-300 dark:to-blue-500' },
    { name: 'Tailwind CSS v4', color: 'from-teal-400 to-teal-600 dark:from-teal-300 dark:to-teal-500' },
    { name: 'Prisma ORM', color: 'from-indigo-500 to-indigo-700 dark:from-indigo-300 dark:to-indigo-500' },
    { name: 'Better Auth', color: 'from-emerald-500 to-emerald-700 dark:from-emerald-300 dark:to-emerald-500' },
    { name: 'PostgreSQL', color: 'from-blue-600 to-blue-800 dark:from-blue-300 dark:to-blue-500' },
    { name: 'shadcn/ui', color: 'from-zinc-600 to-zinc-800 dark:from-zinc-300 dark:to-zinc-500' },
  ]

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* ===== SVG Filters ===== */}
      <svg className="pointer-events-none fixed h-0 w-0" aria-hidden="true">
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>

      {/* ===== Background Atmosphere ===== */}

      {/* Noise texture */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-[0.025] mix-blend-overlay dark:opacity-[0.06]"
        style={{ filter: 'url(#grain)' }}
      />

      {/* Dot grid pattern */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.35] dark:opacity-[0.12]"
        style={{
          backgroundImage:
            'radial-gradient(circle at center, oklch(0.55 0.2 178 / 0.15) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Large floating gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-[600px] w-[600px] animate-float-1 rounded-full bg-gradient-to-br from-teal-500/[0.12] to-cyan-400/[0.08] blur-[100px] dark:from-teal-400/[0.2] dark:to-cyan-400/[0.12]" />
        <div className="absolute -bottom-48 -left-48 h-[500px] w-[500px] animate-float-2 rounded-full bg-gradient-to-tr from-amber-400/[0.08] to-orange-400/[0.06] blur-[100px] dark:from-amber-400/[0.12] dark:to-orange-400/[0.08]" />
        <div className="absolute top-1/2 left-1/3 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 animate-float-3 rounded-full bg-gradient-to-br from-sky-400/[0.06] to-teal-400/[0.04] blur-[90px] dark:from-sky-400/[0.1] dark:to-teal-400/[0.06]" />
      </div>

      {/* ===== Navigation ===== */}
      <nav className="fixed top-0 right-0 left-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-teal-600 shadow-md shadow-primary/20 dark:to-teal-300">
              <Zap className="h-4 w-4 text-white dark:text-black" />
            </div>
            <span className="text-base font-bold tracking-tight">
              {t('nav.brand')}
            </span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('nav.features')}
            </a>
            <a
              href="#stack"
              className="text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('nav.stack')}
            </a>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher currentLocale={locale} />
            <Link
              href="/auth/login"
              className="hidden text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              {t('nav.signIn')}
            </Link>
            <Button size="sm" asChild className="shadow-md shadow-primary/20">
              <Link href="/dashboard">
                {t('nav.getStarted')}
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ===== Hero Section ===== */}
      <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-24 lg:pt-44 lg:pb-28">
        {/* Hero gradient wash */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-teal-500/[0.04] via-transparent to-transparent dark:from-teal-400/[0.06]" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
            {/* Left: Text */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="animate-fade-up relative mb-8 inline-flex items-center gap-2 overflow-hidden rounded-full border border-primary/25 bg-primary/[0.07] px-4 py-1.5 shadow-sm">
                <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
                <Sparkles className="relative h-3.5 w-3.5 text-primary" />
                <span className="relative text-xs font-semibold tracking-wide text-primary">
                  {t('hero.badge')}
                </span>
              </div>

              {/* Headline */}
              <h1
                className="animate-fade-up font-extrabold tracking-[-0.04em]"
                style={{
                  fontSize: 'clamp(2.75rem, 5vw + 1rem, 5.25rem)',
                  lineHeight: 1.05,
                  textWrap: 'balance',
                  animationDelay: '100ms',
                }}
              >
                {t('hero.title')}{' '}
                <span
                  className="animate-text-shimmer bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      'linear-gradient(90deg, oklch(0.6 0.22 170), oklch(0.65 0.2 190), oklch(0.75 0.18 80), oklch(0.65 0.2 170), oklch(0.6 0.22 170))',
                    WebkitBackgroundClip: 'text',
                    backgroundSize: '200% auto',
                  }}
                >
                  {t('hero.titleHighlight')}
                </span>
              </h1>

              {/* Description */}
              <p
                className="animate-fade-up mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0"
                style={{ animationDelay: '200ms' }}
              >
                {t('hero.description')}
              </p>

              {/* CTA */}
              <div
                className="animate-fade-up mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
                style={{ animationDelay: '300ms' }}
              >
                <Button
                  size="lg"
                  asChild
                  className="w-full shadow-lg shadow-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/40 sm:w-auto"
                >
                  <Link href="/dashboard">
                    <Rocket className="mr-2 h-4 w-4" />
                    {t('hero.cta')}
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="w-full border-border/60 sm:w-auto"
                >
                  <Link href="#features">
                    {t('hero.ctaSecondary')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right: Terminal */}
            <div
              className="animate-fade-up relative"
              style={{ animationDelay: '400ms' }}
            >
              {/* Glow behind terminal */}
              <div className="animate-pulse-glow absolute -inset-8 rounded-3xl bg-gradient-to-br from-teal-500/25 via-cyan-500/15 to-amber-500/10 blur-3xl" />

              {/* Terminal with 3D tilt */}
              <div
                className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c0c] shadow-2xl shadow-black/30"
                style={{
                  transform:
                    'perspective(1200px) rotateX(3deg) rotateY(-3deg)',
                }}
              >
                {/* Header */}
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-3.5">
                  <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                  <span className="ml-3 font-mono text-xs text-white/25">
                    ~/my-next-app
                  </span>
                </div>

                {/* Body */}
                <div className="px-5 py-6 font-mono text-sm leading-relaxed">
                  <div className="flex items-center gap-2">
                    <span className="text-teal-400">{'\u2192'}</span>
                    <span className="text-white/80">
                      npx create-next-app --use-starter
                    </span>
                  </div>
                  <div className="mt-5 space-y-2.5 text-white/50">
                    <div className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-400" />
                      <span>{t('hero.terminal.auth')}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-400" />
                      <span>{t('hero.terminal.i18n')}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-400" />
                      <span>{t('hero.terminal.database')}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-400" />
                      <span>{t('hero.terminal.ui')}</span>
                    </div>
                  </div>
                  <div className="mt-6 border-t border-white/[0.04] pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-teal-400">{'\u2192'}</span>
                      <span className="text-white/80">npm run dev</span>
                    </div>
                    <div className="mt-2 text-emerald-400 font-medium">
                      {t('hero.terminal.ready')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Gradient Divider ===== */}
      <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>

      {/* ===== Features: Bento Grid ===== */}
      <section id="features" className="scroll-reveal relative py-24 sm:py-32">
        {/* Hexagonal / honeycomb SVG pattern */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
            <defs>
              <pattern
                id="hex-pattern"
                width="56"
                height="100"
                patternUnits="userSpaceOnUse"
                patternTransform="scale(1.2)"
              >
                <path
                  d="M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
                <path
                  d="M28 0L28 34L0 50L0 84L28 100L56 84L56 50L28 34"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="url(#hex-pattern)"
              className="text-primary/[0.025] dark:text-primary/[0.04]"
            />
          </svg>
          {/* Radial fade so pattern is strongest in center */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, var(--background) 100%)',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          {/* Section header */}
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.05] px-3.5 py-1 text-sm font-medium text-primary">
              <Code2 className="h-3.5 w-3.5" />
              {t('features.label')}
            </div>
            <h2
              className="text-3xl font-bold tracking-tight sm:text-5xl"
              style={{ textWrap: 'balance' }}
            >
              {t('features.title')}
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              {t('features.description')}
            </p>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-6">
            {/* Auth — spans 4 cols */}
            <div
              className="bento-card group p-8 md:col-span-4"
              style={{ '--card-accent': 'oklch(0.55 0.2 178 / 0.5)' } as React.CSSProperties}
            >
              <div className="relative">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/15 to-teal-500/5 text-teal-600 ring-1 ring-teal-500/10 dark:text-teal-400">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="mb-2.5 text-xl font-bold">
                  {t('features.auth.title')}
                </h3>
                <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
                  {t('features.auth.description')}
                </p>

                {/* Code preview */}
                <div className="mt-6 overflow-hidden rounded-lg border border-white/[0.06] bg-[#0c0c0c]">
                  <div className="flex items-center gap-1.5 border-b border-white/[0.04] px-3 py-2">
                    <div className="h-2 w-2 rounded-full bg-white/10" />
                    <div className="h-2 w-2 rounded-full bg-white/10" />
                    <div className="h-2 w-2 rounded-full bg-white/10" />
                    <span className="ml-2 font-mono text-[10px] text-white/20">auth-client.ts</span>
                  </div>
                  <div className="px-4 py-3 font-mono text-[11px] leading-relaxed">
                    <div>
                      <span className="text-teal-400">import</span>
                      <span className="text-white/60">{' { useSession } '}</span>
                      <span className="text-teal-400">from</span>
                      <span className="text-amber-400">{" '@/lib/auth-client'"}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-teal-400">const</span>
                      <span className="text-white/60">{' { data: session } = useSession()'}</span>
                    </div>
                    <div className="mt-2 text-white/20">{'// \u2713 Ready to use'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* i18n — spans 2 cols */}
            <div
              className="bento-card group p-8 md:col-span-2"
              style={{ '--card-accent': 'oklch(0.6 0.18 220 / 0.5)' } as React.CSSProperties}
            >
              <div className="relative">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/15 to-sky-500/5 text-sky-600 ring-1 ring-sky-500/10 dark:text-sky-400">
                  <Globe className="h-5 w-5" />
                </div>
                <h3 className="mb-2.5 text-lg font-bold">
                  {t('features.i18n.title')}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t('features.i18n.description')}
                </p>

                {/* Language pills */}
                <div className="mt-6 flex gap-2">
                  <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-600 ring-1 ring-sky-500/15 dark:text-sky-400">EN</span>
                  <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-600 ring-1 ring-sky-500/15 dark:text-sky-400">ES</span>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">+</span>
                </div>
              </div>
            </div>

            {/* Database — spans 2 cols */}
            <div
              className="bento-card group p-8 md:col-span-2"
              style={{ '--card-accent': 'oklch(0.7 0.16 80 / 0.5)' } as React.CSSProperties}
            >
              <div className="relative">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 text-amber-600 ring-1 ring-amber-500/10 dark:text-amber-400">
                  <Database className="h-5 w-5" />
                </div>
                <h3 className="mb-2.5 text-lg font-bold">
                  {t('features.database.title')}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t('features.database.description')}
                </p>

                {/* DB indicator */}
                <div className="mt-6 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                  <span className="font-mono text-[11px] text-muted-foreground">PostgreSQL connected</span>
                </div>
              </div>
            </div>

            {/* UI Components — spans 4 cols */}
            <div
              className="bento-card group p-8 md:col-span-4"
              style={{ '--card-accent': 'oklch(0.6 0.18 160 / 0.5)' } as React.CSSProperties}
            >
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="shrink-0">
                  <div className="mb-0 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-emerald-600 ring-1 ring-emerald-500/10 dark:text-emerald-400">
                    <Layers className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-2.5 text-lg font-bold">
                    {t('features.components.title')}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t('features.components.description')}
                  </p>

                  {/* Component preview chips */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {['Button', 'Input', 'Dialog', 'Avatar', 'Card', 'Dropdown'].map(
                      (comp) => (
                        <span
                          key={comp}
                          className="rounded-md bg-muted/80 px-2.5 py-1 font-mono text-[11px] font-medium text-muted-foreground ring-1 ring-border/50"
                        >
                          {`<${comp} />`}
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Gradient Divider ===== */}
      <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
      </div>

      {/* ===== Tech Stack ===== */}
      <section id="stack" className="scroll-reveal relative py-24 sm:py-28">
        <div className="mx-auto mb-14 max-w-7xl px-5 text-center sm:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('stack.title')}
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            {t('stack.description')}
          </p>
        </div>

        {/* Marquee with styled badges */}
        <div className="relative overflow-hidden py-4">
          <div className="pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-32 bg-gradient-to-r from-background to-transparent sm:w-48" />
          <div className="pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-32 bg-gradient-to-l from-background to-transparent sm:w-48" />

          <div className="flex animate-marquee">
            {[...stackItems, ...stackItems].map((item, i) => (
              <span
                key={i}
                className="inline-flex shrink-0 items-center gap-3 px-4 sm:px-6"
              >
                <span className="inline-flex items-center gap-2.5 rounded-full border border-border/60 bg-card px-5 py-2.5 shadow-sm transition-shadow hover:shadow-md">
                  <span className={`h-2 w-2 rounded-full bg-gradient-to-br ${item.color}`} />
                  <span className="whitespace-nowrap text-sm font-semibold text-foreground/80">
                    {item.name}
                  </span>
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA Section — Dark Gradient ===== */}
      <section className="scroll-reveal relative px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0c0c0c] via-[#111] to-[#0c0c0c] shadow-2xl">
            {/* Decorative gradient orbs inside CTA */}
            <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-teal-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />

            {/* Grid pattern inside */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at center, oklch(1 0 0 / 0.3) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            <div className="relative px-8 py-20 text-center sm:px-16 sm:py-24">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-4 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                <span className="text-xs font-semibold text-teal-400">
                  {t('cta.badge')}
                </span>
              </div>

              <h2
                className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-5xl"
                style={{ textWrap: 'balance' }}
              >
                {t('cta.title')}
              </h2>

              <p className="mx-auto mt-5 max-w-lg text-base text-white/50 sm:text-lg">
                {t('cta.description')}
              </p>

              <div className="mt-10">
                <Button
                  size="lg"
                  asChild
                  className="bg-white text-black shadow-lg shadow-white/10 transition-all duration-300 hover:bg-white/90 hover:shadow-xl hover:shadow-white/20"
                >
                  <Link href="/dashboard">
                    <Rocket className="mr-2 h-4 w-4" />
                    {t('cta.button')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-border/30 py-10">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-teal-600 dark:to-teal-300">
                <Zap className="h-3 w-3 text-white dark:text-black" />
              </div>
              <span className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} {t('footer.copyright')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground/50">
              {t('footer.tagline')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
