import {
  CHANNEL_PACK_IDS,
  CHANNEL_PACK_LABELS,
  DEFAULT_LAUNCH_ASSET_TEMPLATES,
  PLATFORM_IDS,
  PLATFORM_LABELS,
  type AssetLibrary,
  type ChannelCard,
  type ChannelCardStage,
  type ChannelPack,
  type ChannelPackId,
  type ExtractedBrief,
  type GeneratedLaunchAsset,
  type GeneratedLaunchAssetStatus,
  type GrowthAssets,
  type KeywordResearch,
  type LaunchAssetFormat,
  type LaunchAssetKind,
  type LaunchAssetMediaType,
  type LaunchKit,
  type MediaKit,
  type PlatformBlock,
  type PlatformBlockId,
  type ProspectingState,
  type RedditActivitySignal,
  type RedditRecommendations,
  type RedditPostVariant,
  type RedditPostVariantMode,
  type RedditPromotionPolicy,
  type RedditRiskLevel,
  type SeoGrowthState,
  type SubredditPostPack,
  type SubredditRecommendation,
} from '@/lib/launch-kit/types'

export function createEmptyKeywordResearch(): KeywordResearch {
  return {
    generatedAt: '',
    notes: '',
    clusters: [],
  }
}

export function createEmptyMediaKit(): MediaKit {
  return {
    founderCompanyBio: '',
    productOneLiner: '',
    boilerplate: '',
    pressRelease: '',
    keyVisualsChecklist: [],
    screenshotsAndLogos: '',
    contactDetails: '',
  }
}

export function createEmptyRedditRecommendations(): RedditRecommendations {
  return {
    strategyNotes: '',
    engagementSubreddits: [],
    selfPromotionSubreddits: [],
    subredditPostPacks: [],
  }
}

export function createEmptyGrowthAssets(): GrowthAssets {
  return {
    generatedAt: '',
    linkedinOutreach: {
      channel: 'linkedin',
      notes: '',
      personalizationTemplate: '',
      variants: [],
    },
    xOutreach: {
      channel: 'x',
      notes: '',
      personalizationTemplate: '',
      variants: [],
    },
    emailOutreach: {
      channel: 'email',
      notes: '',
      personalizationTemplate: '',
      variants: [],
    },
    seoPostPacks: [],
    followUpSequences: [],
  }
}

export function createEmptyAssetLibrary(): AssetLibrary {
  return {
    templates: DEFAULT_LAUNCH_ASSET_TEMPLATES,
    generatedAssets: [],
  }
}

export function createEmptyProspectingState(): ProspectingState {
  return {
    queryHints: [],
    leads: [],
    personalizedOutreach: [],
    actionRuns: [],
    emailJobs: [],
    lastScrapeAt: '',
    lastEmailBuildAt: '',
  }
}

export function createEmptySeoGrowthState(): SeoGrowthState {
  return {
    websiteAnalysis: null,
    blogStrategy: [],
    freeTools: [],
    backlinkProspects: [],
    prospectLists: [],
    backlinkEmailJobs: [],
    lastAnalyzedAt: '',
    lastBlogStrategyAt: '',
    lastBacklinkScrapeAt: '',
    lastBacklinkEmailAt: '',
  }
}

export function createEmptyPlatformBlocks(): Record<PlatformBlockId, PlatformBlock> {
  const platformBlocks = {} as Record<PlatformBlockId, PlatformBlock>

  for (const platformId of PLATFORM_IDS) {
    platformBlocks[platformId] = {
      id: platformId,
      label: PLATFORM_LABELS[platformId],
      title: '',
      body: '',
      cta: '',
      notes: '',
      ...(platformId === 'reddit'
        ? { redditRecommendations: createEmptyRedditRecommendations() }
        : {}),
    }
  }

  return platformBlocks
}

export function createEmptyChannelPacks(): Record<ChannelPackId, ChannelPack> {
  const channelPacks = {} as Record<ChannelPackId, ChannelPack>

  for (const channelId of CHANNEL_PACK_IDS) {
    channelPacks[channelId] = {
      id: channelId,
      label: CHANNEL_PACK_LABELS[channelId],
      notes: '',
      cards: [],
      ...(channelId === 'reddit'
        ? { redditRecommendations: createEmptyRedditRecommendations() }
        : {}),
    }
  }

  return channelPacks
}

export function createEmptyKit(language: string): LaunchKit {
  return {
    generatedAt: new Date().toISOString(),
    language,
    platformBlocks: createEmptyPlatformBlocks(),
    channelPacks: createEmptyChannelPacks(),
    mediaKit: createEmptyMediaKit(),
    assetLibrary: createEmptyAssetLibrary(),
    growthAssets: createEmptyGrowthAssets(),
    prospecting: createEmptyProspectingState(),
    seoGrowth: createEmptySeoGrowthState(),
  }
}

type BriefFallback = {
  sourceUrl?: string
  language?: string
  productName?: string
}

export function normalizeBrief(
  brief: unknown,
  fallback: BriefFallback = {},
): ExtractedBrief {
  const rawBrief = isRecord(brief) ? brief : {}
  const sourceUrl = safeString(rawBrief.sourceUrl) || safeString(fallback.sourceUrl)
  const language = safeString(rawBrief.language) || safeString(fallback.language) || 'en'
  const productName =
    safeString(rawBrief.productName) || safeString(fallback.productName) || 'Untitled Product'
  const crawlPages = safeStringArray(rawBrief.crawlPages)

  return {
    sourceUrl,
    productName,
    positioning: safeString(rawBrief.positioning),
    targetUsers: safeStringArray(rawBrief.targetUsers),
    icp: safeString(rawBrief.icp),
    painPoints: safeStringArray(rawBrief.painPoints),
    valueProps: safeStringArray(rawBrief.valueProps),
    keyClaims: safeStringArray(rawBrief.keyClaims),
    proofPoints: safeStringArray(rawBrief.proofPoints),
    voiceGuide: safeString(rawBrief.voiceGuide) || buildDefaultVoiceGuide(brief),
    cta: safeString(rawBrief.cta),
    language,
    sourceHighlights: safeStringArray(rawBrief.sourceHighlights),
    detectedImageUrls: safeStringArray(rawBrief.detectedImageUrls),
    crawlPages: crawlPages.length > 0 ? crawlPages : [sourceUrl],
    keywordResearch: normalizeKeywordResearch(rawBrief.keywordResearch),
  }
}

