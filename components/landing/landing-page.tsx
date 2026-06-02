import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import Image from 'next/image'
import { Playfair_Display, Space_Grotesk } from 'next/font/google'
import {
  Check,
  Newspaper,
  Sparkles,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import LaunchUrlHandoff from '@/components/landing/launch-url-handoff'
import {
  DEMO_BRIEF,
  getDemoPreviewBlocks,
} from '@/lib/launch-kit/demo'

const editorialSerif = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
})

const interfaceSans = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const toneByPlatform: Record<string, string> = {
  product_hunt: 'from-amber-500/15 to-orange-100/35',
  hacker_news: 'from-violet-500/15 to-violet-100/40',
  reddit: 'from-fuchsia-500/12 to-fuchsia-100/35',
  linkedin: 'from-indigo-500/12 to-indigo-100/35',
  email_announcement: 'from-emerald-500/12 to-teal-100/35',
}

const panelSlots = [
  'top-0 left-3 -rotate-2',
  'top-20 right-2 rotate-[1.4deg]',
  'top-40 left-10 -rotate-[1deg]',
  'top-60 right-8 rotate-[1.8deg]',
]

const launchSurfaceLogos = [
  {
    name: 'Product Hunt',
    src: '/brand-logos/producthunt.svg',
  },
  {
    name: 'Hacker News',
    src: '/brand-logos/hackernews.svg',
  },
  {
    name: 'Reddit',
    src: '/brand-logos/reddit.svg',
  },
  {
    name: 'Indie Hackers',
    src: '/brand-logos/indiehackers-type.svg',
  },
  {
    name: 'LinkedIn',
    src: '/brand-logos/linkedin.svg',
  },
] as const

