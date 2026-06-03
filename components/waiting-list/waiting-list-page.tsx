import { JetBrains_Mono, Manrope } from 'next/font/google'
import { getTranslations } from 'next-intl/server'
import { readWaitingListSampleData } from '@/components/waiting-list/sample-data'
import WaitingListExperience from '@/components/waiting-list/waiting-list-experience'
import { waitingListStyles as styles } from '@/components/waiting-list/waiting-list-styles'

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
})

type PainPost = {
  text: string
  c: number
  tag: string
}

const PAIN_ROW_LAYOUT = [
  { id: 'early-launch-pains', speed: 75, dir: 1, start: 0, end: 8 },
  { id: 'platform-voice-pains', speed: 95, dir: -1, start: 4, end: 12 },
  { id: 'solo-founder-pains', speed: 65, dir: 1, start: 8, end: 16 },
] as const

// Decorative starfield. Generated on the server only (this is a server
// component, so it never re-renders on the client → no hydration mismatch).
const STARS = Array.from({ length: 70 }, (_, index) => ({
  id: `star-${index}`,
  x: Math.random() * 100,
  y: Math.random() * 100,
  s: Math.random() * 1.6 + 0.4,
  d: Math.random() * 4,
  o: Math.random() * 0.6 + 0.2,
}))

