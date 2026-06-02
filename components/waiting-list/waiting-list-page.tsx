import { JetBrains_Mono, Manrope } from 'next/font/google'
import { getTranslations } from 'next-intl/server'
import WaitingListExperience from '@/components/waiting-list/waiting-list-experience'
import styles from '@/components/waiting-list/waiting-list.module.css'

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
  const painPosts = t.raw('painPosts') as PainPost[]
  const painRows = [
    { id: 'early-launch-pains', speed: 75, dir: 1, items: painPosts.slice(0, 8) },
    { id: 'platform-voice-pains', speed: 95, dir: -1, items: painPosts.slice(4, 12) },
    { id: 'solo-founder-pains', speed: 65, dir: 1, items: painPosts.slice(8, 16) },
    { id: 'media-social-pains', speed: 110, dir: -1, items: [...painPosts.slice(12), ...painPosts.slice(0, 4)] },
  ]
  const labels = {
    hero: {
      eyebrow: t('hero.eyebrow'),
      titleLine1: t('hero.titleLine1'),
      titleLine2: t('hero.titleLine2'),
      description: t('hero.description'),
      descriptionEmphasis: t('hero.descriptionEmphasis'),
    },
    form: {
      placeholder: t('form.placeholder'),
      submit: t('form.submit'),
      helper: t('form.helper'),
      invalidEmail: t('form.invalidEmail'),
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
            {t('nav.logoPrefix')}<span className={styles.accent}>{t('nav.logoSuffix')}</span>
          </span>
        </div>
        <nav className={styles.topnav}>
          <span className={styles.pill}>
            <span className={styles.dot} /> {t('nav.prelaunch')}
          </span>
        </nav>
      </header>

      <WaitingListExperience painRows={painRows} ticker={t.raw('ticker') as string[]} labels={labels} />
    </div>
  )
}