// react-doctor-disable-next-line react-doctor/no-giant-component
export default async function LandingPage() {
  const t = await getTranslations('Landing')
  const previewBlocks = getDemoPreviewBlocks()
  const voiceByPlatform: Record<string, string> = {
    product_hunt: t('proof.voice.productHunt'),
    hacker_news: t('proof.voice.hackerNews'),
    reddit: t('proof.voice.reddit'),
    linkedin: t('proof.voice.linkedin'),
    email_announcement: t('proof.voice.email'),
  }
  const growthAutomationItems = [
    t('media.items.seoActions'),
    t('media.items.productDemo'),
    t('media.items.prospectLists'),
    t('media.items.outreachVariants'),
    t('media.items.socialContent'),
    t('media.items.reviewQueue'),
  ]

  return (
    <div className={`${interfaceSans.className} relative min-h-screen overflow-x-clip bg-white text-zinc-900`}>
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-28 -right-20 size-[420px] rounded-full bg-gradient-to-br from-violet-300/60 via-fuchsia-200/45 to-transparent blur-3xl" />
        <div className="absolute top-1/3 -left-24 size-[360px] rounded-full bg-gradient-to-tr from-purple-300/40 via-violet-200/25 to-transparent blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-violet-100 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 shadow-lg shadow-violet-500/30">
              <Sparkles className="size-4 text-white" />
            </div>
            <div>
              <p className={`${editorialSerif.className} text-lg font-semibold tracking-tight`}>
                {t('nav.brand')}
              </p>
              <p className="text-[11px] text-zinc-500">{t('nav.sub')}</p>
            </div>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <a href="#transformation" className="text-sm text-zinc-600 transition hover:text-violet-700">
              {t('nav.proof')}
            </a>
            <a href="#voices" className="text-sm text-zinc-600 transition hover:text-violet-700">
              {t('nav.voices')}
            </a>
            <a href="#media" className="text-sm text-zinc-600 transition hover:text-violet-700">
              {t('nav.media')}
            </a>
            <Link href="/pricing" className="text-sm text-zinc-600 transition hover:text-violet-700">
              {t('nav.pricing')}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="hidden text-sm text-zinc-600 transition hover:text-zinc-900 sm:block">
              {t('nav.signIn')}
            </Link>
            <Button
              asChild
              size="sm"
              className="bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-md shadow-violet-500/30 hover:from-violet-700 hover:to-fuchsia-600"
            >
              <Link href="/dashboard">{t('nav.getStarted')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section id="transformation" className="mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 sm:pb-24 sm:pt-16 lg:px-8 lg:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
              <Newspaper className="size-3.5" />
              {t('hero.badge')}
            </div>

            <h1
              className={`${editorialSerif.className} mt-5 text-4xl leading-[1.02] tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl`}
            >
              {t('hero.title')}
              <span className="mt-2 block text-violet-700">
                {t('hero.titleHighlight')}
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg">
              {t('hero.description')}
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-4xl rounded-[1.75rem] border border-violet-100 bg-white p-4 shadow-[0_30px_70px_-50px_rgba(100,40,180,0.5)] sm:p-5">
            <LaunchUrlHandoff
              placeholder={t('hero.urlPlaceholder')}
              primaryLabel={t('hero.ctaPrimary')}
              secondaryLabel={t('hero.ctaSecondary')}
              helper={t('hero.ctaHelper')}
              invalidUrl={t('hero.invalidUrl')}
            />
          </div>

          <div className="relative mt-6 overflow-hidden py-2">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white via-white/80 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white via-white/80 to-transparent" />

            <div
              className="flex w-max whitespace-nowrap [animation:marquee_36s_linear_infinite] motion-reduce:[animation:none] hover:[animation-play-state:paused]"
            >
              {[...launchSurfaceLogos, ...launchSurfaceLogos].map((surface, index) => (
                <BrandLogoMarqueeItem
                  key={`full-logo-${surface.name}-${index}`}
                  src={surface.src}
                  label={surface.name}
                />
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[0.94fr_1.06fr]">
            <article
              className="animate-fade-up motion-reduce:animate-none rounded-[1.5rem] border border-violet-100 bg-white p-5 shadow-sm"
              style={{ animationDelay: '120ms' }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                    {t('proof.sourceLabel')}
                  </p>
                  <h2 className={`${editorialSerif.className} text-2xl leading-tight text-zinc-900`}>
                    {t('proof.sourceTitle')}
                  </h2>
                </div>
                <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700">
                  {DEMO_BRIEF.sourceUrl}
                </span>
              </div>

              <div className="space-y-3">
                <BriefRow label={t('proof.brief.productName')} value={DEMO_BRIEF.productName} />
                <BriefRow label={t('proof.brief.positioning')} value={DEMO_BRIEF.positioning} />
                <BriefList label={t('proof.brief.targetUsers')} values={DEMO_BRIEF.targetUsers} />
                <BriefRow label={t('proof.brief.icp')} value={DEMO_BRIEF.icp} />
                <BriefList label={t('proof.brief.painPoints')} values={DEMO_BRIEF.painPoints} />
                <BriefList label={t('proof.brief.valueProps')} values={DEMO_BRIEF.valueProps} />
                <BriefList label={t('proof.brief.proofPoints')} values={DEMO_BRIEF.proofPoints} />
                <BriefRow label={t('proof.brief.cta')} value={DEMO_BRIEF.cta} />
              </div>
            </article>

            <div>
              <div
                className="hidden animate-fade-up motion-reduce:animate-none rounded-[1.5rem] border border-violet-100 bg-white p-5 shadow-sm lg:block"
                style={{ animationDelay: '220ms' }}
              >
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                      {t('proof.outputLabel')}
                    </p>
                    <h2 className={`${editorialSerif.className} text-2xl leading-tight text-zinc-900`}>
                      {t('proof.outputTitle')}
                    </h2>
                  </div>
                  <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs text-violet-700">
                    {t('proof.socialContract')}
                  </span>
                </div>

                <div className="relative h-[430px] overflow-hidden rounded-2xl border border-violet-100 bg-[radial-gradient(circle_at_15%_10%,rgba(139,92,246,0.12),transparent_45%),radial-gradient(circle_at_85%_0%,rgba(217,70,239,0.12),transparent_48%)] p-3">
                  {previewBlocks.map((block, index) => (
                    <article
                      key={block.id}
                      className={`animate-fade-up motion-reduce:animate-none absolute w-[88%] rounded-2xl border border-violet-200 bg-white/95 p-4 shadow-lg shadow-violet-500/10 backdrop-blur ${panelSlots[index]}`}
                      style={{
                        animationDelay: `${280 + index * 140}ms`,
                      }}
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="rounded-full border border-violet-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-700">
                          {block.label}
                        </span>
                        <span
                          className={`rounded-full bg-gradient-to-r px-2 py-1 text-[10px] font-medium text-violet-800 ${toneByPlatform[block.id]}`}
                        >
                          {voiceByPlatform[block.id]}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-zinc-700">{block.body.split('\n\n')[0]}</p>
                      <div className="mt-3 border-t border-violet-100 pt-3 text-xs text-zinc-500">
                        <span className="font-semibold text-violet-700">CTA:</span> {block.cta}
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="animate-fade-up motion-reduce:animate-none rounded-[1.5rem] border border-violet-100 bg-white p-5 shadow-sm lg:hidden" style={{ animationDelay: '220ms' }}>
                <div className="mb-3 flex items-end justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                      {t('proof.outputLabel')}
                    </p>
                    <h2 className={`${editorialSerif.className} text-2xl leading-tight text-zinc-900`}>
                      {t('proof.outputTitle')}
                    </h2>
                  </div>
                  <span className="text-xs text-zinc-500">{t('proof.swipeHint')}</span>
                </div>

                <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
                  {previewBlocks.map((block) => (
                    <article
                      key={`mobile-${block.id}`}
                      className="w-[86%] shrink-0 snap-start rounded-2xl border border-violet-200 bg-white p-4"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-violet-700">{block.label}</span>
                        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] text-violet-700">
                          {voiceByPlatform[block.id]}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-zinc-700">{block.body.split('\n\n')[0]}</p>
                      <p className="mt-2 text-xs text-zinc-500">
                        <span className="font-semibold text-violet-700">CTA:</span> {block.cta}
                      </p>
                    </article>
                  ))}
                </div>

                <div className="mt-2 flex justify-center gap-1.5">
                  {previewBlocks.map((block) => (
                    <span key={`dot-${block.id}`} className="h-1.5 w-6 rounded-full bg-violet-200" />
                  ))}
                </div>
              </div>
            </div>
          </div>

        </section>

        <section id="voices" className="border-y border-violet-100/90 bg-violet-50/30 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-700">
                {t('voices.label')}
              </p>
              <h2 className={`${editorialSerif.className} mt-2 text-4xl leading-tight text-zinc-900`}>
                {t('voices.title')}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-zinc-600">{t('voices.description')}</p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <VoiceCard title={t('voices.cards.hn.title')} body={t('voices.cards.hn.body')} />
              <VoiceCard title={t('voices.cards.reddit.title')} body={t('voices.cards.reddit.body')} />
              <VoiceCard title={t('voices.cards.indie.title')} body={t('voices.cards.indie.body')} />
              <VoiceCard title={t('voices.cards.linkedin.title')} body={t('voices.cards.linkedin.body')} />
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-20 lg:px-8">
          <article className="rounded-[1.6rem] border border-violet-100 bg-white p-6 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-700">
              {t('generated.label')}
            </p>
            <h2 className={`${editorialSerif.className} mt-2 text-3xl leading-tight text-zinc-900`}>
              {t('generated.title')}
            </h2>
            <p className="mt-3 text-zinc-600">{t('generated.description')}</p>

            <ul className="mt-6 space-y-2 text-sm text-zinc-700">
              <GeneratedItem label="Product Hunt" value={t('generated.items.productHunt')} />
              <GeneratedItem label="Hacker News" value={t('generated.items.hn')} />
              <GeneratedItem label="Reddit" value={t('generated.items.reddit')} />
              <GeneratedItem label="X" value={t('generated.items.x')} />
              <GeneratedItem label="Indie Hackers" value={t('generated.items.indie')} />
              <GeneratedItem label="LinkedIn" value={t('generated.items.linkedin')} />
              <GeneratedItem label="Premium short-form" value={t('generated.items.video')} />
              <GeneratedItem label="Email" value={t('generated.items.email')} />
              <GeneratedItem label="Media kit" value={t('generated.items.press')} />
            </ul>
          </article>

          <article id="media" className="rounded-[1.6rem] border border-violet-100 bg-gradient-to-br from-white to-violet-50/70 p-6 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-700">{t('media.label')}</p>
            <h2 className={`${editorialSerif.className} mt-2 text-3xl leading-tight text-zinc-900`}>
              {t('media.title')}
            </h2>
            <p className="mt-3 text-zinc-600">{t('media.description')}</p>

            <ul className="mt-6 space-y-2 text-sm text-zinc-700">
              {growthAutomationItems.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-violet-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="mt-5 rounded-xl border border-violet-200 bg-white/80 px-3 py-2 text-sm leading-relaxed text-zinc-600">
              {t('media.pressPackNote')}
            </p>

            <Button
              asChild
              className="mt-5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-md shadow-violet-500/30 hover:from-violet-700 hover:to-fuchsia-600"
            >
              <Link href="/dashboard?demo=1&view=results">
                <Wand2 className="mr-1.5 size-4" />
                {t('media.cta')}
              </Link>
            </Button>
          </article>
        </section>
      </main>

      <footer className="border-t border-violet-100 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>&copy; 2026 {t('footer.copyright')}</p>
          <p>{t('footer.tagline')}</p>
        </div>
      </footer>
    </div>
  )
}

function BriefRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-violet-700">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-zinc-700">{value}</p>
    </div>
  )
}

function BriefList({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-violet-700">{label}</p>
      <ul className="mt-1 space-y-1 text-sm text-zinc-700">
        {values.map((value) => (
          <li key={`${label}-${value}`}>- {value}</li>
        ))}
      </ul>
    </div>
  )
}

function VoiceCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{body}</p>
    </article>
  )
}

function GeneratedItem({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-xl border border-violet-100 bg-violet-50/35 px-3 py-2">
      <span className="font-medium text-zinc-900">{label}</span>
      <span className="text-right text-zinc-600">{value}</span>
    </li>
  )
}

function BrandLogoMarqueeItem({ src, label }: { src: string; label: string }) {
  return (
    <div className="mx-10 inline-flex items-center" aria-label={label} title={label}>
      <Image
        src={src}
        alt={label}
        width={180}
        height={42}
        className="h-9 w-auto opacity-90"
      />
    </div>
  )
}
