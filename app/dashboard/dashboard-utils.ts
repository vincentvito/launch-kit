import {
  CHANNEL_PACK_IDS,
  PLATFORM_IDS,
  type ChannelCard,
  type ChannelPackId,
  type GrowthBlockId,
  type LaunchKit,
  type LaunchProjectSnapshot,
  type PlatformBlock,
  type PlatformBlockId,
  type RedditRecommendations,
  type SubredditRecommendation,
} from '@/lib/launch-kit/types'
import { normalizeBrief, normalizeKit } from '@/lib/launch-kit/normalizers'
import {
  FREE_CHANNEL_PACK_IDS,
  FREE_PLATFORM_BLOCK_IDS,
  isFreeChannelCard,
} from '@/lib/launch-kit/plans'
import { GUEST_PROJECTS_KEY, type TrafficChannelId } from './dashboard-config'

export function splitLines(input: string): string[] {
  return input.split(/\r?\n/).flatMap((line) => {
    const trimmed = line.trim()
    return trimmed ? [trimmed] : []
  })
}

export function splitEditableLines(input: string): string[] {
  return input.split(/\r?\n/)
}

export function getPlatformBlockIdForTrafficChannel(channelId: TrafficChannelId): PlatformBlockId | null {
  if (
    channelId === 'product_hunt' ||
    channelId === 'hacker_news' ||
    channelId === 'email_announcement'
  ) {
    return channelId
  }

  return null
}

export function getChannelPackIdForTrafficChannel(channelId: TrafficChannelId): ChannelPackId | null {
  return CHANNEL_PACK_IDS.includes(channelId as ChannelPackId) ? (channelId as ChannelPackId) : null
}

export function getGrowthBlockIdForTrafficChannel(channelId: TrafficChannelId): GrowthBlockId | null {
  if (
    channelId === 'linkedin_outreach' ||
    channelId === 'x_outreach' ||
    channelId === 'cold_email_outreach'
  ) {
    return channelId
  }

  return null
}

export function isPlaybookChannel(channelId: TrafficChannelId) {
  return (
    channelId === 'launch_directories' ||
    channelId === 'trustmrr' ||
    channelId === 'acquire_com' ||
    channelId === 'flippa' ||
    channelId === 'comparison_alternatives' ||
    channelId === 'guest_posts' ||
    channelId === 'partner_pages' ||
    channelId === 'directory_outreach' ||
    channelId === 'pr_pitch' ||
    channelId === 'podcast_pitch' ||
    channelId === 'newsletter_partnerships'
  )
}

export function formatOutreachPackForCopy(
  pack: LaunchKit['growthAssets']['linkedinOutreach'],
  labels: {
    notes: string
    subject: string
    cta: string
  },
  includeSubject = false,
): string {
  if (!pack.variants.length) {
    return ''
  }

  return [
    pack.notes ? `${labels.notes}: ${pack.notes}` : '',
    ...pack.variants.map((variant) =>
      [
        variant.title,
        includeSubject && variant.subject ? `${labels.subject}: ${variant.subject}` : '',
        variant.message,
        `${labels.cta}: ${variant.cta}`,
      ]
        .filter(Boolean)
        .join('\n'),
    ),
  ]
    .filter(Boolean)
    .join('\n\n')
}