function buildDefaultVoiceGuide(brief: unknown): string {
  const rawBrief = isRecord(brief) ? brief : {}
  const productName = safeString(rawBrief.productName) || 'the product'
  const audience = safeStringArray(rawBrief.targetUsers)[0] ||
    safeString(rawBrief.icp) ||
    'the target audience'

  return `Use a clear, human, product-specific voice for ${productName}. Keep claims grounded in the source brief, speak directly to ${audience}, avoid generic AI phrasing, and adapt structure and tone to each channel's social contract.`
}

export function normalizeKeywordResearch(
  research: unknown,
): KeywordResearch {
  const rawResearch = isRecord(research) ? research : {}
  const fallback = createEmptyKeywordResearch()
  return {
    generatedAt: safeString(rawResearch.generatedAt) || fallback.generatedAt,
    notes: safeString(rawResearch.notes) || fallback.notes,
    clusters: Array.isArray(rawResearch.clusters)
      ? rawResearch.clusters
          .map((cluster, index) => {
            const rawCluster = isRecord(cluster) ? cluster : {}
            return {
              id: safeString(rawCluster.id) || `cluster-${index + 1}`,
              topic: safeString(rawCluster.topic),
              intent: isKeywordIntent(rawCluster.intent) ? rawCluster.intent : 'informational',
              priority: isKeywordPriority(rawCluster.priority) ? rawCluster.priority : 'medium',
              keywords: safeStringArray(rawCluster.keywords),
              contentAngles: safeStringArray(rawCluster.contentAngles),
            }
          })
          .filter((cluster) => cluster.topic)
      : [],
  }
}

export function normalizeKit(
  kit: unknown,
  language: string,
): LaunchKit {
  const rawKit = isRecord(kit) ? kit : {}
  const fallback = createEmptyKit(language)
  const platformBlocks = { ...fallback.platformBlocks }
  const rawPlatformBlocks = isRecord(rawKit.platformBlocks) ? rawKit.platformBlocks : {}

  for (const blockId of PLATFORM_IDS) {
    const block = isRecord(rawPlatformBlocks[blockId]) ? rawPlatformBlocks[blockId] : null
    if (!block) {
      continue
    }

    platformBlocks[blockId] = {
      id: blockId,
      label: safeString(block.label) || PLATFORM_LABELS[blockId],
      title: safeString(block.title),
      body: safeString(block.body),
      cta: safeString(block.cta),
      notes: safeString(block.notes),
      ...(blockId === 'reddit'
        ? { redditRecommendations: normalizeRedditRecommendations(block.redditRecommendations) }
      : {}),
    }
  }

  const channelPacks = normalizeChannelPacks(rawKit.channelPacks, platformBlocks)
  const rawMediaKit = isRecord(rawKit.mediaKit) ? rawKit.mediaKit : {}
  const rawGrowthAssets = isRecord(rawKit.growthAssets) ? rawKit.growthAssets : {}

  return {
    generatedAt: safeString(rawKit.generatedAt) || fallback.generatedAt,
    language: safeString(rawKit.language) || language,
    platformBlocks,
    channelPacks,
    mediaKit: {
      founderCompanyBio: safeString(rawMediaKit.founderCompanyBio),
      productOneLiner: safeString(rawMediaKit.productOneLiner),
      boilerplate: safeString(rawMediaKit.boilerplate),
      pressRelease: safeString(rawMediaKit.pressRelease),
      keyVisualsChecklist: safeStringArray(rawMediaKit.keyVisualsChecklist),
      screenshotsAndLogos: safeString(rawMediaKit.screenshotsAndLogos),
      contactDetails: safeString(rawMediaKit.contactDetails),
    },
    assetLibrary: normalizeAssetLibrary(rawKit.assetLibrary),
    growthAssets: {
      generatedAt: safeString(rawGrowthAssets.generatedAt) || fallback.growthAssets.generatedAt,
      linkedinOutreach: normalizeOutreachPack(
        rawGrowthAssets.linkedinOutreach,
        fallback.growthAssets.linkedinOutreach,
      ),
      xOutreach: normalizeOutreachPack(
        rawGrowthAssets.xOutreach,
        fallback.growthAssets.xOutreach,
      ),
      emailOutreach: normalizeOutreachPack(
        rawGrowthAssets.emailOutreach,
        fallback.growthAssets.emailOutreach,
      ),
      seoPostPacks: normalizeSeoPostPacks(rawGrowthAssets.seoPostPacks),
      followUpSequences: normalizeFollowUpSequences(rawGrowthAssets.followUpSequences),
    },
    prospecting: normalizeProspectingState(rawKit.prospecting),
    seoGrowth: normalizeSeoGrowthState(rawKit.seoGrowth),
  }
}

export function normalizeChannelPacks(
  channelPacks: unknown,
  platformBlocks: Record<PlatformBlockId, PlatformBlock> = createEmptyPlatformBlocks(),
): Record<ChannelPackId, ChannelPack> {
  const normalized = createEmptyChannelPacks()
  const rawChannelPacks = isRecord(channelPacks) ? channelPacks : {}

  for (const channelId of CHANNEL_PACK_IDS) {
    const rawPack = isRecord(rawChannelPacks[channelId]) ? rawChannelPacks[channelId] : null
    const legacyPack = synthesizeChannelPackFromPlatformBlock(channelId, platformBlocks)
    const rawCards = Array.isArray(rawPack?.cards) ? rawPack.cards : []
    const cards = rawCards
      .map((card, index) => normalizeChannelCard(card, channelId, index))
      .filter((card): card is ChannelCard => Boolean(card))

    normalized[channelId] = {
      id: channelId,
      label: safeString(rawPack?.label) || CHANNEL_PACK_LABELS[channelId],
      notes: safeString(rawPack?.notes) || legacyPack.notes,
      cards: cards.length > 0 ? cards : legacyPack.cards,
      ...(channelId === 'reddit'
        ? {
            redditRecommendations: normalizeRedditRecommendations(
              rawPack?.redditRecommendations,
              legacyPack.redditRecommendations,
            ),
          }
        : {}),
    }
  }

  return normalized
}

