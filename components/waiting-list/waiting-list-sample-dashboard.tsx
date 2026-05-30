'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import {
  CheckCircle2,
  ImageIcon,
  MessageSquareText,
  MonitorPlay,
  Search,
  Send,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import {
  SAMPLE_CHANNELS,
  SAMPLE_MEDIA_ASSETS,
  SAMPLE_OUTREACH,
  SAMPLE_PROSPECTS,
  SAMPLE_PRODUCT_DEMO,
  SAMPLE_SEO_PLAN,
  SAMPLE_SUBREDDITS,
  type SampleChannel,
  type SampleMediaAsset,
} from '@/components/waiting-list/sample-data'
import styles from '@/components/waiting-list/waiting-list.module.css'

export type WaitingListSampleLabels = {
  unlocked: string
  generatedFor: string
  subtitle: string
  inputUrl: string
  contentYouGet: string
  contentSummary: string
  channels: string
  generatedCopy: string
  mediaAssets: string
  seoPlan: string
  subreddits: string
  outreach: string
  mediaKit: string
  cta: string
  notes: string
  savedFor: string
  generatedSystem: string
  xPosts: string
  redditPost: string
  prospects: string
  productDemo: string
  fullResults: string
}

const xChannel = getChannel('x')
const redditChannel = getChannel('reddit')

const primaryOutputs = [
  {
    id: 'x',
    icon: <MessageSquareText size={18} />,
    title: 'X posts',
    value: 'Sharp launch thread with hook, pain, reveal, and CTA.',
    sample: '1/ Launching should not mean opening ten blank docs.',
  },
  {
    id: 'reddit',
    icon: <MessageSquareText size={18} />,
    title: 'Reddit post',
    value: 'Community-ready draft that asks for feedback instead of sounding like an ad.',
    sample: 'I like building products. I do not like writing the same launch story eight different ways.',
  },
  {
    id: 'subreddits',
    icon: <Search size={18} />,
    title: 'Subreddits to post in',
    value: 'Where to post, why it fits, and how to frame the ask.',
    sample: 'r/SaaS · r/SideProject · r/AlphaandBetaUsers · r/GrowthHacking · r/startups · r/EntrepreneurRideAlong',
  },
]

const secondaryOutputs = [
  {
    id: 'seo',
    icon: <Search size={18} />,
    title: 'Premium SEO',
    value: 'Keyword research, blog cadence, GEO readiness, and backlink ideas.',
    sample: 'Unlock after the free kit proves the brief',
  },
  {
    id: 'prospects',
    icon: <Target size={18} />,
    title: 'Premium prospects',
    value: 'Finds potential customers and prepares outreach for review.',
    sample: 'Prospect list · personalized drafts · no auto-send',
  },
  {
    id: 'outreach',
    icon: <Send size={18} />,
    title: 'Premium outreach',
    value: 'Personalized LinkedIn, X, and email sequences.',
    sample: 'Cold email · LinkedIn DM · X DM · follow-up',
  },
  {
    id: 'product-demo',
    icon: <MonitorPlay size={18} />,
    title: 'Premium product demo',
    value: 'Generated walkthrough script and screen beats for the product.',
    sample: 'Paste URL → show launch map → review demo beats',
  },
  {
    id: 'assets',
    icon: <ImageIcon size={18} />,
    title: 'Premium creative assets',
    value: 'Image and video creative for the launch story.',
    sample: 'Problem / Solution · Before / After · Product walkthrough',
  },
]