export function formatChannelCardForCopy(
  channelId: ChannelPackId,
  card: ChannelCard,
  labels: {
    cta: string
    proofPoint: string
    socialContract: string
  },
): string {
  if (channelId === 'x') {
    return card.body
  }

  return [
    card.title,
    card.body,
    card.cta ? `${labels.cta}: ${card.cta}` : '',
    card.proofPoint ? `${labels.proofPoint}: ${card.proofPoint}` : '',
    card.socialContractNote ? `${labels.socialContract}: ${card.socialContractNote}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
}

export function formatSeoPostsForCopy(
  posts: LaunchKit['growthAssets']['seoPostPacks'],
  labels: {
    cluster: string
    meta: string
    outline: string
    cta: string
  },
): string {
  if (!posts.length) {
    return ''
  }

  return posts
    .map((post) =>
      [
        post.title,
        `${labels.cluster}: ${post.keywordTopic}`,
        `${labels.meta}: ${post.metaDescription}`,
        post.outline.length ? `${labels.outline}: ${post.outline.join(' | ')}` : '',
        post.draft,
        `${labels.cta}: ${post.cta}`,
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .join('\n\n---\n\n')
}

export function formatRedditRecommendationsForCopy(
  recommendations: RedditRecommendations,
  labels: {
    engagement: string
    selfPromotion: string
    reason: string
    postingGuidance: string
  },
): string {
  const sections = [
    formatSubredditRecommendationSection(labels.engagement, recommendations.engagementSubreddits, labels),
    formatSubredditRecommendationSection(labels.selfPromotion, recommendations.selfPromotionSubreddits, labels),
  ].filter(Boolean)

  return sections.join('\n\n')
}

function formatSubredditRecommendationSection(
  title: string,
  recommendations: SubredditRecommendation[],
  labels: {
    reason: string
    postingGuidance: string
  },
): string {
  if (!recommendations.length) {
    return ''
  }

  return [
    title,
    ...recommendations.map((recommendation) =>
      [
        `${recommendation.name}: ${recommendation.url}`,
        `${labels.reason}: ${recommendation.reason}`,
        `${labels.postingGuidance}: ${recommendation.postingGuidance}`,
      ].join('\n'),
    ),
  ].join('\n\n')
}

export function readGuestProjects(): LaunchProjectSnapshot[] {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(GUEST_PROJECTS_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as LaunchProjectSnapshot[]
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.map((snapshot) => normalizeSnapshot(snapshot))
  } catch {
    return []
  }
}

export function writeGuestProjects(projects: LaunchProjectSnapshot[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(GUEST_PROJECTS_KEY, JSON.stringify(projects.slice(0, 40)))
}

function normalizeSnapshot(snapshot: LaunchProjectSnapshot): LaunchProjectSnapshot {
  const brief = normalizeBrief(snapshot.brief, {
    sourceUrl: snapshot.sourceUrl,
    language: snapshot.language,
    productName: snapshot.name,
  })
  const kit = normalizeKit(snapshot.kit, snapshot.language || brief.language)
  return {
    ...snapshot,
    brief,
    kit,
    language: snapshot.language || brief.language,
  }
}

export function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'launch-kit'
}

export function parseNumberFilter(value: string): number | null {
  const parsed = Number(value.replace(/[$,\s]/g, ''))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

export function formatTraffic(value: number | null, unknownLabel: string): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return unknownLabel
  }

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M`
  }

  if (value >= 1000) {
    return `${Math.round(value / 1000)}K`
  }

  return value.toLocaleString()
}

export function formatCost(value: number | null, unknownLabel: string): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return unknownLabel
  }

  return `$${value.toLocaleString()}`
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1200)
}