function normalizeChannelCard(
  card: unknown,
  channelId: ChannelPackId,
  index: number,
): ChannelCard | null {
  const rawCard = isRecord(card) ? card : {}
  const title = safeString(rawCard.title)
  const rawBody = safeString(rawCard.body)
  const cta = safeString(rawCard.cta)
  const format = safeString(rawCard.format) || 'Native post'
  const body = channelId === 'x' ? sanitizeXPostBody(rawBody, title, format) : rawBody

  if (!title && !body && !cta) {
    return null
  }

  return {
    id: safeString(rawCard.id) || `${channelId}-card-${index + 1}`,
    title,
    body,
    cta,
    proofPoint: safeString(rawCard.proofPoint) || inferProofPointFromText(body),
    stage: isChannelCardStage(rawCard.stage) ? rawCard.stage : 'evergreen',
    format,
    socialContractNote: safeString(rawCard.socialContractNote),
    qualityChecks: safeStringArray(rawCard.qualityChecks, 6),
  }
}

export function sanitizeXPostBody(body: string, title = '', format = ''): string {
  const normalized = body.replace(/\r\n?/g, '\n').trim()
  if (!normalized) {
    return ''
  }

  const lines = normalized.split('\n')

  while (lines.length > 0) {
    const firstLine = cleanXPostHeadingLine(lines[0] || '')
    const remainingContent = lines.slice(1).some((line) => line.trim())
    const prefixed = removeXPostHeadingPrefix(firstLine)

    if (prefixed !== firstLine) {
      if (prefixed && !remainingContent) {
        lines[0] = prefixed
      } else {
        lines.shift()
      }
      continue
    }

    if (isInternalXPostHeading(firstLine, title, format)) {
      lines.shift()
      continue
    }

    break
  }

  return lines.join('\n').trim()
}

