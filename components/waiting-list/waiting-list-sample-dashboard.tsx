'use client'

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
  SAMPLE_BRIEF_SIGNALS,
  SAMPLE_CHANNELS,
  SAMPLE_CREATIVE_ASSETS,
  SAMPLE_MEDIA_KIT,
  SAMPLE_OUTREACH,
  SAMPLE_PRODUCT_DEMO,
  SAMPLE_PROSPECTS,
  SAMPLE_SEO_PLAN,
  SAMPLE_SUBREDDITS,
  type SampleChannel,
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

const productHuntChannel = getChannel('product-hunt')
const hackerNewsChannel = getChannel('hacker-news')
const xChannel = getChannel('x')
const redditChannel = getChannel('reddit')
const linkedInChannel = getChannel('linkedin')
const emailChannel = getChannel('email')

const sampleMetrics = [
  { value: '8', label: 'channel drafts' },
  { value: '6', label: 'reddit targets' },
  { value: '4', label: 'creative prompts' },
  { value: '3', label: 'reviewed prospects' },
]

const workflowCards = [
  {
    icon: <Globe2 size={18} />,
    title: 'Source URL',
    body: 'shipdaddy.ai',
    status: 'Brief extracted',
  },
  {
    icon: <Sparkles size={18} />,
    title: 'Generation profile',
    body: 'Source-grounded, channel-native, proof-safe.',
    status: 'Shipdaddy prompt',
  },
  {
    icon: <LayoutDashboard size={18} />,
    title: 'Dashboard output',
    body: 'Copy, SEO, outreach, demo, creative, and media kit.',
    status: 'Ready to review',
  },
]

const navigationItems = [
  { icon: <Newspaper size={16} />, title: 'Launch copy', value: 'Product Hunt, HN, LinkedIn, email' },
  { icon: <MessageSquareText size={16} />, title: 'X thread', value: 'Blank-doc launch hook' },
  { icon: <Users size={16} />, title: 'Reddit post', value: 'Feedback-first community draft' },
  { icon: <Search size={16} />, title: 'SEO plan', value: 'Keywords, posts, backlinks' },
  { icon: <Target size={16} />, title: 'Prospects', value: 'Founder and curator targets' },
  { icon: <Send size={16} />, title: 'Outreach', value: 'Email, LinkedIn, X drafts' },
  { icon: <MonitorPlay size={16} />, title: 'Product demo', value: 'Workflow and shot list' },
  { icon: <ImageIcon size={16} />, title: 'Creative', value: 'Image and video prompts' },
]

const launchCopyChannels = [
  productHuntChannel,
  hackerNewsChannel,
  linkedInChannel,
  emailChannel,
]

export default function WaitingListSampleDashboard({
  email,
  labels,
}: {
  email: string
  labels: WaitingListSampleLabels
}) {
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
            <MetaRow label={labels.contentSummary} value="Free kit plus premium growth preview." />
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
              <div className={styles.sampleNavItem} key={item.title}>
                <span>{item.icon}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className={styles.sampleContentColumn}>
          <section className={styles.sampleBriefPanel}>
            <div className={styles.panelHeader}>
              <Sparkles size={16} />
              <span>Extracted brief</span>
            </div>
            <div className={styles.sampleBriefGrid}>
              {SAMPLE_BRIEF_SIGNALS.map((signal) => (
                <article className={styles.sampleBriefCard} key={signal.label}>
                  <span>{signal.label}</span>
                  <p>{signal.value}</p>
                </article>
              ))}
            </div>
          </section>

          <ResultSection icon={<FileText size={17} />} label={labels.generatedCopy} title="Free launch copy">
            <div className={styles.sampleChannelGrid}>
              {launchCopyChannels.map((channel) => (
                <ChannelPreviewCard channel={channel} key={channel.id} />
              ))}
            </div>
          </ResultSection>

          <ResultSection icon={<MessageSquareText size={17} />} label={labels.xPosts} title={xChannel.title}>
            <CopyBlock text={xChannel.body} />
          </ResultSection>

          <ResultSection icon={<Users size={17} />} label={labels.redditPost} title={redditChannel.title}>
            <CopyBlock text={redditChannel.body} />
          </ResultSection>

          <ResultSection icon={<Search size={17} />} label={labels.subreddits} title="Subreddits to evaluate">
            <div className={styles.resultGrid}>
              {SAMPLE_SUBREDDITS.map((item) => (
                <ResultCard key={item.name} eyebrow="Where to test" title={item.name}>
                  <p>{item.angle}</p>
                  <p>{item.guidance}</p>
                </ResultCard>
              ))}
            </div>
          </ResultSection>

          <ResultSection icon={<Search size={17} />} label={labels.seoPlan} title="Premium SEO and GEO plan">
            <div className={styles.resultGrid}>
              {SAMPLE_SEO_PLAN.map((item) => (
                <ResultCard key={item.title} eyebrow={item.intent} title={item.title}>
                  <p>{item.angle}</p>
                </ResultCard>
              ))}
            </div>
          </ResultSection>

          <ResultSection icon={<Target size={17} />} label={labels.prospects} title="Premium prospects">
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

          <ResultSection icon={<MonitorPlay size={17} />} label={labels.productDemo} title="Premium product demo script">
            <div className={styles.resultGrid}>
              {SAMPLE_PRODUCT_DEMO.map((item) => (
                <ResultCard key={item.title} eyebrow={item.format} title={item.title}>
                  <p>{item.draft}</p>
                </ResultCard>
              ))}
            </div>
          </ResultSection>

          <ResultSection icon={<ImageIcon size={17} />} label={labels.mediaAssets} title="Premium creative prompts">
            <div className={styles.sampleCreativeGrid}>
              {SAMPLE_CREATIVE_ASSETS.map((asset) => (
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
        </div>

        <aside className={styles.sampleInsightRail}>
          <section className={styles.sampleRailPanel}>
            <div className={styles.panelHeader}>
              <Gift size={16} />
              <span>{labels.mediaKit}</span>
            </div>
            <div className={styles.mediaKitBlock}>
              <strong>One-liner</strong>
              <p>{SAMPLE_MEDIA_KIT.oneLiner}</p>
            </div>
            <div className={styles.mediaKitBlock}>
              <strong>Press hook</strong>
              <p>{SAMPLE_MEDIA_KIT.pressHook}</p>
            </div>
          </section>

          <section className={styles.sampleRailPanel}>
            <div className={styles.panelHeader}>
              <Mail size={16} />
              <span>{labels.cta}</span>
            </div>
            <div className={styles.sampleReviewList}>
              <p>Primary CTA: Try the sample launch kit</p>
              <p>Secondary CTA: Generate from your product URL</p>
              <p>Premium CTA: Turn the confirmed brief into growth work</p>
            </div>
          </section>

          <section className={styles.sampleRailPanel}>
            <div className={styles.panelHeader}>
              <CheckCircle2 size={16} />
              <span>{labels.notes}</span>
            </div>
            <div className={styles.sampleReviewList}>
              <p>Keep the founder review boundary clear.</p>
              <p>Do not invent customer counts, revenue, or traction.</p>
              <p>Review subreddit rules before posting.</p>
              <p>Keep premium growth work separate until the core story works.</p>
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

function getChannel(id: string): SampleChannel {
  return SAMPLE_CHANNELS.find((channel) => channel.id === id) || SAMPLE_CHANNELS[0]
}