export type ExportLabels = {
  launchKitPrefix: string
  sourceUrl: string
  language: string
  brief: string
  product: string
  positioning: string
  icp: string
  targetUsers: string
  voiceGuide: string
  painPoints: string
  valueProps: string
  proofPoints: string
  primaryCta: string
  keywordResearch: string
  intent: string
  priority: string
  keywords: string
  contentAngles: string
  platformBlocks: string
  channelPacks: string
  title: string
  cta: string
  notes: string
  productHuntTagline: string
  productHuntDescription: string
  productHuntTags: string
  productHuntFirstComment: string
  hackerNewsShowHnTitle: string
  hackerNewsPostBody: string
  hackerNewsFeedbackAsk: string
  hackerNewsDiscussionSeed: string
  redditPostTitle: string
  redditPostBody: string
  redditBuilderDisclosure: string
  redditDiscussionQuestion: string
  redditLinkPolicyNote: string
  indieHackersPostTitle: string
  indieHackersFounderStory: string
  indieHackersLesson: string
  indieHackersProofOrMetric: string
  indieHackersNextExperiment: string
  indieHackersFeedbackAsk: string
  linkedinHook: string
  linkedinPostBody: string
  linkedinProofPoint: string
  linkedinClosingCta: string
  shortVideoTitle: string
  shortVideoHook: string
  shortVideoSpokenScript: string
  shortVideoVisualBeats: string
  shortVideoOnScreenText: string
  shortVideoRetentionCue: string
  shortVideoCloseCta: string
  emailSubject: string
  emailPreviewText: string
  emailGreeting: string
  emailOpening: string
  emailBody: string
  emailCtaText: string
  emailSignoff: string
  format: string
  stage: string
  proofPoint: string
  socialContract: string
  redditEngagementSubreddits: string
  redditSelfPromotionSubreddits: string
  redditReason: string
  redditPostingGuidance: string
  mediaKit: string
  founderCompanyBio: string
  productOneLiner: string
  boilerplate: string
  pressRelease: string
  keyVisualsChecklist: string
  screenshotsAndLogos: string
  contactDetails: string
  growthAssets: string
  linkedinOutreach: string
  xOutreach: string
  coldEmailOutreach: string
  noSubject: string
  seoPacks: string
  prospecting: string
  leads: string
  personalizedOutreach: string
  emailJobs: string
  seoGrowth: string
  websiteSeoAnalysis: string
  blogStrategy: string
  freeTools: string
  backlinkProspects: string
  valueScore: string
  status: string
  pressPackTitleSuffix: string
  pressPackSourceLabel: string
  platformLabels: Record<PlatformBlockId, string>
}