function cleanXPostHeadingLine(line: string): string {
  return line
    .trim()
    .replace(/^#{1,4}\s+/, '')
    .replace(/^\*\*(.+)\*\*$/, '$1')
    .trim()
}

function removeXPostHeadingPrefix(line: string): string {
  return line
    .replace(
      /^(\*\*)?\s*(?:title|headline|x\s*(?:post|thread)|tweet|thread|post)\s*(\*\*)?\s*[:\-]\s*/i,
      '',
    )
    .trim()
}

function isInternalXPostHeading(line: string, title: string, format: string): boolean {
  const normalizedLine = normalizeXPostHeading(line)
  if (!normalizedLine) {
    return true
  }

  const candidates = [
    title,
    format,
    format ? `X - ${format}` : '',
    format ? `X: ${format}` : '',
    format ? `X ${format}` : '',
  ]

  return candidates.some((candidate) => normalizeXPostHeading(candidate) === normalizedLine)
}

function normalizeXPostHeading(value: string): string {
  return value
    .toLowerCase()
    .replace(/^#{1,4}\s+/, '')
    .replace(/^\*\*(.+)\*\*$/, '$1')
    .replace(/[\s:._-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function synthesizeChannelPackFromPlatformBlock(
  channelId: ChannelPackId,
  platformBlocks: Record<PlatformBlockId, PlatformBlock>,
): ChannelPack {
  const platformId = getLegacyPlatformBlockIdForChannel(channelId)
  const emptyPack: ChannelPack = {
    id: channelId,
    label: CHANNEL_PACK_LABELS[channelId],
    notes: '',
    cards: [],
    ...(channelId === 'reddit'
      ? { redditRecommendations: createEmptyRedditRecommendations() }
      : {}),
  }

  if (!platformId) {
    return emptyPack
  }

  const block = platformBlocks[platformId]
  const title = safeString(block?.title)
  const body = safeString(block?.body)
  const cta = safeString(block?.cta)
  const notes = safeString(block?.notes)
  if (!title && !body && !cta) {
    return emptyPack
  }

  return {
    id: channelId,
    label: CHANNEL_PACK_LABELS[channelId],
    notes,
    cards: [
      {
        id: `${channelId}-legacy-launch`,
        title,
        body,
        cta,
        proofPoint: inferProofPointFromText(body) || 'Review source evidence before publishing.',
        stage: 'launch_day',
        format: 'Launch post',
        socialContractNote: notes,
        qualityChecks: ['Review current channel rules and expectations before posting.'],
      },
    ],
    ...(channelId === 'reddit'
      ? { redditRecommendations: normalizeRedditRecommendations(block.redditRecommendations) }
      : {}),
  }
}

function inferProofPointFromText(value: string): string {
  const lines = value.split('\n').map((line) => line.trim()).filter(Boolean)
  const proofLine = lines.find((line) => /^(\*\*)?(proof|proof\/context|proof signal|proof cues?)/i.test(line))

  if (!proofLine) {
    return ''
  }

  return proofLine.replace(/^(\*\*)?(proof|proof\/context|proof signal|proof cues?)\s*(\*\*)?\s*:?\s*/i, '').trim()
}

function getLegacyPlatformBlockIdForChannel(channelId: ChannelPackId): PlatformBlockId | null {
  if (
    channelId === 'linkedin' ||
    channelId === 'reddit' ||
    channelId === 'indie_hackers' ||
    channelId === 'tiktok' ||
    channelId === 'youtube_shorts'
  ) {
    return channelId
  }

  return null
}

export function normalizeAssetLibrary(
  assetLibrary: unknown,
): AssetLibrary {
  const rawAssetLibrary = isRecord(assetLibrary) ? assetLibrary : {}
  return {
    templates: DEFAULT_LAUNCH_ASSET_TEMPLATES,
    generatedAssets: Array.isArray(rawAssetLibrary.generatedAssets)
      ? rawAssetLibrary.generatedAssets
          .map((asset, index) => normalizeGeneratedAsset(asset, index))
          .filter(Boolean) as GeneratedLaunchAsset[]
      : [],
  }
}

function normalizeGeneratedAsset(
  asset: unknown,
  index: number,
): GeneratedLaunchAsset | null {
  const rawAsset = isRecord(asset) ? asset : {}
  const templateId = safeString(rawAsset.templateId)
  if (!templateId) {
    return null
  }

  const template = DEFAULT_LAUNCH_ASSET_TEMPLATES.find((item) => item.id === templateId)
  if (!template) {
    return null
  }

  const format = isLaunchAssetFormat(rawAsset.format) && template.formats.includes(rawAsset.format)
    ? rawAsset.format
    : template.formats[0]

  return {
    id: safeString(rawAsset.id) || `${templateId}-${format}-${index + 1}`,
    templateId,
    kind: isLaunchAssetKind(rawAsset.kind) ? rawAsset.kind : template.kind,
    mediaType: isLaunchAssetMediaType(rawAsset.mediaType) ? rawAsset.mediaType : template.mediaType,
    format,
    status: isGeneratedAssetStatus(rawAsset.status) ? rawAsset.status : 'failed',
    title: safeString(rawAsset.title) || template.title,
    prompt: safeString(rawAsset.prompt),
    outputUrl: normalizeGeneratedAssetOutputUrl(rawAsset.outputUrl),
    outputText: safeString(rawAsset.outputText),
    replicatePredictionId: safeString(rawAsset.replicatePredictionId),
    error: safeString(rawAsset.error),
    createdAt: safeString(rawAsset.createdAt) || new Date().toISOString(),
    updatedAt: safeString(rawAsset.updatedAt) ||
      safeString(rawAsset.createdAt) ||
      new Date().toISOString(),
  }
}

function normalizeOutreachPack(
  pack: unknown,
  fallback: GrowthAssets['linkedinOutreach'],
): GrowthAssets['linkedinOutreach'] {
  const rawPack = isRecord(pack) ? pack : {}

  return {
    channel: fallback.channel,
    notes: safeString(rawPack.notes) || fallback.notes,
    personalizationTemplate: safeString(rawPack.personalizationTemplate) ||
      fallback.personalizationTemplate,
    variants: normalizeOutreachVariants(rawPack.variants),
  }
}

function normalizeOutreachVariants(value: unknown): GrowthAssets['linkedinOutreach']['variants'] {
  if (!Array.isArray(value)) {
    return []
  }

  const variants: GrowthAssets['linkedinOutreach']['variants'] = []

  for (const [index, variant] of value.entries()) {
    const rawVariant = isRecord(variant) ? variant : {}
    const message = safeString(rawVariant.message)
    if (!message) {
      continue
    }

    variants.push({
      id: safeString(rawVariant.id) || `variant-${index + 1}`,
      title: safeString(rawVariant.title),
      subject: safeString(rawVariant.subject),
      message,
      cta: safeString(rawVariant.cta),
    })

    if (variants.length >= 12) {
      break
    }
  }

  return variants
}

function normalizeSeoPostPacks(value: unknown): GrowthAssets['seoPostPacks'] {
  if (!Array.isArray(value)) {
    return []
  }

  const posts: GrowthAssets['seoPostPacks'] = []

  for (const [index, post] of value.entries()) {
    const rawPost = isRecord(post) ? post : {}
    const title = safeString(rawPost.title)
    const draft = safeString(rawPost.draft)
    if (!title && !draft) {
      continue
    }

    posts.push({
      id: safeString(rawPost.id) || `seo-post-${index + 1}`,
      keywordClusterId: safeString(rawPost.keywordClusterId) || `cluster-${index + 1}`,
      keywordTopic: safeString(rawPost.keywordTopic),
      title,
      metaDescription: safeString(rawPost.metaDescription),
      outline: safeStringArray(rawPost.outline),
      draft,
      cta: safeString(rawPost.cta),
    })

    if (posts.length >= 12) {
      break
    }
  }

  return posts
}

function normalizeFollowUpSequences(value: unknown): GrowthAssets['followUpSequences'] {
  if (!Array.isArray(value)) {
    return []
  }

  const sequences: GrowthAssets['followUpSequences'] = []

  for (const [index, item] of value.entries()) {
    const rawItem = isRecord(item) ? item : {}
    const message = safeString(rawItem.message)
    if (!message) {
      continue
    }

    sequences.push({
      day: safeString(rawItem.day) || `Day ${index + 1}`,
      message,
    })

    if (sequences.length >= 12) {
      break
    }
  }

  return sequences
}

export function normalizeProspectingState(prospecting: unknown): ProspectingState {
  const rawProspecting = isRecord(prospecting) ? prospecting : {}

  return {
    queryHints: safeStringArray(rawProspecting.queryHints),
    leads: normalizeProspectLeads(rawProspecting.leads),
    personalizedOutreach: normalizePersonalizedOutreach(rawProspecting.personalizedOutreach),
    actionRuns: normalizeProspectActionRuns(rawProspecting.actionRuns),
    emailJobs: normalizeOutreachEmailJobs(rawProspecting.emailJobs),
    lastScrapeAt: safeString(rawProspecting.lastScrapeAt),
    lastEmailBuildAt: safeString(rawProspecting.lastEmailBuildAt),
  }
}

function normalizeProspectLeads(value: unknown): ProspectingState['leads'] {
  if (!Array.isArray(value)) {
    return []
  }

  const leads: ProspectingState['leads'] = []

  for (const [index, lead] of value.entries()) {
    const rawLead = isRecord(lead) ? lead : {}
    const name = safeString(rawLead.name)
    const company = safeString(rawLead.company)
    const website = normalizeHttpUrl(rawLead.website)
    const email = safeString(rawLead.email)
    if (!name && !company && !website && !email) {
      continue
    }

    leads.push({
      id: safeString(rawLead.id) || `lead-${index + 1}`,
      name,
      role: safeString(rawLead.role),
      company,
      website,
      email,
      linkedinUrl: normalizeHttpUrl(rawLead.linkedinUrl),
      xUrl: normalizeHttpUrl(rawLead.xUrl),
      reason: safeString(rawLead.reason),
      source: safeString(rawLead.source),
      score: clampNumber(rawLead.score, 0, 100, 50),
      tier: isProspectLeadTier(rawLead.tier) ? rawLead.tier : 'warm',
    })

    if (leads.length >= 100) {
      break
    }
  }

  return leads
}

function normalizePersonalizedOutreach(value: unknown): ProspectingState['personalizedOutreach'] {
  if (!Array.isArray(value)) {
    return []
  }

  const outreach: ProspectingState['personalizedOutreach'] = []

  for (const [index, item] of value.entries()) {
    const rawItem = isRecord(item) ? item : {}
    const leadId = safeString(rawItem.leadId)
    const hasMessage = Boolean(
      safeString(rawItem.linkedinMessage) ||
        safeString(rawItem.xMessage) ||
        safeString(rawItem.emailBody),
    )
    if (!leadId || !hasMessage) {
      continue
    }

    outreach.push({
      id: safeString(rawItem.id) || `outreach-${index + 1}`,
      leadId,
      leadName: safeString(rawItem.leadName),
      company: safeString(rawItem.company),
      linkedinMessage: safeString(rawItem.linkedinMessage),
      xMessage: safeString(rawItem.xMessage),
      emailSubject: safeString(rawItem.emailSubject),
      emailBody: safeString(rawItem.emailBody),
      createdAt: safeString(rawItem.createdAt),
    })

    if (outreach.length >= 100) {
      break
    }
  }

  return outreach
}

function normalizeProspectActionRuns(value: unknown): ProspectingState['actionRuns'] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((run, index) => {
      const rawRun = isRecord(run) ? run : {}

      return {
        id: safeString(rawRun.id) || `action-run-${index + 1}`,
        type: isProspectActionType(rawRun.type) ? rawRun.type : 'prospect',
        status: isProspectActionStatus(rawRun.status) ? rawRun.status : 'failed',
        summary: safeString(rawRun.summary),
        createdAt: safeString(rawRun.createdAt),
        updatedAt: safeString(rawRun.updatedAt),
        error: safeString(rawRun.error) || undefined,
      }
    })
    .slice(0, 100)
}

function normalizeOutreachEmailJobs(value: unknown): ProspectingState['emailJobs'] {
  if (!Array.isArray(value)) {
    return []
  }

  const jobs: ProspectingState['emailJobs'] = []

  for (const [index, job] of value.entries()) {
    const rawJob = isRecord(job) ? job : {}
    const leadIds = safeStringArray(rawJob.leadIds)
    const subject = safeString(rawJob.subject)
    if (!leadIds.length && !subject) {
      continue
    }

    jobs.push({
      id: safeString(rawJob.id) || `email-job-${index + 1}`,
      status: rawJob.status === 'queued' ? 'queued' : 'completed',
      leadIds,
      subject,
      bodyPreview: safeString(rawJob.bodyPreview),
      createdAt: safeString(rawJob.createdAt),
      completedAt: safeString(rawJob.completedAt) || undefined,
    })

    if (jobs.length >= 100) {
      break
    }
  }

  return jobs
}

export function normalizeSeoGrowthState(
  seoGrowth: unknown,
): SeoGrowthState {
  const rawSeoGrowth = isRecord(seoGrowth) ? seoGrowth : {}
  const fallback = createEmptySeoGrowthState()
  const websiteAnalysis = isRecord(rawSeoGrowth.websiteAnalysis)
    ? rawSeoGrowth.websiteAnalysis
    : null

  return {
    websiteAnalysis: websiteAnalysis
      ? {
          generatedAt: safeString(websiteAnalysis.generatedAt),
          score: clampNumber(websiteAnalysis.score, 0, 100, 0),
          summary: safeString(websiteAnalysis.summary),
          strengths: safeStringArray(websiteAnalysis.strengths),
          fixes: safeStringArray(websiteAnalysis.fixes),
          checks: Array.isArray(websiteAnalysis.checks)
            ? websiteAnalysis.checks
                .map((check, index) => {
                  const rawCheck = isRecord(check) ? check : {}
                  return {
                    id: safeString(rawCheck.id) || `seo-check-${index + 1}`,
                    label: safeString(rawCheck.label),
                    status: isSeoCheckStatus(rawCheck.status) ? rawCheck.status : 'warning',
                    detail: safeString(rawCheck.detail),
                  }
                })
                .filter((check) => check.label || check.detail)
            : [],
          llmReadinessNotes: safeStringArray(websiteAnalysis.llmReadinessNotes),
        }
      : null,
    blogStrategy: Array.isArray(rawSeoGrowth.blogStrategy)
      ? rawSeoGrowth.blogStrategy
          .map((post, index) => {
            const rawPost = isRecord(post) ? post : {}
            return {
              id: safeString(rawPost.id) || `blog-post-${index + 1}`,
              dayOffset: clampNumber(rawPost.dayOffset, 0, 365, index * 4),
              keywordClusterId: safeString(rawPost.keywordClusterId) || `cluster-${index + 1}`,
              keywordTopic: safeString(rawPost.keywordTopic),
              title: safeString(rawPost.title),
              intent: isKeywordIntent(rawPost.intent) ? rawPost.intent : 'informational',
              targetKeywords: safeStringArray(rawPost.targetKeywords),
              tableIdeas: safeStringArray(rawPost.tableIdeas),
              outline: safeStringArray(rawPost.outline),
              llmNotes: safeStringArray(rawPost.llmNotes),
              cta: safeString(rawPost.cta),
            }
          })
          .filter((post) => post.title || post.keywordTopic)
      : [],
    freeTools: Array.isArray(rawSeoGrowth.freeTools)
      ? rawSeoGrowth.freeTools
          .map((tool, index) => {
            const rawTool = isRecord(tool) ? tool : {}
            return {
              id: safeString(rawTool.id) || `free-tool-${index + 1}`,
              category: safeString(rawTool.category),
              title: safeString(rawTool.title),
              url: normalizeHttpUrl(rawTool.url),
              workflow: safeString(rawTool.workflow),
            }
          })
          .filter((tool) => tool.title)
      : [],
    backlinkProspects: Array.isArray(rawSeoGrowth.backlinkProspects)
      ? rawSeoGrowth.backlinkProspects
          .map((prospect, index) => {
            const rawProspect = isRecord(prospect) ? prospect : {}
            return {
              id: safeString(rawProspect.id) || `backlink-${index + 1}`,
              website: normalizeHttpUrl(rawProspect.website, { includePath: false }),
              domain: safeString(rawProspect.domain),
              title: safeString(rawProspect.title),
              contactName: safeString(rawProspect.contactName),
              contactEmail: safeString(rawProspect.contactEmail),
              scrapedSummary: safeString(rawProspect.scrapedSummary),
              relevanceReason: safeString(rawProspect.relevanceReason),
              backlinkAngle: safeString(rawProspect.backlinkAngle),
              costToList: finiteNumberOrNull(rawProspect.costToList),
              estimatedTraffic: finiteNumberOrNull(rawProspect.estimatedTraffic),
              relevanceScore: clampNumber(rawProspect.relevanceScore, 0, 100, 50),
              trafficScore: clampNumber(rawProspect.trafficScore, 0, 100, 50),
              authorityScore: clampNumber(rawProspect.authorityScore, 0, 100, 50),
              contactabilityScore: clampNumber(rawProspect.contactabilityScore, 0, 100, 50),
              costScore: clampNumber(rawProspect.costScore, 0, 100, 50),
              valueScore: clampNumber(rawProspect.valueScore, 0, 100, 50),
              status: isBacklinkProspectStatus(rawProspect.status) ? rawProspect.status : 'new',
              listIds: safeStringArray(rawProspect.listIds),
              customizedEmailSubject: safeString(rawProspect.customizedEmailSubject),
              customizedEmailBody: safeString(rawProspect.customizedEmailBody),
              source: safeString(rawProspect.source),
              discoveredAt: safeString(rawProspect.discoveredAt),
              lastContactedAt: safeString(rawProspect.lastContactedAt),
            }
          })
          .filter((prospect) => prospect.website || prospect.domain || prospect.title)
      : [],
    prospectLists: Array.isArray(rawSeoGrowth.prospectLists)
      ? rawSeoGrowth.prospectLists
          .map((list, index) => {
            const rawList = isRecord(list) ? list : {}
            return {
              id: safeString(rawList.id) || `backlink-list-${index + 1}`,
              name: safeString(rawList.name),
              description: safeString(rawList.description),
              prospectIds: safeStringArray(rawList.prospectIds),
              createdAt: safeString(rawList.createdAt),
              updatedAt: safeString(rawList.updatedAt),
            }
          })
          .filter((list) => list.name)
      : [],
    backlinkEmailJobs: Array.isArray(rawSeoGrowth.backlinkEmailJobs)
      ? rawSeoGrowth.backlinkEmailJobs
          .map((job, index) => {
            const rawJob = isRecord(job) ? job : {}
            return {
              id: safeString(rawJob.id) || `backlink-email-job-${index + 1}`,
              status: rawJob.status === 'queued' ? ('queued' as const) : ('completed' as const),
              prospectIds: safeStringArray(rawJob.prospectIds),
              subject: safeString(rawJob.subject),
              bodyPreview: safeString(rawJob.bodyPreview),
              createdAt: safeString(rawJob.createdAt),
              completedAt: safeString(rawJob.completedAt),
            }
          })
          .filter((job) => job.prospectIds.length > 0 || job.subject)
      : [],
    lastAnalyzedAt: safeString(rawSeoGrowth.lastAnalyzedAt) || fallback.lastAnalyzedAt,
    lastBlogStrategyAt: safeString(rawSeoGrowth.lastBlogStrategyAt) || fallback.lastBlogStrategyAt,
    lastBacklinkScrapeAt: safeString(rawSeoGrowth.lastBacklinkScrapeAt) ||
      fallback.lastBacklinkScrapeAt,
    lastBacklinkEmailAt: safeString(rawSeoGrowth.lastBacklinkEmailAt) ||
      fallback.lastBacklinkEmailAt,
  }
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }

  return Math.max(min, Math.min(max, value))
}

function finiteNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function safeStringArray(value: unknown, limit?: number): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  const cleaned = value.map((item) => safeString(item)).filter(Boolean)
  return typeof limit === 'number' ? cleaned.slice(0, limit) : cleaned
}

function isKeywordIntent(value: unknown): value is KeywordResearch['clusters'][number]['intent'] {
  return (
    value === 'informational' ||
    value === 'commercial' ||
    value === 'transactional' ||
    value === 'navigational'
  )
}

function isKeywordPriority(value: unknown): value is KeywordResearch['clusters'][number]['priority'] {
  return value === 'high' || value === 'medium' || value === 'low'
}

function isLaunchAssetKind(value: unknown): value is LaunchAssetKind {
  return (
    value === 'screenshots' ||
    value === 'image_ads' ||
    value === 'video_ads' ||
    value === 'text_ads'
  )
}

function isLaunchAssetMediaType(value: unknown): value is LaunchAssetMediaType {
  return value === 'image' || value === 'video' || value === 'text'
}

function isLaunchAssetFormat(value: unknown): value is LaunchAssetFormat {
  return (
    value === '16:9' ||
    value === '9:16' ||
    value === '1:1' ||
    value === '4:5' ||
    value === '1.91:1' ||
    value === 'text'
  )
}

function isChannelCardStage(value: unknown): value is ChannelCardStage {
  return (
    value === 'pre_launch' ||
    value === 'launch_day' ||
    value === 'follow_up' ||
    value === 'evergreen'
  )
}

function isGeneratedAssetStatus(value: unknown): value is GeneratedLaunchAssetStatus {
  return value === 'succeeded' || value === 'failed'
}

function isProspectLeadTier(value: unknown): value is ProspectingState['leads'][number]['tier'] {
  return value === 'hot' || value === 'warm' || value === 'cold'
}

function isProspectActionType(
  value: unknown,
): value is ProspectingState['actionRuns'][number]['type'] {
  return (
    value === 'prospect' ||
    value === 'build_email_list' ||
    value === 'personalize_outreach' ||
    value === 'send_outreach_email' ||
    value === 'score_segment' ||
    value === 'export_leads' ||
    value === 'followup_sequences'
  )
}

function isProspectActionStatus(
  value: unknown,
): value is ProspectingState['actionRuns'][number]['status'] {
  return (
    value === 'pending_approval' ||
    value === 'approved' ||
    value === 'running' ||
    value === 'completed' ||
    value === 'failed'
  )
}

function isSeoCheckStatus(
  value: unknown,
): value is NonNullable<SeoGrowthState['websiteAnalysis']>['checks'][number]['status'] {
  return value === 'pass' || value === 'warning' || value === 'fail'
}

function isBacklinkProspectStatus(
  value: unknown,
): value is SeoGrowthState['backlinkProspects'][number]['status'] {
  return (
    value === 'new' ||
    value === 'first_contact' ||
    value === 'second_contact' ||
    value === 'in_negotiation' ||
    value === 'closed' ||
    value === 'rejected'
  )
}

export function normalizeRedditRecommendations(
  recommendations: unknown,
  fallback?: RedditRecommendations,
): RedditRecommendations {
  const rawRecommendations = isRecord(recommendations) ? recommendations : {}
  return {
    strategyNotes: safeString(rawRecommendations.strategyNotes) || fallback?.strategyNotes || '',
    engagementSubreddits: normalizeSubredditRecommendationList(
      rawRecommendations.engagementSubreddits,
      fallback?.engagementSubreddits,
    ),
    selfPromotionSubreddits: normalizeSubredditRecommendationList(
      rawRecommendations.selfPromotionSubreddits,
      fallback?.selfPromotionSubreddits,
    ),
    subredditPostPacks: normalizeSubredditPostPacks(
      rawRecommendations.subredditPostPacks,
      fallback?.subredditPostPacks,
    ),
  }
}

function normalizeSubredditRecommendationList(
  recommendations: unknown,
  fallback: SubredditRecommendation[] = [],
): SubredditRecommendation[] {
  const normalized = Array.isArray(recommendations)
    ? recommendations
        .map((recommendation) => normalizeSubredditRecommendation(recommendation))
        .filter((recommendation): recommendation is SubredditRecommendation => Boolean(recommendation))
    : []

  const selected = normalized.length > 0 ? normalized : fallback
  const seen = new Set<string>()
  const deduped: SubredditRecommendation[] = []

  for (const recommendation of selected) {
    const slug = extractSubredditSlug(recommendation.name || recommendation.url)
    const key = slug.toLowerCase()
    if (!slug || seen.has(key)) {
      continue
    }

    seen.add(key)
    deduped.push({
      name: `r/${slug}`,
      url: buildSubredditUrl(slug),
      reason: safeString(recommendation.reason),
      postingGuidance: safeString(recommendation.postingGuidance),
    })
  }

  return deduped.slice(0, 6)
}

function normalizeSubredditRecommendation(
  recommendation: unknown,
): SubredditRecommendation | null {
  const rawRecommendation = isRecord(recommendation) ? recommendation : {}
  const name = safeString(rawRecommendation.name)
  const rawUrl = safeString(rawRecommendation.url)
  const slug = extractSubredditSlug(name || rawUrl)

  if (!slug) {
    return null
  }

  return {
    name: `r/${slug}`,
    url: buildSubredditUrl(slug),
    reason: safeString(rawRecommendation.reason),
    postingGuidance: safeString(rawRecommendation.postingGuidance),
  }
}

function normalizeSubredditPostPacks(
  packs: unknown,
  fallback: SubredditPostPack[] = [],
): SubredditPostPack[] {
  const normalized = Array.isArray(packs)
    ? packs
        .map((pack, index) => normalizeSubredditPostPack(pack, index))
        .filter((pack): pack is SubredditPostPack => Boolean(pack))
    : []
  const selected = normalized.length > 0 ? normalized : fallback
  const seen = new Set<string>()
  const deduped: SubredditPostPack[] = []

  for (const pack of selected) {
    const slug = extractSubredditSlug(pack.subreddit || pack.url)
    const key = slug.toLowerCase()
    if (!slug || seen.has(key)) {
      continue
    }

    seen.add(key)
    deduped.push({
      ...pack,
      subreddit: `r/${slug}`,
      url: buildSubredditUrl(slug),
      riskNotes: safeStringArray(pack.riskNotes, 6),
      variants: normalizeRedditPostVariants(pack.variants, slug),
    })

    if (deduped.length >= 6) {
      break
    }
  }

  return deduped.filter((pack) => pack.variants.length > 0)
}

function normalizeSubredditPostPack(pack: unknown, index: number): SubredditPostPack | null {
  const rawPack = isRecord(pack) ? pack : {}
  const slug = extractSubredditSlug(safeString(rawPack.subreddit) || safeString(rawPack.url))
  if (!slug) {
    return null
  }

  const variants = normalizeRedditPostVariants(rawPack.variants, slug)
  if (!variants.length) {
    return null
  }

  return {
    subreddit: `r/${slug}`,
    url: buildSubredditUrl(slug),
    audienceFit: safeString(rawPack.audienceFit),
    ruleSnapshot: safeString(rawPack.ruleSnapshot) ||
      'Unverified rule snapshot. Check the current subreddit sidebar, wiki, pinned posts, and flair requirements before posting.',
    promotionPolicy: isRedditPromotionPolicy(rawPack.promotionPolicy)
      ? rawPack.promotionPolicy
      : 'unknown',
    activitySignal: isRedditActivitySignal(rawPack.activitySignal)
      ? rawPack.activitySignal
      : 'unknown',
    suggestedFlair: safeString(rawPack.suggestedFlair),
    bestPostType: safeString(rawPack.bestPostType),
    whyItFits: safeString(rawPack.whyItFits),
    riskNotes: safeStringArray(rawPack.riskNotes, 6),
    variants: variants.map((variant, variantIndex) => ({
      ...variant,
      id: variant.id || `${slug}-variant-${index + 1}-${variantIndex + 1}`,
    })),
  }
}

function normalizeRedditPostVariants(value: unknown, subredditSlug: string): RedditPostVariant[] {
  if (!Array.isArray(value)) {
    return []
  }

  const variants: RedditPostVariant[] = []
  for (const [index, variant] of value.entries()) {
    const normalized = normalizeRedditPostVariant(variant, subredditSlug, index)
    if (!normalized) {
      continue
    }

    variants.push(normalized)
    if (variants.length >= 4) {
      break
    }
  }

  return variants
}

function normalizeRedditPostVariant(
  variant: unknown,
  subredditSlug: string,
  index: number,
): RedditPostVariant | null {
  const rawVariant = isRecord(variant) ? variant : {}
  const title = safeString(rawVariant.title)
  const body = safeString(rawVariant.body)
  if (!title && !body) {
    return null
  }

  return {
    id: safeString(rawVariant.id) || `${subredditSlug}-variant-${index + 1}`,
    mode: isRedditPostVariantMode(rawVariant.mode) ? rawVariant.mode : 'conservative',
    title,
    body,
    cta: safeString(rawVariant.cta),
    riskLevel: isRedditRiskLevel(rawVariant.riskLevel) ? rawVariant.riskLevel : 'medium',
    positioningNote: safeString(rawVariant.positioningNote),
    prePostChecklist: safeStringArray(rawVariant.prePostChecklist, 6),
  }
}

function isRedditPromotionPolicy(value: unknown): value is RedditPromotionPolicy {
  return (
    value === 'unknown' ||
    value === 'discussion_only' ||
    value === 'self_promo_limited' ||
    value === 'self_promo_allowed'
  )
}

function isRedditRiskLevel(value: unknown): value is RedditRiskLevel {
  return value === 'low' || value === 'medium' || value === 'high'
}

function isRedditActivitySignal(value: unknown): value is RedditActivitySignal {
  return value === 'low' || value === 'medium' || value === 'high' || value === 'unknown'
}

function isRedditPostVariantMode(value: unknown): value is RedditPostVariantMode {
  return value === 'conservative' || value === 'self_promo'
}

function normalizeHttpUrl(
  value: unknown,
  options: {
    includePath?: boolean
  } = {},
): string {
  if (typeof value !== 'string') {
    return ''
  }

  try {
    const url = new URL(value.trim())
    if (!['http:', 'https:'].includes(url.protocol)) {
      return ''
    }
    if (isBlockedPublicLinkHost(url.hostname)) {
      return ''
    }

    url.hash = ''

    if (options.includePath === false) {
      url.pathname = ''
      url.search = ''
    }

    return url.toString()
  } catch {
    return ''
  }
}

function isBlockedPublicLinkHost(hostname: string): boolean {
  const lower = hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (
    lower === 'localhost' ||
    lower.endsWith('.localhost') ||
    lower.endsWith('.local') ||
    lower.endsWith('.lan') ||
    lower.endsWith('.home') ||
    lower === '' ||
    !lower.includes('.')
  ) {
    return true
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(lower)) {
    return isBlockedIpv4LinkHost(lower)
  }

  return isBlockedIpv6LinkHost(lower)
}

function isBlockedIpv4LinkHost(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true
  }

  const [a, b] = parts
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224
  )
}

