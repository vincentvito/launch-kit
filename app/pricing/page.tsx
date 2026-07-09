import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { ArrowLeft, Check, Lock, TrendingUp } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'
import { displaySans, appSans } from '@/app/dashboard/dashboard-fonts'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Pricing.meta')

  return {
    title: t('title'),
    description: t('description'),
  }
}

type PricingPageProps = {
  searchParams?: Promise<{
    billing?: string
  }>
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const t = await getTranslations('Pricing')
  const params = await searchParams
  const isManualBilling = params?.billing === 'manual'
  const freeItems = t.raw('plans.free.items') as string[]
  const premiumItems = t.raw('plans.premium.items') as string[]

  return (
    <main className={`${appSans.className} min-h-screen bg-[#fbfaff] text-zinc-900`}>
      <header className="border-b border-violet-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center" aria-label="shipdaddy">
            <BrandLogo className="h-12" priority />
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="hidden text-zinc-600 hover:text-zinc-900 sm:inline-flex">
              <Link href="/">
                <ArrowLeft className="mr-1.5 size-4" />
                {t('nav.back')}
              </Link>
            </Button>
            <Button
              asChild
              className="rounded-xl bg-zinc-900 text-white shadow-md shadow-zinc-900/20 hover:bg-zinc-800"
            >
              <Link href="/dashboard">{t('nav.dashboard')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-700">
            {t('hero.eyebrow')}
          </p>
          <h1 className={`${displaySans.className} mt-3 text-4xl leading-tight text-zinc-950 sm:text-5xl`}>
            {t('hero.title')}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-zinc-600 sm:text-lg">
            {t('hero.description')}
          </p>
        </div>

        <div className="mt-10 grid items-stretch gap-5 lg:grid-cols-2">
          <PlanPanel
            name={t('plans.free.name')}
            price={t('plans.free.price')}
            cadence={t('plans.free.cadence')}
            description={t('plans.free.description')}
            cta={t('plans.free.cta')}
            href="/dashboard"
            items={freeItems}
            tone="free"
          />
          <PlanPanel
            name={t('plans.premium.name')}
            price={t('plans.premium.price')}
            cadence={t('plans.premium.cadence')}
            description={t('plans.premium.description')}
            badge={t('plans.premium.badge')}
            cta={t('plans.premium.cta')}
            href="/billing/checkout"
            items={premiumItems}
            tone="premium"
          />
        </div>

        {isManualBilling ? (
          <aside className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="mt-1 rounded-xl border border-amber-200 bg-white/80 p-2 text-amber-700">
                <Lock className="size-4" />
              </span>
              <div>
                <h2 className={`${displaySans.className} text-2xl leading-tight text-zinc-900`}>
                  {t('manual.title')}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-700">
                  {t('manual.description')}
                </p>
              </div>
            </div>
          </aside>
        ) : null}

        <aside className="mt-6 rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="mt-1 rounded-xl border border-violet-100 bg-violet-50 p-2 text-violet-700">
              <Lock className="size-4" />
            </span>
            <div>
              <h2 className={`${displaySans.className} text-2xl leading-tight text-zinc-900`}>
                {t('note.title')}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600">
                {t('note.description')}
              </p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}

function PlanPanel({
  name,
  price,
  cadence,
  description,
  badge,
  cta,
  href,
  items,
  tone,
}: {
  name: string
  price: string
  cadence: string
  description: string
  badge?: string
  cta: string
  href: string
  items: string[]
  tone: 'free' | 'premium'
}) {
  const isPremium = tone === 'premium'

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border p-6 ${
        isPremium
          ? 'border-violet-300 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 text-zinc-950 shadow-2xl shadow-violet-500/20 ring-1 ring-violet-200/70 lg:-mt-4 lg:mb-4'
          : 'border-violet-100 bg-white shadow-sm'
      }`}
    >
      {isPremium ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-400" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(217,70,239,0.12),transparent_34%)]" />
        </>
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div className="relative">
          <p
            className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
              isPremium ? 'text-violet-700' : 'text-violet-700'
            }`}
          >
            {name}
          </p>
          <div className="mt-3 flex items-end gap-2">
            <span className={`${displaySans.className} text-5xl font-bold leading-none text-zinc-950`}>
              {price}
            </span>
            <span className="pb-1 text-sm text-zinc-500">{cadence}</span>
          </div>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-600">
            {description}
          </p>
        </div>
        {isPremium ? (
          <span className="relative inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-violet-800 shadow-sm shadow-violet-500/10">
            <TrendingUp className="size-3.5" />
            {badge}
          </span>
        ) : null}
      </div>

      <Button
        asChild
        className={`mt-6 w-full rounded-xl ${
          isPremium
            ? 'relative bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-fuchsia-600'
            : 'bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-md shadow-violet-500/25 hover:from-violet-700 hover:to-fuchsia-600'
        }`}
      >
        <Link href={href}>{cta}</Link>
      </Button>

      <ul className="relative mt-6 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-zinc-700">
            <Check className="mt-0.5 size-4 shrink-0 text-violet-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}