export function getExportLabels(t: (key: string, values?: Record<string, string | number>) => string): ExportLabels {
  return {
    launchKitPrefix: t('export.markdown.launchKitPrefix'),
    sourceUrl: t('export.markdown.sourceUrl'),
    language: t('export.markdown.language'),
    brief: t('export.markdown.brief'),
    product: t('export.markdown.product'),
    positioning: t('export.markdown.positioning'),
    icp: t('export.markdown.icp'),
    targetUsers: t('export.markdown.targetUsers'),
    voiceGuide: t('export.markdown.voiceGuide'),
    painPoints: t('export.markdown.painPoints'),
    valueProps: t('export.markdown.valueProps'),
    proofPoints: t('export.markdown.proofPoints'),
    primaryCta: t('export.markdown.primaryCta'),
    keywordResearch: t('export.markdown.keywordResearch'),
    intent: t('export.markdown.intent'),
    priority: t('export.markdown.priority'),
    keywords: t('export.markdown.keywords'),
    contentAngles: t('export.markdown.contentAngles'),
    platformBlocks: t('export.markdown.platformBlocks'),
    channelPacks: t('export.markdown.channelPacks'),
    title: t('output.titleLabel'),
    cta: t('output.copyCtaPrefix'),
    notes: t('output.copyNotesPrefix'),
    productHuntTagline: t('output.productHunt.tagline'),
    productHuntDescription: t('output.productHunt.description'),
    productHuntTags: t('output.productHunt.tags'),
    productHuntFirstComment: t('output.productHunt.firstComment'),
    hackerNewsShowHnTitle: t('output.hackerNews.showHnTitle'),
    hackerNewsPostBody: t('output.hackerNews.postBody'),
    hackerNewsFeedbackAsk: t('output.hackerNews.feedbackAsk'),
    hackerNewsDiscussionSeed: t('output.hackerNews.discussionSeed'),
    redditPostTitle: t('output.redditPost.postTitle'),
    redditPostBody: t('output.redditPost.postBody'),
    redditBuilderDisclosure: t('output.redditPost.builderDisclosure'),
    redditDiscussionQuestion: t('output.redditPost.discussionQuestion'),
    redditLinkPolicyNote: t('output.redditPost.linkPolicyNote'),
    indieHackersPostTitle: t('output.indieHackers.postTitle'),
    indieHackersFounderStory: t('output.indieHackers.founderStory'),
    indieHackersLesson: t('output.indieHackers.lesson'),
    indieHackersProofOrMetric: t('output.indieHackers.proofOrMetric'),
    indieHackersNextExperiment: t('output.indieHackers.nextExperiment'),
    indieHackersFeedbackAsk: t('output.indieHackers.feedbackAsk'),
    linkedinHook: t('output.linkedinPost.hook'),
    linkedinPostBody: t('output.linkedinPost.postBody'),
    linkedinProofPoint: t('output.linkedinPost.proofPoint'),
    linkedinClosingCta: t('output.linkedinPost.closingCta'),
    shortVideoTitle: t('output.shortVideo.title'),
    shortVideoHook: t('output.shortVideo.hook'),
    shortVideoSpokenScript: t('output.shortVideo.spokenScript'),
    shortVideoVisualBeats: t('output.shortVideo.visualBeats'),
    shortVideoOnScreenText: t('output.shortVideo.onScreenText'),
    shortVideoRetentionCue: t('output.shortVideo.retentionCue'),
    shortVideoCloseCta: t('output.shortVideo.closeCta'),
    emailSubject: t('output.emailAnnouncement.subject'),
    emailPreviewText: t('output.emailAnnouncement.previewText'),
    emailGreeting: t('output.emailAnnouncement.greeting'),
    emailOpening: t('output.emailAnnouncement.opening'),
    emailBody: t('output.emailAnnouncement.body'),
    emailCtaText: t('output.emailAnnouncement.ctaText'),
    emailSignoff: t('output.emailAnnouncement.signoff'),
    format: t('output.formatLabel'),
    stage: t('output.stageLabel'),
    proofPoint: t('output.proofPointLabel'),
    socialContract: t('output.socialContractLabel'),
    redditEngagementSubreddits: t('output.reddit.engagementTitle'),
    redditSelfPromotionSubreddits: t('output.reddit.selfPromotionTitle'),
    redditReason: t('output.reddit.reasonLabel'),
    redditPostingGuidance: t('output.reddit.postingGuidanceLabel'),
    mediaKit: t('export.markdown.mediaKit'),
    founderCompanyBio: t('mediaKit.fields.bio'),
    productOneLiner: t('mediaKit.fields.oneLiner'),
    boilerplate: t('mediaKit.fields.boilerplate'),
    pressRelease: t('mediaKit.fields.pressRelease'),
    keyVisualsChecklist: t('mediaKit.fields.checklist'),
    screenshotsAndLogos: t('mediaKit.fields.screenshots'),
    contactDetails: t('mediaKit.fields.contact'),
    growthAssets: t('export.markdown.growthAssets'),
    linkedinOutreach: t('growth.outputLabels.linkedin_outreach'),
    xOutreach: t('growth.outputLabels.x_outreach'),
    coldEmailOutreach: t('growth.outputLabels.cold_email_outreach'),
    noSubject: t('export.markdown.noSubject'),
    seoPacks: t('growth.outputLabels.seo_posts'),
    prospecting: t('export.markdown.prospecting'),
    leads: t('export.markdown.leads'),
    personalizedOutreach: t('export.markdown.personalizedOutreach'),
    emailJobs: t('export.markdown.emailJobs'),
    seoGrowth: t('growth.seo.title'),
    websiteSeoAnalysis: t('growth.seo.analysis.title'),
    blogStrategy: t('growth.seo.blog.title'),
    freeTools: t('growth.seo.tools.title'),
    backlinkProspects: t('growth.seo.backlinks.title'),
    valueScore: t('growth.seo.backlinks.headers.value'),
    status: t('growth.seo.backlinks.headers.status'),
    pressPackTitleSuffix: t('export.pressPack.titleSuffix'),
    pressPackSourceLabel: t('export.pressPack.sourceLabel'),
    platformLabels: {
      product_hunt: t('platformLabels.product_hunt'),
      hacker_news: t('platformLabels.hacker_news'),
      reddit: t('platformLabels.reddit'),
      indie_hackers: t('platformLabels.indie_hackers'),
      linkedin: t('platformLabels.linkedin'),
      tiktok: t('platformLabels.tiktok'),
      youtube_shorts: t('platformLabels.youtube_shorts'),
      email_announcement: t('platformLabels.email_announcement'),
    },
  }
}

