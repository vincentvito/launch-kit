'use client'

import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  BookOpenText,
  CheckCircle2,
  FileText,
  Gift,
  Globe2,
  ImageIcon,
  LayoutDashboard,
  Mail,
  MessageSquareText,
  MonitorPlay,
  Newspaper,
  Search,
  Send,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import {
  type SampleChannel,
  type WaitingListSampleData,
} from '@/components/waiting-list/sample-data'
import { waitingListStyles as styles } from '@/components/waiting-list/waiting-list-styles'

export type WaitingListSampleLabels = {
  unlocked: string
  generatedFor: string
  subtitle: string
  inputUrl: string
  contentYouGet: string
  contentSummary: string
  contentSummaryValue: string
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
  metrics: {
    channelDrafts: string
    redditTargets: string
    creativePrompts: string
    reviewedProspects: string
  }
  workflow: {
    sourceUrl: WaitingListWorkflowLabel
    generationProfile: WaitingListWorkflowLabel
    dashboardOutput: WaitingListWorkflowLabel
  }
  navigation: {
    launchCopy: WaitingListNavigationLabel
    xThread: WaitingListNavigationLabel
    redditPost: WaitingListNavigationLabel
    seoPlan: WaitingListNavigationLabel
    prospects: WaitingListNavigationLabel
    outreach: WaitingListNavigationLabel
    productDemo: WaitingListNavigationLabel
    creative: WaitingListNavigationLabel
  }
  sections: {
    extractedBrief: string
    freeLaunchCopy: string
    subredditsToEvaluate: string
    whereToTest: string
    premiumSeo: string
    premiumProspects: string
    premiumOutreach: string
    premiumProductDemo: string
    premiumCreative: string
    oneLiner: string
    pressHook: string
  }
  ctaItems: string[]
  noteItems: string[]
}

type WaitingListWorkflowLabel = {
  title: string
  body: string
  status: string
}

type WaitingListNavigationLabel = {
  title: string
  value: string
}

type SampleSectionId =
  | 'launch-copy'
  | 'x-thread'
  | 'reddit-post'
  | 'seo-plan'
  | 'prospects'
  | 'outreach'
  | 'product-demo'
  | 'creative'