function isBlockedIpv6LinkHost(hostname: string): boolean {
  if (!hostname.includes(':')) {
    return false
  }

  return (
    hostname === '::1' ||
    hostname.startsWith('fc') ||
    hostname.startsWith('fd') ||
    hostname.startsWith('fe80:') ||
    hostname.startsWith('::ffff:127.') ||
    hostname.startsWith('::ffff:10.') ||
    hostname.startsWith('::ffff:192.168.')
  )
}

function normalizeGeneratedAssetOutputUrl(value: unknown): string {
  const httpUrl = normalizeHttpUrl(value)
  if (httpUrl) {
    return httpUrl
  }

  if (typeof value !== 'string') {
    return ''
  }

  const trimmed = value.trim()
  return /^data:image\/(?:png|jpe?g|webp|gif|svg\+xml);base64,[a-z0-9+/=\s]+$/i.test(trimmed)
    ? trimmed
    : ''
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function extractSubredditSlug(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) {
    return ''
  }

  const urlMatch = trimmed.match(/reddit\.com\/r\/([a-z0-9_]+)/i)
  if (urlMatch?.[1]) {
    return urlMatch[1]
  }

  const pathMatch = trimmed.match(/(?:^|\/)r\/([a-z0-9_]+)/i)
  if (pathMatch?.[1]) {
    return pathMatch[1]
  }

  const slug = trimmed.replace(/^r\//i, '').replace(/^\/r\//i, '').split(/[/?#\s]/)[0] || ''
  return /^[a-z0-9_]+$/i.test(slug) ? slug : ''
}

function buildSubredditUrl(slug: string): string {
  return `https://www.reddit.com/r/${slug}/`
}