export function buildMarkdown(project: LaunchProjectSnapshot, labels: ExportLabels): string {
  const lines: string[] = []
  lines.push(`# ${labels.launchKitPrefix}: ${project.name}`)
  lines.push('')
  lines.push(`- ${labels.sourceUrl}: ${project.sourceUrl}`)
  lines.push(`- ${labels.language}: ${project.language}`)
  lines.push('')

  lines.push(`## ${labels.brief}`)
  lines.push(`- ${labels.product}: ${project.brief.productName}`)
  lines.push(`- ${labels.positioning}: ${project.brief.positioning}`)
  lines.push(`- ${labels.icp}: ${project.brief.icp}`)
  lines.push(`- ${labels.voiceGuide}: ${project.brief.voiceGuide}`)
  lines.push('')

  lines.push(`### ${labels.targetUsers}`)
  for (const user of project.brief.targetUsers) {
    lines.push(`- ${user}`)
  }
  lines.push('')

  lines.push(`### ${labels.painPoints}`)
  for (const pain of project.brief.painPoints) {
    lines.push(`- ${pain}`)
  }
  lines.push('')

  lines.push(`### ${labels.valueProps}`)
  for (const value of project.brief.valueProps) {
    lines.push(`- ${value}`)
  }
  lines.push('')

  lines.push(`### ${labels.proofPoints}`)
  for (const proof of project.brief.proofPoints) {
    lines.push(`- ${proof}`)
  }
  lines.push('')

  lines.push(`### ${labels.primaryCta}`)
  lines.push(project.brief.cta)
  lines.push('')

  lines.push(`## ${labels.platformBlocks}`)
  lines.push('')
  for (const blockId of FREE_PLATFORM_BLOCK_IDS) {
    if (shouldSkipPlatformBlockInExport(blockId, project.kit)) {
      continue
    }

    const block = project.kit.platformBlocks[blockId]
    lines.push(`### ${labels.platformLabels[blockId]}`)
    appendNativePlatformBlockMarkdown(lines, block, labels)
    lines.push(`${labels.notes}: ${block.notes}`)
    lines.push('')

    if (blockId === 'reddit' && block.redditRecommendations) {
      appendRedditRecommendationsMarkdown(lines, block.redditRecommendations, {
        engagement: labels.redditEngagementSubreddits,
        selfPromotion: labels.redditSelfPromotionSubreddits,
        reason: labels.redditReason,
        postingGuidance: labels.redditPostingGuidance,
      })
    }
  }

  lines.push(`## ${labels.channelPacks}`)
  lines.push('')
  for (const channelId of FREE_CHANNEL_PACK_IDS) {
    const pack = project.kit.channelPacks[channelId]
    const cards = pack.cards.filter((card) => isFreeChannelCard(channelId, card.id))
    if (!cards.length) {
      continue
    }

    lines.push(`### ${pack.label}`)
    if (pack.notes) {
      lines.push(`${labels.notes}: ${pack.notes}`)
      lines.push('')
    }

    for (const card of cards) {
      lines.push(`#### ${channelId === 'x' ? card.format : card.title}`)
      lines.push(`- ${labels.format}: ${card.format}`)
      lines.push(`- ${labels.stage}: ${card.stage}`)
      if (card.proofPoint) {
        lines.push(`- ${labels.proofPoint}: ${card.proofPoint}`)
      }
      lines.push('')
      lines.push(card.body)
      lines.push('')
      lines.push(`${labels.cta}: ${card.cta}`)
      if (card.socialContractNote) {
        lines.push(`${labels.socialContract}: ${card.socialContractNote}`)
      }
      lines.push('')
    }

    if (channelId === 'reddit' && pack.redditRecommendations) {
      appendRedditRecommendationsMarkdown(lines, pack.redditRecommendations, {
        engagement: labels.redditEngagementSubreddits,
        selfPromotion: labels.redditSelfPromotionSubreddits,
        reason: labels.redditReason,
        postingGuidance: labels.redditPostingGuidance,
      })
    }
  }

  lines.push(`## ${labels.mediaKit}`)
  lines.push(`${labels.founderCompanyBio}: ${project.kit.mediaKit.founderCompanyBio}`)
  lines.push('')
  lines.push(`${labels.productOneLiner}: ${project.kit.mediaKit.productOneLiner}`)
  lines.push('')
  lines.push(`${labels.boilerplate}: ${project.kit.mediaKit.boilerplate}`)
  lines.push('')
  lines.push(`${labels.pressRelease}: ${project.kit.mediaKit.pressRelease}`)
  lines.push('')
  lines.push(`${labels.keyVisualsChecklist}:`)
  for (const item of project.kit.mediaKit.keyVisualsChecklist) {
    lines.push(`- ${item}`)
  }
  lines.push('')
  lines.push(`${labels.screenshotsAndLogos}: ${project.kit.mediaKit.screenshotsAndLogos}`)
  lines.push('')
  lines.push(`${labels.contactDetails}: ${project.kit.mediaKit.contactDetails}`)
  lines.push('')

  return lines.join('\n')
}