export default function WaitingListSampleDashboard({
  email,
  labels,
}: {
  email: string
  labels: WaitingListSampleLabels
}) {
  const [activeAsset, setActiveAsset] = useState<SampleMediaAsset | null>(null)

  useEffect(() => {
    if (!activeAsset) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveAsset(null)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [activeAsset])

  return (
    <main className={styles.sampleMain}>
      <section className={styles.sampleTreeHero}>
        <div className={styles.treeInputColumn}>
          <div className={styles.urlInputPanel}>
            <div className={styles.sampleEyebrow}>
              <CheckCircle2 size={16} />
              <span>{labels.unlocked}</span>
            </div>
            <div className={styles.urlInputMock}>
              <span>{labels.inputUrl}</span>
              <strong>shipdaddy.ai</strong>
            </div>
            <p className={styles.sampleSaved}>{labels.savedFor}: {email}</p>
          </div>

          <div className={styles.treeDownArrow} aria-hidden="true">
            <span>↓</span>
          </div>

          <div className={styles.treeSystemNode}>
            <Sparkles size={18} />
            <div>
              <span>{labels.contentYouGet}</span>
              <strong>{labels.generatedSystem}</strong>
              <p>{labels.contentSummary}</p>
            </div>
          </div>
        </div>

        <div className={styles.treeOutputMap}>
          <div className={styles.treeOutputRail} aria-hidden="true" />
          <div className={styles.treePrimaryGrid}>
            {primaryOutputs.map((output) => (
              <TreeOutputCard key={output.id} output={output} variant="primary" />
            ))}
          </div>
          <div className={styles.treeSecondaryGrid}>
            {secondaryOutputs.map((output) => (
              <TreeOutputCard key={output.id} output={output} />
            ))}
          </div>
        </div>
      </section>

      <section className={styles.sampleResults} aria-label={labels.fullResults}>
        <ResultSection icon={<MessageSquareText size={17} />} label={labels.xPosts} title={xChannel.title}>
          <CopyBlock text={xChannel.body} />
        </ResultSection>

        <ResultSection icon={<MessageSquareText size={17} />} label={labels.redditPost} title={redditChannel.title}>
          <CopyBlock text={redditChannel.body} />
        </ResultSection>

        <ResultSection icon={<Search size={17} />} label={labels.subreddits} title="Subreddits to post in">
          <div className={styles.resultGrid}>
            {SAMPLE_SUBREDDITS.map((item) => (
              <ResultCard key={item.name} eyebrow="Where to post" title={item.name}>
                <p>{item.angle}</p>
                <p>{item.guidance}</p>
              </ResultCard>
            ))}
          </div>
        </ResultSection>

        <ResultSection icon={<Search size={17} />} label={labels.seoPlan} title="Premium SEO">
          <div className={styles.resultGrid}>
            {SAMPLE_SEO_PLAN.map((item) => (
              <ResultCard key={item.title} eyebrow={item.intent} title={item.title}>
                <p>{item.angle}</p>
              </ResultCard>
            ))}
          </div>
        </ResultSection>

        <ResultSection icon={<Target size={17} />} label={labels.prospects} title="Premium prospects: reviewed leads">
          <div className={styles.resultGrid}>
            {SAMPLE_PROSPECTS.map((item) => (
              <ResultCard key={item.name} eyebrow={item.segment} title={item.name}>
                <p>{item.fit}</p>
                <p>{item.outreachAngle}</p>
              </ResultCard>
            ))}
          </div>
        </ResultSection>

        <ResultSection icon={<Send size={17} />} label={labels.outreach} title="Premium outreach drafts">
          <div className={styles.resultGrid}>
            {SAMPLE_OUTREACH.map((item) => (
              <ResultCard key={item.title} eyebrow={item.cta} title={item.title}>
                <p>{item.body}</p>
              </ResultCard>
            ))}
          </div>
        </ResultSection>

        <ResultSection icon={<MonitorPlay size={17} />} label={labels.productDemo} title="Premium product demo script and walkthrough">
          <div className={styles.resultGrid}>
            {SAMPLE_PRODUCT_DEMO.map((item) => (
              <ResultCard key={item.title} eyebrow={item.format} title={item.title}>
                <p>{item.draft}</p>
              </ResultCard>
            ))}
          </div>
        </ResultSection>

        <ResultSection icon={<ImageIcon size={17} />} label={labels.mediaAssets} title="Premium creative assets">
          <div className={styles.mediaResultGrid}>
            {SAMPLE_MEDIA_ASSETS.map((asset) => (
              <MediaResultCard key={asset.id} asset={asset} onOpen={setActiveAsset} />
            ))}
          </div>
        </ResultSection>
      </section>

      {activeAsset ? (
        <MediaLightbox asset={activeAsset} onClose={() => setActiveAsset(null)} />
      ) : null}
    </main>
  )
}

function TreeOutputCard({
  output,
  variant = 'secondary',
}: {
  output: {
    icon: ReactNode
    title: string
    value: string
    sample: string
  }
  variant?: 'primary' | 'secondary'
}) {
  return (
    <article className={`${styles.treeOutputCard} ${variant === 'primary' ? styles.treeOutputCardPrimary : ''}`}>
      <div className={styles.treeOutputIcon}>{output.icon}</div>
      <h2>{output.title}</h2>
      <p>{output.value}</p>
      <strong>{output.sample}</strong>
    </article>
  )
}

function ResultSection({
  icon,
  label,
  title,
  children,
}: {
  icon: ReactNode
  label: string
  title: string
  children: ReactNode
}) {
  return (
    <section className={styles.resultSection}>
      <div className={styles.resultHeader}>
        <div className={styles.panelHeader}>
          {icon}
          <span>{label}</span>
        </div>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  )
}

function ResultCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: ReactNode
}) {
  return (
    <article className={styles.resultCard}>
      <span>{eyebrow}</span>
      <h3>{title}</h3>
      <div>{children}</div>
    </article>
  )
}

