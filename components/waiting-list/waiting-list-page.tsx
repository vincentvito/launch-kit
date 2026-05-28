import { JetBrains_Mono, Manrope } from 'next/font/google'
import { Sparkle } from '@/components/waiting-list/icons'
import WaitingListSignupForm from '@/components/waiting-list/waiting-list-signup-form'
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
  { text: 'launch copy, media assets, seo plan, outreach list — all in different tools. why.', c: 280, tag: 'tool sprawl' },
  { text: 'PH tomorrow. HN draft? not written. press kit? lmao. wish me luck.', c: 30, tag: 'launch day' },
  { text: "writing 'professional' LinkedIn copy drains the will to live out of me.", c: 200, tag: 'linkedin' },
  { text: "what do you mean reddit doesn't want my polished landing-page copy.", c: 320, tag: 'reddit' },
  { text: 'showHN draft attempt #4. still sounds like a corporate brochure.', c: 60, tag: 'hacker news' },
  { text: 'rewrote the same product story 9 times for 9 channels today. 9.', c: 110, tag: 'rewriting hell' },
  { text: 'press kit, seo plan, outreach list. one human. one weekend. send help.', c: 8, tag: 'alone' },
  { text: 'i love coding. i love shipping. i HATE writing launch copy.', c: 340, tag: 'copy' },
  { text: 'my leads CSV has been sitting in google sheets for 4 months. cool system.', c: 90, tag: 'outreach' },
  { text: 'indie hackers wants the build-in-public story. linkedin wants polish. same product.', c: 220, tag: 'indie hackers' },
  { text: 'tiktok hook? youtube script? i write code, not viral retention beats.', c: 160, tag: 'video' },
  { text: 'every community has its own unwritten rules and i learn them the hard way each launch.', c: 40, tag: 'social contract' },
  { text: 'a press-ready media kit by tomorrow. from nothing. sure. great. fine.', c: 290, tag: 'media kit' },
  { text: 'one URL, one story, ten platforms. there has to be a better way to do this.', c: 250, tag: 'one brief' },
]

const PAIN_ROWS = [
  { speed: 75, dir: 1, items: PAIN_POSTS.slice(0, 8) },
  { speed: 95, dir: -1, items: PAIN_POSTS.slice(4, 12) },
  { speed: 65, dir: 1, items: PAIN_POSTS.slice(8, 16) },
  { speed: 110, dir: -1, items: [...PAIN_POSTS.slice(12), ...PAIN_POSTS.slice(0, 4)] },
]

const TICKER = [
  'one product URL · a complete launch narrative',
  '8 launch channels · one structured brief',
  'Product Hunt · Hacker News · Reddit · Indie Hackers',
  'LinkedIn · TikTok · YouTube · Email',
  'press-ready media kit · included',
  'SEO posts · outreach · all in one dashboard',
  'founder-to-founder · no fluff',
  'ship it. we got you.',
]

// Decorative starfield. Generated on the server only (this is a server
// component, so it never re-renders on the client → no hydration mismatch).
const STARS = Array.from({ length: 70 }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  s: Math.random() * 1.6 + 0.4,
  d: Math.random() * 4,
  o: Math.random() * 0.6 + 0.2,
}))

export default function WaitingListPage() {
  return (
    <div className={`${styles.page} ${manrope.variable} ${jetbrainsMono.variable}`}>
      {/* Backdrop */}
      <div className={styles.backdrop}>
        <div className={`${styles.glow} ${styles.glow1}`} />
        <div className={`${styles.glow} ${styles.glow2}`} />
        <div className={styles.gridBg} />
        <div className={styles.stars}>
          {STARS.map((s, i) => (
            <span
              key={i}
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

      {/* Top bar */}
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

      {/* Main */}
      <main className={styles.main}>
        <section className={styles.left}>
          <div className={styles.eyebrow}>
            <Sparkle size={12} />
            <span>your post-launch cofounder</span>
            <Sparkle size={12} />
          </div>

          <h1 className={styles.headline}>
            <span className={styles.hlLine}>ship it.</span>
            <span className={`${styles.hlLine} ${styles.hlAccent}`}>we got you.</span>
          </h1>

          <p className={styles.lede}>
            Automate onboarding, emails, notifications, analytics, support and launch ops after your app
            goes live. <span className={styles.ledeEm}>You ship it. We handle the chaos.</span>
          </p>

          <WaitingListSignupForm />
        </section>

        {/* Right side: founder-pain marquee feed */}
        <section className={styles.right}>
          <div className={styles.painFeed}>
            {PAIN_ROWS.map((row, i) => (
              <div className={styles.painRow} key={i}>
                <div
                  className={`${styles.painTrack} ${row.dir === -1 ? styles.dirRev : ''}`}
                  style={{ animationDuration: `${row.speed}s` }}
                >
                  {[...row.items, ...row.items].map((p, j) => (
                    <div className={styles.post} key={j}>
                      <div className={styles.postHead}>
                        <span className={styles.postDot} style={{ background: `oklch(0.62 0.16 ${p.c})` }} />
                        <span className={styles.postTag}>#{p.tag}</span>
                      </div>
                      <div className={styles.postBody}>{p.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className={`${styles.painFeedFade} ${styles.painFeedFadeTop}`} />
            <div className={`${styles.painFeedFade} ${styles.painFeedFadeBottom}`} />
          </div>
        </section>
      </main>

      {/* Bottom ticker */}
      <footer className={styles.tickerBar} aria-hidden="true">
        <div className={styles.ticker}>
          <div className={styles.tickerTrack}>
            {[...TICKER, ...TICKER].map((s, i) => (
              <span key={i} className={styles.tickerItem}>
                <Sparkle size={8} />
                <span>{s}</span>
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