export default function WaitingListSampleDashboard({
  email,
  labels,
  sampleData,
}: {
  email: string
  labels: WaitingListSampleLabels
  sampleData: WaitingListSampleData
}) {
  const [activeSection, setActiveSection] = useState<SampleSectionId>('launch-copy')
  const activeContentRef = useRef<HTMLDivElement>(null)
  const productHuntChannel = getChannel('product-hunt', sampleData.channels)
  const hackerNewsChannel = getChannel('hacker-news', sampleData.channels)
  const xChannel = getChannel('x', sampleData.channels)
  const redditChannel = getChannel('reddit', sampleData.channels)
  const linkedInChannel = getChannel('linkedin', sampleData.channels)
  const emailChannel = getChannel('email', sampleData.channels)
  const launchCopyChannels = [
    productHuntChannel,
    hackerNewsChannel,
    linkedInChannel,
    emailChannel,
  ]
  const sampleMetrics = [
    { value: '8', label: labels.metrics.channelDrafts },
    { value: '6', label: labels.metrics.redditTargets },
    { value: '4', label: labels.metrics.creativePrompts },
    { value: '3', label: labels.metrics.reviewedProspects },
  ]
  const workflowCards = [
    {
      icon: <Globe2 size={18} />,
      ...labels.workflow.sourceUrl,
    },
    {
      icon: <Sparkles size={18} />,
      ...labels.workflow.generationProfile,
    },
    {
      icon: <LayoutDashboard size={18} />,
      ...labels.workflow.dashboardOutput,
    },
  ]
  const navigationItems: Array<{
    id: SampleSectionId
    icon: ReactNode
    title: string
    value: string
  }> = [
    { id: 'launch-copy', icon: <Newspaper size={16} />, ...labels.navigation.launchCopy },
    { id: 'x-thread', icon: <MessageSquareText size={16} />, ...labels.navigation.xThread },
    { id: 'reddit-post', icon: <Users size={16} />, ...labels.navigation.redditPost },
    { id: 'seo-plan', icon: <Search size={16} />, ...labels.navigation.seoPlan },
    { id: 'prospects', icon: <Target size={16} />, ...labels.navigation.prospects },
    { id: 'outreach', icon: <Send size={16} />, ...labels.navigation.outreach },
    { id: 'product-demo', icon: <MonitorPlay size={16} />, ...labels.navigation.productDemo },
    { id: 'creative', icon: <ImageIcon size={16} />, ...labels.navigation.creative },
  ]

  const activeContent = {
    'launch-copy': (
      <ResultSection icon={<FileText size={17} />} label={labels.generatedCopy} title={labels.sections.freeLaunchCopy}>
        <div className={styles.sampleChannelGrid}>
          {launchCopyChannels.map((channel) => (
            <ChannelPreviewCard channel={channel} key={channel.id} />
          ))}
        </div>
      </ResultSection>
    ),
    'x-thread': (
      <ResultSection icon={<MessageSquareText size={17} />} label={labels.xPosts} title={xChannel.title}>
        <CopyBlock text={xChannel.body} />
      </ResultSection>
    ),
    'reddit-post': (
      <ResultSection icon={<Users size={17} />} label={labels.redditPost} title={redditChannel.title}>
        <CopyBlock text={redditChannel.body} />
        <div className={styles.sampleRelatedGrid}>
          {sampleData.subreddits.map((item) => (
            <ResultCard key={item.name} eyebrow={labels.sections.whereToTest} title={item.name}>
              <p>{item.angle}</p>
              <p>{item.guidance}</p>
            </ResultCard>
          ))}
        </div>
      </ResultSection>
    ),
    'seo-plan': (
      <ResultSection icon={<Search size={17} />} label={labels.seoPlan} title={labels.sections.premiumSeo}>
        <div className={styles.resultGrid}>
          {sampleData.seoPlan.map((item) => (
            <ResultCard key={item.title} eyebrow={item.intent} title={item.title}>
              <p>{item.angle}</p>
            </ResultCard>
          ))}
        </div>
      </ResultSection>
    ),
    prospects: (
      <ResultSection icon={<Target size={17} />} label={labels.prospects} title={labels.sections.premiumProspects}>
        <div className={styles.resultGrid}>
          {sampleData.prospects.map((item) => (
            <ResultCard key={item.name} eyebrow={item.segment} title={item.name}>
              <p>{item.fit}</p>
              <p>{item.outreachAngle}</p>
            </ResultCard>
          ))}
        </div>
      </ResultSection>
    ),
    outreach: (
      <ResultSection icon={<Send size={17} />} label={labels.outreach} title={labels.sections.premiumOutreach}>
        <div className={styles.resultGrid}>
          {sampleData.outreach.map((item) => (
            <ResultCard key={item.title} eyebrow={item.cta} title={item.title}>
              <p>{item.body}</p>
            </ResultCard>
          ))}
        </div>
      </ResultSection>
    ),
    'product-demo': (
      <ResultSection icon={<MonitorPlay size={17} />} label={labels.productDemo} title={labels.sections.premiumProductDemo}>
        <div className={styles.resultGrid}>
          {sampleData.productDemo.map((item) => (
            <ResultCard key={item.title} eyebrow={item.format} title={item.title}>
              <p>{item.draft}</p>
            </ResultCard>
          ))}
        </div>
      </ResultSection>
    ),
    creative: (
      <ResultSection icon={<ImageIcon size={17} />} label={labels.mediaAssets} title={labels.sections.premiumCreative}>
        <div className={styles.sampleCreativeGrid}>
          {sampleData.creativeAssets.map((asset) => (
            <article className={styles.sampleCreativeCard} key={asset.id}>
              <div>
                <span>{asset.label}</span>
                <strong>{asset.format}</strong>
              </div>
              <h3>{asset.title}</h3>
              <p>{asset.prompt}</p>
            </article>
          ))}
        </div>
      </ResultSection>
    ),
  } satisfies Record<SampleSectionId, ReactNode>

  const selectSection = (sectionId: SampleSectionId) => {
    setActiveSection(sectionId)
    window.requestAnimationFrame(() => {
      activeContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <main className={styles.sampleMain}>
      <section className={styles.sampleDashboardHero}>
        <div className={styles.sampleHeroCard}>
          <div className={styles.sampleEyebrow}>
            <CheckCircle2 size={16} />
            <span>{labels.unlocked}</span>
          </div>
          <h1>{labels.generatedFor}</h1>
          <p>{labels.subtitle}</p>
          <div className={styles.sampleMetricGrid}>
            {sampleMetrics.map((metric) => (
              <div className={styles.sampleMetric} key={metric.label}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.sampleRunCard}>
          <div className={styles.sampleRunHeader}>
            <div>
              <span>{labels.contentYouGet}</span>
              <strong>{labels.generatedSystem}</strong>
            </div>
            <Sparkles size={20} />
          </div>
          <div className={styles.sampleRunRows}>
            <MetaRow label={labels.inputUrl} value="shipdaddy.ai" />
            <MetaRow label={labels.savedFor} value={email} />
            <MetaRow label={labels.contentSummary} value={labels.contentSummaryValue} />
          </div>
        </div>
      </section>

      <section className={styles.sampleWorkflowGrid} aria-label={labels.fullResults}>
        {workflowCards.map((card) => (
          <article className={styles.sampleWorkflowCard} key={card.title}>
            <span>{card.icon}</span>
            <div>
              <p>{card.status}</p>
              <h2>{card.title}</h2>
              <strong>{card.body}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.sampleDashboardGrid}>
        <aside className={styles.sampleSidebar}>
          <div className={styles.panelHeader}>
            <BookOpenText size={16} />
            <span>{labels.channels}</span>
          </div>
          <div className={styles.sampleNavList}>
            {navigationItems.map((item) => (
              <button
                type="button"
                className={`${styles.sampleNavItem} ${
                  activeSection === item.id ? styles.sampleNavItemActive : ''
                }`}
                key={item.id}
                onClick={() => selectSection(item.id)}
                aria-pressed={activeSection === item.id}
              >
                <span>{item.icon}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.value}</p>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div className={styles.sampleContentColumn}>
          <div className={styles.sampleActiveContent} ref={activeContentRef}>
            {activeContent[activeSection]}
          </div>

          <section className={styles.sampleBriefPanel}>
            <div className={styles.panelHeader}>
              <Sparkles size={16} />
              <span>{labels.sections.extractedBrief}</span>
            </div>
            <div className={styles.sampleBriefGrid}>
              {sampleData.briefSignals.map((signal) => (
                <article className={styles.sampleBriefCard} key={signal.label}>
                  <span>{signal.label}</span>
                  <p>{signal.value}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className={styles.sampleInsightRail}>
          <section className={styles.sampleRailPanel}>
            <div className={styles.panelHeader}>
              <Gift size={16} />
              <span>{labels.mediaKit}</span>
            </div>
            <div className={styles.mediaKitBlock}>
              <strong>{labels.sections.oneLiner}</strong>
              <p>{sampleData.mediaKit.oneLiner}</p>
            </div>
            <div className={styles.mediaKitBlock}>
              <strong>{labels.sections.pressHook}</strong>
              <p>{sampleData.mediaKit.pressHook}</p>
            </div>
          </section>

          <section className={styles.sampleRailPanel}>
            <div className={styles.panelHeader}>
              <Mail size={16} />
              <span>{labels.cta}</span>
            </div>
            <div className={styles.sampleReviewList}>
              {labels.ctaItems.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </section>

          <section className={styles.sampleRailPanel}>
            <div className={styles.panelHeader}>
              <CheckCircle2 size={16} />
              <span>{labels.notes}</span>
            </div>
            <div className={styles.sampleReviewList}>
              {labels.noteItems.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.sampleMetaRow}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function ChannelPreviewCard({ channel }: { channel: SampleChannel }) {
  return (
    <article className={styles.sampleChannelCard}>
      <span>{channel.eyebrow}</span>
      <h3>{channel.title}</h3>
      <p>{channel.body.split('\n\n')[0]}</p>
      <div>
        <strong>{channel.cta}</strong>
        <small>{channel.notes}</small>
      </div>
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

function getChannel(id: string, channels: SampleChannel[]): SampleChannel {
  return channels.find((channel) => channel.id === id) || channels[0] || EMPTY_CHANNEL
}

const EMPTY_CHANNEL: SampleChannel = {
  id: '',
  label: '',
  eyebrow: '',
  title: '',
  body: '',
  cta: '',
  notes: '',
}
