'use client'

import { useState } from 'react'
import { Sparkle } from '@/components/waiting-list/icons'
import WaitingListSampleDashboard, {
  type WaitingListSampleLabels,
} from '@/components/waiting-list/waiting-list-sample-dashboard'
import WaitingListSignupForm, {
  type WaitingListSignupLabels,
} from '@/components/waiting-list/waiting-list-signup-form'
import styles from '@/components/waiting-list/waiting-list.module.css'

type PainPost = {
  text: string
  c: number
  tag: string
}

type PainRow = {
  id: string
  speed: number
  dir: number
  items: PainPost[]
}

export type WaitingListLabels = {
  form: WaitingListSignupLabels
  sample: WaitingListSampleLabels
}

export default function WaitingListExperience({
  painRows,
  ticker,
  labels,
}: {
  painRows: PainRow[]
  ticker: string[]
  labels: WaitingListLabels
}) {
  const [sampleEmail, setSampleEmail] = useState('')

  if (sampleEmail) {
    return <WaitingListSampleDashboard email={sampleEmail} labels={labels.sample} />
  }

  return (
    <>
      <main className={styles.main}>
        <section className={styles.left}>
          <div className={styles.eyebrow}>
            <Sparkle size={12} />
            <span>your focused launch kit</span>
            <Sparkle size={12} />
          </div>

          <h1 className={styles.headline}>
            <span className={styles.hlLine}>launch everywhere.</span>
            <span className={`${styles.hlLine} ${styles.hlAccent}`}>from one URL.</span>
          </h1>

          <p className={styles.lede}>
            Stop guessing what to write first. Shipdaddy turns one URL into the launch copy,
            subreddit guidance, email announcement, and media kit you can use today.{' '}
            <span className={styles.ledeEm}>Premium unlocks SEO, outreach, demos, and creative assets.</span>
          </p>

          <WaitingListSignupForm labels={labels.form} onSampleUnlocked={setSampleEmail} />
        </section>

        <section className={styles.right}>
          <div className={styles.painFeed}>
            {painRows.map((row) => (
              <div className={styles.painRow} key={row.id}>
                <div
                  className={`${styles.painTrack} ${row.dir === -1 ? styles.dirRev : ''}`}
                  style={{ animationDuration: `${row.speed}s` }}
                >
                  {[
                    ...row.items.map((post) => ({ post, copy: 'first' })),
                    ...row.items.map((post) => ({ post, copy: 'second' })),
                  ].map(({ post: p, copy }) => (
                    <div className={styles.post} key={`${row.id}-${copy}-${p.tag}-${p.text}`}>
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

      <footer className={styles.tickerBar} aria-hidden="true">
        <div className={styles.ticker}>
          <div className={styles.tickerTrack}>
            {[
              ...ticker.map((text) => ({ text, copy: 'first' })),
              ...ticker.map((text) => ({ text, copy: 'second' })),
            ].map(({ text, copy }) => (
              <span key={`${copy}-${text}`} className={styles.tickerItem}>
                <Sparkle size={8} />
                <span>{text}</span>
              </span>
            ))}
          </div>
        </div>
      </footer>
    </>
  )
}