function CopyBlock({ text }: { text: string }) {
  return (
    <div className={styles.copyBlock}>
      {text.split('\n\n').map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  )
}

function MediaResultCard({
  asset,
  onOpen,
}: {
  asset: SampleMediaAsset
  onOpen: (asset: SampleMediaAsset) => void
}) {
  return (
    <button
      type="button"
      className={styles.mediaResultCard}
      onClick={() => onOpen(asset)}
      aria-label={`Open ${asset.title}`}
    >
      <div className={styles.mediaResultFrame}>
        {asset.type === 'video' ? (
          <video
            className={styles.sampleVideo}
            src={asset.src}
            poster={asset.poster}
            autoPlay
            muted
            loop
            playsInline
            controls
          >
            <track kind="captions" label="Captions" srcLang="en" />
          </video>
        ) : (
          <Image
            src={asset.src}
            alt={asset.title}
            width={asset.width}
            height={asset.height}
            unoptimized
            className={styles.sampleImage}
          />
        )}
      </div>
      <div>
        <span>{asset.label}</span>
        <strong>{asset.title}</strong>
      </div>
    </button>
  )
}

function MediaLightbox({
  asset,
  onClose,
}: {
  asset: SampleMediaAsset
  onClose: () => void
}) {
  const [viewport, setViewport] = useState({ width: 1200, height: 900 })

  useEffect(() => {
    const syncViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    syncViewport()
    window.addEventListener('resize', syncViewport)
    return () => window.removeEventListener('resize', syncViewport)
  }, [])

  const maxPreviewWidth = Math.max(280, viewport.width - 84)
  const maxPreviewHeight = Math.max(260, viewport.height - 150)
  const previewScale = Math.min(
    1,
    maxPreviewWidth / asset.width,
    maxPreviewHeight / asset.height,
  )
  const previewWidth = Math.round(asset.width * previewScale)
  const previewHeight = Math.round(asset.height * previewScale)
  const assetStyle: CSSProperties & {
    '--asset-width': string
    '--asset-height': string
  } = {
    '--asset-width': `${previewWidth}px`,
    '--asset-height': `${previewHeight}px`,
  }

  return (
    <div className={styles.mediaLightbox} role="dialog" aria-modal="true" aria-label={asset.title}>
      <button
        type="button"
        className={styles.mediaLightboxBackdrop}
        aria-label="Close preview"
        onClick={onClose}
      />
      <div className={styles.mediaLightboxPanel}>
        <div className={styles.mediaLightboxHeader}>
          <div>
            <span>{asset.label}</span>
            <strong>{asset.title}</strong>
          </div>
          <button type="button" onClick={onClose} aria-label="Close preview">
            <X size={18} />
          </button>
        </div>
        <div className={styles.mediaLightboxAsset} style={assetStyle}>
          {asset.type === 'video' ? (
            <video
              className={styles.sampleVideo}
              src={asset.src}
              poster={asset.poster}
              autoPlay
              muted
              loop
              playsInline
              controls
            >
              <track kind="captions" label="Captions" srcLang="en" />
            </video>
          ) : (
            <Image
              src={asset.src}
              alt={asset.title}
              width={asset.width}
              height={asset.height}
              unoptimized
              className={styles.sampleImage}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function getChannel(id: string): SampleChannel {
  return SAMPLE_CHANNELS.find((channel) => channel.id === id) || SAMPLE_CHANNELS[0]
}
