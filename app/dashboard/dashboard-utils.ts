import {
  PLATFORM_IDS,
  type GrowthBlockId,
  type LaunchKit,
  type LaunchProjectSnapshot,
  type PlatformBlockId,
  type RedditRecommendations,
  type SubredditRecommendation,
} from '@/lib/launch-kit/types'
import { normalizeBrief, normalizeKit } from '@/lib/launch-kit/normalizers'
import { GUEST_PROJECTS_KEY, type TrafficChannelId } from './dashboard-config'

export function splitLines(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

export function splitEditableLines(input: string): string[] {
  return input.split(/\r?\n/)
}

export function getPlatformBlockIdForTrafficChannel(channelId: TrafficChannelId): PlatformBlockId | null {
  if (
    channelId === 'product_hunt' ||
    channelId === 'hacker_news' ||
    channelId === 'indie_hackers' ||
    channelId === 'linkedin' ||
    channelId === 'reddit' ||
    channelId === 'tiktok' ||
    channelId === 'youtube_shorts'
  ) {
    return channelId
  }

  return null
}

export function getGrowthBlockIdForTrafficChannel(channelId: TrafficChannelId): GrowthBlockId | null {
  if (channelId === 'x') {
    return 'x_outreach'
  }

  return null
}

export function isPlaybookChannel(channelId: TrafficChannelId) {
  return (
    channelId === 'launch_directories' ||
    channelId === 'trustmrr' ||
    channelId === 'acquire_com' ||
    channelId === 'flippa' ||
    channelId === 'threads' ||
    channelId === 'instagram' ||
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
  title: string
  cta: string
  notes: string
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
  emailJobsStub: string
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
    title: t('output.titleLabel'),
    cta: t('output.copyCtaPrefix'),
    notes: t('output.copyNotesPrefix'),
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
    emailJobsStub: t('export.markdown.emailJobsStub'),
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

  lines.push(`## ${labels.keywordResearch}`)
  lines.push(project.brief.keywordResearch.notes)
  lines.push('')
  for (const cluster of project.brief.keywordResearch.clusters) {
    lines.push(`### ${cluster.topic}`)
    lines.push(`- ${labels.intent}: ${cluster.intent}`)
    lines.push(`- ${labels.priority}: ${cluster.priority}`)
    lines.push(`- ${labels.keywords}:`)
    for (const keyword of cluster.keywords) {
      lines.push(`  - ${keyword}`)
    }
    lines.push(`- ${labels.contentAngles}:`)
    for (const angle of cluster.contentAngles) {
      lines.push(`  - ${angle}`)
    }
    lines.push('')
  }

  lines.push(`## ${labels.platformBlocks}`)
  lines.push('')
  for (const blockId of PLATFORM_IDS) {
    const block = project.kit.platformBlocks[blockId]
    lines.push(`### ${labels.platformLabels[blockId]}`)
    lines.push(`${labels.title}: ${block.title}`)
    lines.push('')
    lines.push(block.body)
    lines.push('')
    lines.push(`${labels.cta}: ${block.cta}`)
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

  lines.push(`## ${labels.growthAssets}`)
  lines.push('')
  lines.push(`### ${labels.linkedinOutreach}`)
  for (const variant of project.kit.growthAssets.linkedinOutreach.variants) {
    lines.push(`- ${variant.title}: ${variant.message}`)
  }
  lines.push('')

  lines.push(`### ${labels.xOutreach}`)
  for (const variant of project.kit.growthAssets.xOutreach.variants) {
    lines.push(`- ${variant.title}: ${variant.message}`)
  }
  lines.push('')

  lines.push(`### ${labels.coldEmailOutreach}`)
  for (const variant of project.kit.growthAssets.emailOutreach.variants) {
    lines.push(`- ${variant.title} (${variant.subject || labels.noSubject})`)
    lines.push(`  ${variant.message}`)
  }
  lines.push('')

  lines.push(`### ${labels.seoPacks}`)
  for (const post of project.kit.growthAssets.seoPostPacks) {
    lines.push(`- ${post.title} [${post.keywordTopic}]`)
  }
  lines.push('')

  lines.push(`## ${labels.prospecting}`)
  lines.push(`- ${labels.leads}: ${project.kit.prospecting.leads.length}`)
  lines.push(`- ${labels.personalizedOutreach}: ${project.kit.prospecting.personalizedOutreach.length}`)
  lines.push(`- ${labels.emailJobsStub}: ${project.kit.prospecting.emailJobs.length}`)
  lines.push('')

  lines.push(`## ${labels.seoGrowth}`)
  lines.push('')
  if (project.kit.seoGrowth.websiteAnalysis) {
    lines.push(`### ${labels.websiteSeoAnalysis}`)
    lines.push(`- ${labels.valueScore}: ${project.kit.seoGrowth.websiteAnalysis.score}/100`)
    lines.push(project.kit.seoGrowth.websiteAnalysis.summary)
    lines.push('')
  }

  lines.push(`### ${labels.blogStrategy}`)
  for (const post of project.kit.seoGrowth.blogStrategy) {
    lines.push(`- Day ${post.dayOffset + 1}: ${post.title} [${post.keywordTopic}]`)
  }
  lines.push('')

  lines.push(`### ${labels.freeTools}`)
  for (const tool of project.kit.seoGrowth.freeTools) {
    lines.push(`- ${tool.title}: ${tool.url}`)
  }
  lines.push('')

  lines.push(`### ${labels.backlinkProspects}`)
  for (const prospect of project.kit.seoGrowth.backlinkProspects) {
    lines.push(
      `- ${prospect.title} (${prospect.domain}) - ${labels.valueScore}: ${prospect.valueScore}, ${labels.status}: ${prospect.status}`,
    )
  }
  lines.push('')

  return lines.join('\n')
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
      body { margin: 0; background: #f4f6fa; color: #18212f; font-family: Georgia, serif; }
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

  return hasPlatformOutput || hasGrowthOutput || hasSeoGrowthOutput || hasMediaKitOutput || hasAssetOutput
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
