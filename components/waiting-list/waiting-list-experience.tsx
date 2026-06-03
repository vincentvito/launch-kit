'use client'

import { useState } from 'react'
import { Sparkle } from '@/components/waiting-list/icons'
import WaitingListSampleDashboard, {
  type WaitingListSampleLabels,
} from '@/components/waiting-list/waiting-list-sample-dashboard'
import WaitingListSignupForm, {
  type WaitingListSignupLabels,
} from '@/components/waiting-list/waiting-list-signup-form'
import type { WaitingListSampleData } from '@/components/waiting-list/sample-data'
import { waitingListStyles as styles } from '@/components/waiting-list/waiting-list-styles'

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
  hero: {
    eyebrow: string
    title: string
    titleHighlight: string
    description: string
    descriptionHighlight: string
  }
  form: WaitingListSignupLabels
  sample: WaitingListSampleLabels
}

export default function WaitingListExperience({
  painRows,
  sampleData,
  ticker,
  labels,
}: {
  painRows: PainRow[]
  sampleData: WaitingListSampleData
  ticker: string[]
  labels: WaitingListLabels
}) {
  const [sampleEmail, setSampleEmail] = useState('')

  if (sampleEmail) {
    return <WaitingListSampleDashboard email={sampleEmail} labels={labels.sample} sampleData={sampleData} />
  }

  return (
    <>
      <main className={styles.main}>
        <section className={styles.left}>
          <div className={styles.eyebrow}>
            <Sparkle size={12} />
            <span>{labels.hero.eyebrow}</span>
            <Sparkle size={12} />
          </div>

          <h1 className={styles.headline}>
            <span className={styles.hlLine}>{labels.hero.title}</span>
            <span className={`${styles.hlLine} ${styles.hlAccent}`}>{labels.hero.titleHighlight}</span>
          </h1>

          <p className={styles.lede}>
            {labels.hero.description}{' '}
            <span className={styles.ledeEm}>{labels.hero.descriptionHighlight}</span>
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