function appendNativePlatformBlockMarkdown(
  lines: string[],
  block: PlatformBlock,
  labels: ExportLabels,
) {
  if (block.productHunt) {
    lines.push(`${labels.productHuntTagline}: ${block.productHunt.tagline}`)
    lines.push(`${labels.productHuntDescription}: ${block.productHunt.description}`)
    lines.push(`${labels.productHuntTags}: ${block.productHunt.tags.join(', ')}`)
    lines.push('')
    lines.push(`${labels.productHuntFirstComment}:`)
    lines.push(block.productHunt.firstComment)
    return
  }

  if (block.hackerNews) {
    lines.push(`${labels.hackerNewsShowHnTitle}: ${block.hackerNews.showHnTitle}`)
    lines.push('')
    lines.push(`${labels.hackerNewsPostBody}:`)
    lines.push(block.hackerNews.postBody)
    lines.push('')
    lines.push(`${labels.hackerNewsFeedbackAsk}: ${block.hackerNews.feedbackAsk}`)
    lines.push(`${labels.hackerNewsDiscussionSeed}: ${block.hackerNews.discussionSeed}`)
    return
  }

  if (block.reddit) {
    lines.push(`${labels.redditPostTitle}: ${block.reddit.postTitle}`)
    lines.push('')
    lines.push(`${labels.redditPostBody}:`)
    lines.push(block.reddit.postBody)
    lines.push('')
    lines.push(`${labels.redditBuilderDisclosure}: ${block.reddit.builderDisclosure}`)
    lines.push(`${labels.redditDiscussionQuestion}: ${block.reddit.discussionQuestion}`)
    lines.push(`${labels.redditLinkPolicyNote}: ${block.reddit.linkPolicyNote}`)
    return
  }

  if (block.indieHackers) {
    lines.push(`${labels.indieHackersPostTitle}: ${block.indieHackers.postTitle}`)
    lines.push('')
    lines.push(`${labels.indieHackersFounderStory}:`)
    lines.push(block.indieHackers.founderStory)
    lines.push('')
    lines.push(`${labels.indieHackersLesson}: ${block.indieHackers.lesson}`)
    lines.push(`${labels.indieHackersProofOrMetric}: ${block.indieHackers.proofOrMetric}`)
    lines.push(`${labels.indieHackersNextExperiment}: ${block.indieHackers.nextExperiment}`)
    lines.push(`${labels.indieHackersFeedbackAsk}: ${block.indieHackers.feedbackAsk}`)
    return
  }

  if (block.linkedin) {
    lines.push(`${labels.linkedinHook}: ${block.linkedin.hook}`)
    lines.push('')
    lines.push(`${labels.linkedinPostBody}:`)
    lines.push(block.linkedin.postBody)
    lines.push('')
    lines.push(`${labels.linkedinProofPoint}: ${block.linkedin.proofPoint}`)
    lines.push(`${labels.linkedinClosingCta}: ${block.linkedin.closingCta}`)
    return
  }

  if (block.tiktok) {
    lines.push(`${labels.shortVideoHook}: ${block.tiktok.hook}`)
    lines.push('')
    lines.push(`${labels.shortVideoSpokenScript}:`)
    lines.push(block.tiktok.spokenScript)
    appendMarkdownList(lines, labels.shortVideoVisualBeats, block.tiktok.visualBeats)
    appendMarkdownList(lines, labels.shortVideoOnScreenText, block.tiktok.onScreenText)
    lines.push(`${labels.shortVideoCloseCta}: ${block.tiktok.closeCta}`)
    return
  }

  if (block.youtubeShorts) {
    lines.push(`${labels.shortVideoTitle}: ${block.youtubeShorts.title}`)
    lines.push(`${labels.shortVideoHook}: ${block.youtubeShorts.hook}`)
    lines.push('')
    lines.push(`${labels.shortVideoSpokenScript}:`)
    lines.push(block.youtubeShorts.spokenScript)
    appendMarkdownList(lines, labels.shortVideoVisualBeats, block.youtubeShorts.visualBeats)
    lines.push(`${labels.shortVideoRetentionCue}: ${block.youtubeShorts.retentionCue}`)
    lines.push(`${labels.shortVideoCloseCta}: ${block.youtubeShorts.closeCta}`)
    return
  }

  if (block.emailAnnouncement) {
    lines.push(`${labels.emailSubject}: ${block.emailAnnouncement.subject}`)
    lines.push(`${labels.emailPreviewText}: ${block.emailAnnouncement.previewText}`)
    lines.push('')
    lines.push(`${labels.emailGreeting}: ${block.emailAnnouncement.greeting}`)
    lines.push(`${labels.emailOpening}: ${block.emailAnnouncement.opening}`)
    lines.push('')
    lines.push(`${labels.emailBody}:`)
    lines.push(block.emailAnnouncement.body)
    lines.push('')
    lines.push(`${labels.emailCtaText}: ${block.emailAnnouncement.ctaText}`)
    lines.push(`${labels.emailSignoff}: ${block.emailAnnouncement.signoff}`)
    return
  }

  lines.push(`${labels.title}: ${block.title}`)
  lines.push('')
  lines.push(block.body)
  lines.push('')
  lines.push(`${labels.cta}: ${block.cta}`)
}