export default async function WaitingListPage() {
  const t = await getTranslations('WaitingList')
  const painPosts = readPainPosts(t.raw('marquee.posts'))
  const sampleData = readWaitingListSampleData(t.raw('sampleData'))
  const ticker = readStringList(t.raw('ticker.items'))
  const painRows = [
    ...PAIN_ROW_LAYOUT.map((row) => ({
      id: row.id,
      speed: row.speed,
      dir: row.dir,
      items: painPosts.slice(row.start, row.end),
    })),
    {
      id: 'media-social-pains',
      speed: 110,
      dir: -1,
      items: [...painPosts.slice(12), ...painPosts.slice(0, 4)],
    },
  ]
  const labels = {
    nav: {
      brandPrefix: t('nav.brandPrefix'),
      brandAccent: t('nav.brandAccent'),
      status: t('nav.status'),
    },
    hero: {
      eyebrow: t('hero.eyebrow'),
      title: t('hero.title'),
      titleHighlight: t('hero.titleHighlight'),
      description: t('hero.description'),
      descriptionHighlight: t('hero.descriptionHighlight'),
    },
    form: {
      emailLabel: t('form.emailLabel'),
      placeholder: t('form.placeholder'),
      submit: t('form.submit'),
      saving: t('form.saving'),
      helper: t('form.helper'),
      invalidEmail: t('form.invalidEmail'),
      error: t('form.error'),
      stats: [
        { n: t('form.stats.launchChannels.n'), label: t('form.stats.launchChannels.label') },
        { n: t('form.stats.seo.n'), label: t('form.stats.seo.label') },
        { n: t('form.stats.outreach.n'), label: t('form.stats.outreach.label') },
      ],
    },
    sample: {
      unlocked: t('sample.unlocked'),
      generatedFor: t('sample.generatedFor'),
      subtitle: t('sample.subtitle'),
      inputUrl: t('sample.inputUrl'),
      contentYouGet: t('sample.contentYouGet'),
      contentSummary: t('sample.contentSummary'),
      contentSummaryValue: t('sample.contentSummaryValue'),
      channels: t('sample.channels'),
      generatedCopy: t('sample.generatedCopy'),
      mediaAssets: t('sample.mediaAssets'),
      seoPlan: t('sample.seoPlan'),
      subreddits: t('sample.subreddits'),
      outreach: t('sample.outreach'),
      mediaKit: t('sample.mediaKit'),
      cta: t('sample.cta'),
      notes: t('sample.notes'),
      savedFor: t('sample.savedFor'),
      generatedSystem: t('sample.generatedSystem'),
      xPosts: t('sample.xPosts'),
      redditPost: t('sample.redditPost'),
      prospects: t('sample.prospects'),
      productDemo: t('sample.productDemo'),
      fullResults: t('sample.fullResults'),
      metrics: {
        channelDrafts: t('sample.metrics.channelDrafts'),
        redditTargets: t('sample.metrics.redditTargets'),
        creativePrompts: t('sample.metrics.creativePrompts'),
        reviewedProspects: t('sample.metrics.reviewedProspects'),
      },
      workflow: {
        sourceUrl: {
          title: t('sample.workflow.sourceUrl.title'),
          body: t('sample.workflow.sourceUrl.body'),
          status: t('sample.workflow.sourceUrl.status'),
        },
        generationProfile: {
          title: t('sample.workflow.generationProfile.title'),
          body: t('sample.workflow.generationProfile.body'),
          status: t('sample.workflow.generationProfile.status'),
        },
        dashboardOutput: {
          title: t('sample.workflow.dashboardOutput.title'),
          body: t('sample.workflow.dashboardOutput.body'),
          status: t('sample.workflow.dashboardOutput.status'),
        },
      },
      navigation: {
        launchCopy: {
          title: t('sample.navigation.launchCopy.title'),
          value: t('sample.navigation.launchCopy.value'),
        },
        xThread: {
          title: t('sample.navigation.xThread.title'),
          value: t('sample.navigation.xThread.value'),
        },
        redditPost: {
          title: t('sample.navigation.redditPost.title'),
          value: t('sample.navigation.redditPost.value'),
        },
        seoPlan: {
          title: t('sample.navigation.seoPlan.title'),
          value: t('sample.navigation.seoPlan.value'),
        },
        prospects: {
          title: t('sample.navigation.prospects.title'),
          value: t('sample.navigation.prospects.value'),
        },
        outreach: {
          title: t('sample.navigation.outreach.title'),
          value: t('sample.navigation.outreach.value'),
        },
        productDemo: {
          title: t('sample.navigation.productDemo.title'),
          value: t('sample.navigation.productDemo.value'),
        },
        creative: {
          title: t('sample.navigation.creative.title'),
          value: t('sample.navigation.creative.value'),
        },
      },
      sections: {
        extractedBrief: t('sample.sections.extractedBrief'),
        freeLaunchCopy: t('sample.sections.freeLaunchCopy'),
        subredditsToEvaluate: t('sample.sections.subredditsToEvaluate'),
        whereToTest: t('sample.sections.whereToTest'),
        premiumSeo: t('sample.sections.premiumSeo'),
        premiumProspects: t('sample.sections.premiumProspects'),
        premiumOutreach: t('sample.sections.premiumOutreach'),
        premiumProductDemo: t('sample.sections.premiumProductDemo'),
        premiumCreative: t('sample.sections.premiumCreative'),
        oneLiner: t('sample.sections.oneLiner'),
        pressHook: t('sample.sections.pressHook'),
      },
      ctaItems: readStringList(t.raw('sample.ctaItems')),
      noteItems: readStringList(t.raw('sample.noteItems')),
    },
  }

  return (
    <div className={`${styles.page} ${manrope.variable} ${jetbrainsMono.variable}`}>
      <div className={styles.backdrop}>
        <div className={`${styles.glow} ${styles.glow1}`} />
        <div className={`${styles.glow} ${styles.glow2}`} />
        <div className={styles.gridBg} />
        <div className={styles.stars}>
          {STARS.map((s) => (
            <span
              key={s.id}
              style={{
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${s.s}px`,
                height: `${s.s}px`,
                opacity: s.o,
                animationDelay: `${-s.d}s`,
              }}
            />
          ))}
        </div>
      </div>

      <header className={styles.topbar}>
        <div className={styles.logo}>
          <div className={styles.logoMark} aria-hidden="true">
            <svg viewBox="0 0 32 32" width="28" height="28">
              <circle cx="16" cy="16" r="15" fill="#7B5CFF" />
              <path d="M11 21c1.5-6 4.5-9 10.5-10.5-1.5 6-4.5 9-10.5 10.5z" fill="#0B1020" />
              <circle cx="13.5" cy="13" r="1.6" fill="#0B1020" />
              <circle cx="18" cy="11" r="1.6" fill="#0B1020" />
              <rect x="11.5" y="11.4" width="8.5" height="1.2" rx="0.6" fill="#0B1020" />
            </svg>
          </div>
          <span className={styles.logoWord}>
            {labels.nav.brandPrefix}
            <span className={styles.accent}>{labels.nav.brandAccent}</span>
          </span>
        </div>
        <nav className={styles.topnav}>
          <span className={styles.pill}>
            <span className={styles.dot} /> {labels.nav.status}
          </span>
        </nav>
      </header>

      <WaitingListExperience painRows={painRows} sampleData={sampleData} ticker={ticker} labels={labels} />
    </div>
  )
}

function readPainPosts(value: unknown): PainPost[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.flatMap((item) => {
    if (
      item &&
      typeof item === 'object' &&
      'text' in item &&
      'c' in item &&
      'tag' in item &&
      typeof item.text === 'string' &&
      typeof item.c === 'number' &&
      typeof item.tag === 'string'
    ) {
      return [{ text: item.text, c: item.c, tag: item.tag }]
    }

    return []
  })
}

function readStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string')
}
