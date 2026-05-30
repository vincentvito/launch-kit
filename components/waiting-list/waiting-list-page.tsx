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

// Founder-pain confessions for the right-side marquee feed. No names or
// handles — these are anonymous, relatable launch pains, not fabricated
// testimonials. `c` only sets the tag accent hue.
const PAIN_POSTS = [
  { text: 'spent 6 hrs writing the same launch post for 8 platforms. someone end my suffering.', c: 268, tag: 'rewriting hell' },
  { text: 'one generic post reused everywhere. the voice dies the second i copy-paste it.', c: 252, tag: 'voice' },
  { text: 'x thread, reddit post, subreddit list, launch email — all in different docs. why.', c: 280, tag: 'tool sprawl' },
  { text: 'PH tomorrow. HN draft? not written. press blurb? lmao. wish me luck.', c: 30, tag: 'launch day' },
  { text: "writing 'professional' LinkedIn copy drains the will to live out of me.", c: 200, tag: 'linkedin' },
  { text: "what do you mean reddit doesn't want my polished landing-page copy.", c: 320, tag: 'reddit' },
  { text: 'which subreddit can i post in without getting instantly roasted or removed?', c: 180, tag: 'subreddits' },
  { text: 'showHN draft attempt #4. still sounds like a corporate brochure.', c: 60, tag: 'hacker news' },
  { text: 'rewrote the same product story 9 times for 9 channels today. 9.', c: 110, tag: 'rewriting hell' },
  { text: 'product ready. launch copy not ready. one human. one weekend. send help.', c: 8, tag: 'alone' },
  { text: 'i love coding. i love shipping. i HATE writing launch copy.', c: 340, tag: 'copy' },
  { text: 'i need useful launch copy first, not another giant growth dashboard.', c: 90, tag: 'focus' },
  { text: 'indie hackers wants the build-in-public story. linkedin wants polish. same product.', c: 220, tag: 'indie hackers' },
  { text: 'basic launch kit first. fancy ads and demo scripts can wait until the copy works.', c: 160, tag: 'scope' },
  { text: 'x wants a sharp hook. reddit wants context. linkedin wants polish. same product.', c: 140, tag: 'platform fit' },
  { text: 'every community has its own unwritten rules and i learn them the hard way each launch.', c: 40, tag: 'social contract' },
  { text: 'premium growth work is useful, but only after the launch story is clear.', c: 290, tag: 'growth' },
  { text: 'one URL, one story, ten platforms. there has to be a better way to do this.', c: 250, tag: 'one brief' },
]

const PAIN_ROWS = [
  { id: 'early-launch-pains', speed: 75, dir: 1, items: PAIN_POSTS.slice(0, 8) },
  { id: 'platform-voice-pains', speed: 95, dir: -1, items: PAIN_POSTS.slice(4, 12) },
  { id: 'solo-founder-pains', speed: 65, dir: 1, items: PAIN_POSTS.slice(8, 16) },
  { id: 'media-social-pains', speed: 110, dir: -1, items: [...PAIN_POSTS.slice(12), ...PAIN_POSTS.slice(0, 4)] },
]

const TICKER = [
  'one product URL · launch content generated',
  'free launch kit · one structured brief',
  'Product Hunt · Hacker News · Reddit · Indie Hackers',
  'X · LinkedIn · Email · Media Kit',
  'subreddit picks · where to post',
  'premium · SEO · backlinks · outreach',
  'premium · product demo · creative assets',
  'founder-to-founder · no fluff',
  'review it · then post',
]

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
  const labels = {
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
            ship<span className={styles.accent}>daddy</span>
          </span>
        </div>
        <nav className={styles.topnav}>
          <span className={styles.pill}>
            <span className={styles.dot} /> pre-launch · waitlist open
          </span>
        </nav>
      </header>

      <WaitingListExperience painRows={PAIN_ROWS} ticker={TICKER} labels={labels} />
    </div>
  )
}