function appendMarkdownList(lines: string[], title: string, items: string[]) {
  if (!items.length) {
    return
  }

  lines.push('')
  lines.push(`${title}:`)
  for (const item of items) {
    lines.push(`- ${item}`)
  }
}

function appendRedditRecommendationsMarkdown(
  lines: string[],
  recommendations: RedditRecommendations,
  labels: {
    engagement: string
    selfPromotion: string
    reason: string
    postingGuidance: string
  },
) {
  appendSubredditRecommendationMarkdown(
    lines,
    labels.engagement,
    recommendations.engagementSubreddits,
    labels,
  )
  appendSubredditRecommendationMarkdown(
    lines,
    labels.selfPromotion,
    recommendations.selfPromotionSubreddits,
    labels,
  )
}

function appendSubredditRecommendationMarkdown(
  lines: string[],
  title: string,
  recommendations: SubredditRecommendation[],
  labels: {
    reason: string
    postingGuidance: string
  },
) {
  if (!recommendations.length) {
    return
  }

  lines.push(`#### ${title}`)
  for (const recommendation of recommendations) {
    lines.push(`- ${recommendation.name}: ${recommendation.url}`)
    lines.push(`  ${labels.reason}: ${recommendation.reason}`)
    lines.push(`  ${labels.postingGuidance}: ${recommendation.postingGuidance}`)
  }
  lines.push('')
}

