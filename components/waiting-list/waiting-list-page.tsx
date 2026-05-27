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

// Decorative founder-pain confessions for the right-side marquee feed.
const PAIN_POSTS = [
  { name: 'joaquin', handle: '@joaquin_ships', text: 'spent 6 hrs writing the same launch post for 8 platforms. someone end my suffering.', c: 268, tag: 'rewriting hell' },
  { name: 'maya k.', handle: '@maya_builds', text: 'shipped the feature in 2 hours. wrote 4 onboarding emails in 8. make it make sense.', c: 252, tag: 'onboarding' },
  { name: 'rohit', handle: '@rohit_dev', text: '3am setting up trial expiry emails. again. for the third product this quarter.', c: 280, tag: 'lifecycle' },
  { name: 'elena', handle: '@elena_ships', text: 'support inbox: 47 unread. launch is tomorrow. cool cool cool cool.', c: 30, tag: 'support' },
  { name: 'tom', handle: '@tom_indie', text: "my analytics is 5 tabs. still no clue what's actually happening.", c: 200, tag: 'analytics' },
  { name: 'priya', handle: '@priya_codes', text: "writing 'professional' LinkedIn copy drains the will to live out of me.", c: 320, tag: 'linkedin' },
  { name: 'sam', handle: '@sam_solo', text: 'another welcome series from scratch. love that for me. love it.', c: 60, tag: 'emails' },
  { name: 'theo', handle: '@theo_makes', text: 'PH tomorrow. HN draft? not written. press kit? lmao. wish me luck.', c: 110, tag: 'launch day' },
  { name: 'marko', handle: '@marko_ms', text: 'my leads CSV has been sitting in google sheets for 4 months. cool system.', c: 8, tag: 'outreach' },
  { name: 'ines', handle: '@ines_devs', text: 'i love coding. i love shipping. i HATE writing launch copy.', c: 340, tag: 'copy' },
  { name: 'dana', handle: '@dana_builds', text: '8 tabs open just to send one trial expiry reminder. why is this my life.', c: 90, tag: 'tooling' },
  { name: 'luca', handle: '@luca_solo', text: 'shipped at 2am. still answering tickets at 4am. send coffee + sleep.', c: 220, tag: 'post-launch' },
  { name: 'ana', handle: '@ana_writes', text: 'rewrote the same product story 9 times for 9 channels today. 9.', c: 160, tag: 'rewriting hell' },
  { name: 'kenji', handle: '@kenji_ships', text: "what do you mean reddit doesn't want my polished landing-page copy", c: 40, tag: 'reddit' },
  { name: 'soph', handle: '@sophie_dev', text: 'press kit, seo plan, outreach list. one human. one weekend. send help.', c: 290, tag: 'alone' },
  { name: 'ravi', handle: '@ravi_solo', text: 'showHN draft attempt #4. still sounds like a corporate brochure.', c: 250, tag: 'voice' },
]

const PAIN_ROWS = [
  { speed: 75, dir: 1, items: PAIN_POSTS.slice(0, 8) },
  { speed: 95, dir: -1, items: PAIN_POSTS.slice(4, 12) },
  { speed: 65, dir: 1, items: PAIN_POSTS.slice(8, 16) },
  { speed: 110, dir: -1, items: [...PAIN_POSTS.slice(12), ...PAIN_POSTS.slice(0, 4)] },
]

const TICKER = [
  '@joaquin · 3s ago joined',
  'shipping starts · 06.20.26',
  '@maya · 14s ago joined',
  '@rohit · 31s ago joined',
  'founder-to-founder · no fluff',
  '@elena · 48s ago joined',
  '@tom · 1m ago joined',
  'ship it. we handle the chaos.',
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
          <span className={styles.lang}>EN</span>
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
                        <span className={styles.postAvatar} style={{ background: `oklch(0.62 0.16 ${p.c})` }}>
                          {p.name[0].toUpperCase()}
                        </span>
                        <div className={styles.postMeta}>
                          <div className={styles.postName}>{p.name}</div>
                          <div className={styles.postHandle}>{p.handle}</div>
                        </div>
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