export function buildPressPackHtml(project: LaunchProjectSnapshot, labels: ExportLabels): string {
  const media = project.kit.mediaKit
  const checklist = media.keyVisualsChecklist.map((item) => `<li>${escapeHtml(item)}</li>`).join('')

  return `<!doctype html>
<html lang="${escapeHtml(project.language || 'en')}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(project.name)} ${escapeHtml(labels.pressPackTitleSuffix)}</title>
    <style>
      body { margin: 0; background: #f4f6fa; color: #18212f; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      main { max-width: 820px; margin: 24px auto; background: #fff; border: 1px solid #d8e0ea; border-radius: 16px; padding: 32px; }
      h1 { margin: 0 0 8px; font-size: 34px; }
      h2 { margin-top: 24px; font-size: 20px; }
      p { margin: 8px 0; white-space: pre-wrap; line-height: 1.6; }
      ul { margin-top: 8px; }
      @media print { main { border: none; margin: 0; border-radius: 0; } }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(project.name)} ${escapeHtml(labels.pressPackTitleSuffix)}</h1>
      <p>${escapeHtml(labels.pressPackSourceLabel)}: ${escapeHtml(project.sourceUrl)}</p>
      <h2>${escapeHtml(labels.founderCompanyBio)}</h2>
      <p>${escapeHtml(media.founderCompanyBio)}</p>
      <h2>${escapeHtml(labels.productOneLiner)}</h2>
      <p>${escapeHtml(media.productOneLiner)}</p>
      <h2>${escapeHtml(labels.boilerplate)}</h2>
      <p>${escapeHtml(media.boilerplate)}</p>
      <h2>${escapeHtml(labels.pressRelease)}</h2>
      <p>${escapeHtml(media.pressRelease)}</p>
      <h2>${escapeHtml(labels.keyVisualsChecklist)}</h2>
      <ul>${checklist}</ul>
      <h2>${escapeHtml(labels.screenshotsAndLogos)}</h2>
      <p>${escapeHtml(media.screenshotsAndLogos)}</p>
      <h2>${escapeHtml(labels.contactDetails)}</h2>
      <p>${escapeHtml(media.contactDetails)}</p>
    </main>
  </body>
</html>`
}

export function hasGeneratedResultsInKit(kit: LaunchKit): boolean {
  const hasPlatformOutput = PLATFORM_IDS.some((platformId) => {
    const block = kit.platformBlocks[platformId]
    return Boolean(block.title.trim() || block.body.trim() || block.cta.trim() || block.notes.trim())
  })
  const hasChannelPackOutput = CHANNEL_PACK_IDS.some((channelId) =>
    kit.channelPacks[channelId].cards.some((card) =>
      Boolean(card.title.trim() || card.body.trim() || card.cta.trim()),
    ),
  )
  const hasGrowthOutput =
    kit.growthAssets.linkedinOutreach.variants.length > 0 ||
    kit.growthAssets.xOutreach.variants.length > 0 ||
    kit.growthAssets.emailOutreach.variants.length > 0 ||
    kit.growthAssets.seoPostPacks.length > 0
  const hasSeoGrowthOutput = Boolean(
    kit.seoGrowth.websiteAnalysis ||
      kit.seoGrowth.blogStrategy.length > 0 ||
      kit.seoGrowth.freeTools.length > 0 ||
      kit.seoGrowth.backlinkProspects.length > 0 ||
      kit.seoGrowth.backlinkEmailJobs.length > 0,
  )
  const hasMediaKitOutput = Boolean(
    kit.mediaKit.founderCompanyBio.trim() ||
      kit.mediaKit.productOneLiner.trim() ||
      kit.mediaKit.boilerplate.trim() ||
      kit.mediaKit.pressRelease.trim() ||
      kit.mediaKit.keyVisualsChecklist.length > 0 ||
      kit.mediaKit.screenshotsAndLogos.trim() ||
      kit.mediaKit.contactDetails.trim(),
  )
  const hasAssetOutput = kit.assetLibrary.generatedAssets.length > 0

  return hasPlatformOutput ||
    hasChannelPackOutput ||
    hasGrowthOutput ||
    hasSeoGrowthOutput ||
    hasMediaKitOutput ||
    hasAssetOutput
}

function shouldSkipPlatformBlockInExport(blockId: PlatformBlockId, kit: LaunchKit): boolean {
  if (
    blockId !== 'reddit' &&
    blockId !== 'indie_hackers' &&
    blockId !== 'linkedin' &&
    blockId !== 'tiktok' &&
    blockId !== 'youtube_shorts'
  ) {
    return false
  }

  return kit.channelPacks[blockId].cards.length > 0
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
