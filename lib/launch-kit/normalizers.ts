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
  type EmailAnnouncementLaunchContent,
  type ExtractedBrief,
  type GeneratedLaunchAsset,
  type GeneratedLaunchAssetStatus,
  type GrowthAssets,
  type HackerNewsLaunchContent,
  type IndieHackersLaunchContent,
  type KeywordResearch,
  type LaunchAssetFormat,
  type LaunchAssetKind,
  type LaunchAssetMediaType,
  type LaunchKit,
  type LinkedInLaunchContent,
  type MediaKit,
  type PlatformBlock,
  type PlatformBlockId,
  type ProductHuntLaunchContent,
  type ProspectingState,
  type RedditLaunchContent,
  type RedditRecommendations,
  type SeoGrowthState,
  type SubredditRecommendation,
  type TikTokLaunchContent,
  type YouTubeShortsLaunchContent,
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
    engagementSubreddits: [],
    selfPromotionSubreddits: [],
  }
}

export function createEmptyProductHuntLaunchContent(): ProductHuntLaunchContent {
  return {
    tagline: '',
    description: '',
    tags: [],
    firstComment: '',
  }
}

export function createEmptyHackerNewsLaunchContent(): HackerNewsLaunchContent {
  return {
    showHnTitle: '',
    postBody: '',
    feedbackAsk: '',
    discussionSeed: '',
  }
}

export function createEmptyRedditLaunchContent(): RedditLaunchContent {
  return {
    postTitle: '',
    postBody: '',
    builderDisclosure: '',
    discussionQuestion: '',
    linkPolicyNote: '',
  }
}

export function createEmptyIndieHackersLaunchContent(): IndieHackersLaunchContent {
  return {
    postTitle: '',
    founderStory: '',
    lesson: '',
    proofOrMetric: '',
    nextExperiment: '',
    feedbackAsk: '',
  }
}

export function createEmptyLinkedInLaunchContent(): LinkedInLaunchContent {
  return {
    hook: '',
    postBody: '',
    proofPoint: '',
    closingCta: '',
  }
}

export function createEmptyTikTokLaunchContent(): TikTokLaunchContent {
  return {
    hook: '',
    spokenScript: '',
    visualBeats: [],
    onScreenText: [],
    closeCta: '',
  }
}

export function createEmptyYouTubeShortsLaunchContent(): YouTubeShortsLaunchContent {
  return {
    title: '',
    hook: '',
    spokenScript: '',
    visualBeats: [],
    retentionCue: '',
    closeCta: '',
  }
}

export function createEmptyEmailAnnouncementLaunchContent(): EmailAnnouncementLaunchContent {
  return {
    subject: '',
    previewText: '',
    greeting: '',
    opening: '',
    body: '',
    ctaText: '',
    signoff: '',
  }
}

export function normalizeProductHuntLaunchContent(
  content: Partial<ProductHuntLaunchContent> | null | undefined,
  fallback: Partial<ProductHuntLaunchContent> = {},
): ProductHuntLaunchContent {
  return {
    tagline: limitText(content?.tagline || fallback.tagline || '', 60),
    description: limitText(content?.description || fallback.description || '', 500),
    tags: normalizeProductHuntTags(content?.tags || fallback.tags),
    firstComment: (content?.firstComment || fallback.firstComment || '').trim(),
  }
}

export function normalizeHackerNewsLaunchContent(
  content: Partial<HackerNewsLaunchContent> | null | undefined,
  fallback: Partial<HackerNewsLaunchContent> = {},
): HackerNewsLaunchContent {
  return {
    showHnTitle: safeString(content?.showHnTitle || fallback.showHnTitle),
    postBody: safeString(content?.postBody || fallback.postBody),
    feedbackAsk: safeString(content?.feedbackAsk || fallback.feedbackAsk),
    discussionSeed: safeString(content?.discussionSeed || fallback.discussionSeed),
  }
}

export function normalizeRedditLaunchContent(
  content: Partial<RedditLaunchContent> | null | undefined,
  fallback: Partial<RedditLaunchContent> = {},
): RedditLaunchContent {
  return {
    postTitle: safeString(content?.postTitle || fallback.postTitle),
    postBody: safeString(content?.postBody || fallback.postBody),
    builderDisclosure: safeString(content?.builderDisclosure || fallback.builderDisclosure),
    discussionQuestion: safeString(content?.discussionQuestion || fallback.discussionQuestion),
    linkPolicyNote: safeString(content?.linkPolicyNote || fallback.linkPolicyNote),
  }
}

export function normalizeIndieHackersLaunchContent(
  content: Partial<IndieHackersLaunchContent> | null | undefined,
  fallback: Partial<IndieHackersLaunchContent> = {},
): IndieHackersLaunchContent {
  return {
    postTitle: safeString(content?.postTitle || fallback.postTitle),
    founderStory: safeString(content?.founderStory || fallback.founderStory),
    lesson: safeString(content?.lesson || fallback.lesson),
    proofOrMetric: safeString(content?.proofOrMetric || fallback.proofOrMetric),
    nextExperiment: safeString(content?.nextExperiment || fallback.nextExperiment),
    feedbackAsk: safeString(content?.feedbackAsk || fallback.feedbackAsk),
  }
}

export function normalizeLinkedInLaunchContent(
  content: Partial<LinkedInLaunchContent> | null | undefined,
  fallback: Partial<LinkedInLaunchContent> = {},
): LinkedInLaunchContent {
  return {
    hook: safeString(content?.hook || fallback.hook),
    postBody: safeString(content?.postBody || fallback.postBody),
    proofPoint: safeString(content?.proofPoint || fallback.proofPoint),
    closingCta: safeString(content?.closingCta || fallback.closingCta),
  }
}

export function normalizeTikTokLaunchContent(
  content: Partial<TikTokLaunchContent> | null | undefined,
  fallback: Partial<TikTokLaunchContent> = {},
): TikTokLaunchContent {
  return {
    hook: safeString(content?.hook || fallback.hook),
    spokenScript: safeString(content?.spokenScript || fallback.spokenScript),
    visualBeats: normalizeStringList(content?.visualBeats, fallback.visualBeats, 8),
    onScreenText: normalizeStringList(content?.onScreenText, fallback.onScreenText, 8),
    closeCta: safeString(content?.closeCta || fallback.closeCta),
  }
}

export function normalizeYouTubeShortsLaunchContent(
  content: Partial<YouTubeShortsLaunchContent> | null | undefined,
  fallback: Partial<YouTubeShortsLaunchContent> = {},
): YouTubeShortsLaunchContent {
  return {
    title: safeString(content?.title || fallback.title),
    hook: safeString(content?.hook || fallback.hook),
    spokenScript: safeString(content?.spokenScript || fallback.spokenScript),
    visualBeats: normalizeStringList(content?.visualBeats, fallback.visualBeats, 8),
    retentionCue: safeString(content?.retentionCue || fallback.retentionCue),
    closeCta: safeString(content?.closeCta || fallback.closeCta),
  }
}

export function normalizeEmailAnnouncementLaunchContent(
  content: Partial<EmailAnnouncementLaunchContent> | null | undefined,
  fallback: Partial<EmailAnnouncementLaunchContent> = {},
): EmailAnnouncementLaunchContent {
  return {
    subject: safeString(content?.subject || fallback.subject),
    previewText: safeString(content?.previewText || fallback.previewText),
    greeting: safeString(content?.greeting || fallback.greeting),
    opening: safeString(content?.opening || fallback.opening),
    body: safeString(content?.body || fallback.body),
    ctaText: safeString(content?.ctaText || fallback.ctaText),
    signoff: safeString(content?.signoff || fallback.signoff),
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
      ...(platformId === 'product_hunt'
        ? { productHunt: createEmptyProductHuntLaunchContent() }
        : {}),
      ...(platformId === 'hacker_news'
        ? { hackerNews: createEmptyHackerNewsLaunchContent() }
        : {}),
      ...(platformId === 'reddit'
        ? { reddit: createEmptyRedditLaunchContent() }
        : {}),
      ...(platformId === 'indie_hackers'
        ? { indieHackers: createEmptyIndieHackersLaunchContent() }
        : {}),
      ...(platformId === 'linkedin'
        ? { linkedin: createEmptyLinkedInLaunchContent() }
        : {}),
      ...(platformId === 'tiktok'
        ? { tiktok: createEmptyTikTokLaunchContent() }
        : {}),
      ...(platformId === 'youtube_shorts'
        ? { youtubeShorts: createEmptyYouTubeShortsLaunchContent() }
        : {}),
      ...(platformId === 'email_announcement'
        ? { emailAnnouncement: createEmptyEmailAnnouncementLaunchContent() }
        : {}),
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
  brief: Partial<ExtractedBrief> | null | undefined,
  fallback: BriefFallback = {},
): ExtractedBrief {
  return {
    sourceUrl: brief?.sourceUrl || fallback.sourceUrl || '',
    productName: brief?.productName || fallback.productName || 'Untitled Product',
    positioning: brief?.positioning || '',
    targetUsers: Array.isArray(brief?.targetUsers) ? brief.targetUsers.filter(Boolean) : [],
    icp: brief?.icp || '',
    painPoints: Array.isArray(brief?.painPoints) ? brief.painPoints.filter(Boolean) : [],
    valueProps: Array.isArray(brief?.valueProps) ? brief.valueProps.filter(Boolean) : [],
    keyClaims: Array.isArray(brief?.keyClaims) ? brief.keyClaims.filter(Boolean) : [],
    proofPoints: Array.isArray(brief?.proofPoints) ? brief.proofPoints.filter(Boolean) : [],
    voiceGuide: brief?.voiceGuide || buildDefaultVoiceGuide(brief),
    cta: brief?.cta || '',
    language: brief?.language || fallback.language || 'en',
    sourceHighlights: Array.isArray(brief?.sourceHighlights)
      ? brief.sourceHighlights.filter(Boolean)
      : [],
    detectedImageUrls: Array.isArray(brief?.detectedImageUrls)
      ? brief.detectedImageUrls.filter(Boolean)
      : [],
    crawlPages:
      Array.isArray(brief?.crawlPages) && brief.crawlPages.length > 0
        ? brief.crawlPages.filter(Boolean)
        : [brief?.sourceUrl || fallback.sourceUrl || ''],
    keywordResearch: normalizeKeywordResearch(brief?.keywordResearch),
  }
}

function buildDefaultVoiceGuide(brief: Partial<ExtractedBrief> | null | undefined): string {
  const productName = brief?.productName || 'the product'
  const audience = brief?.targetUsers?.[0] || brief?.icp || 'the target audience'

  return `Use a clear, human, product-specific voice for ${productName}. Keep claims grounded in the source brief, speak directly to ${audience}, avoid generic AI phrasing, and adapt structure and tone to each channel's social contract.`
}

export function normalizeKeywordResearch(
  research: Partial<KeywordResearch> | null | undefined,
): KeywordResearch {
  const fallback = createEmptyKeywordResearch()
  return {
    generatedAt: research?.generatedAt || fallback.generatedAt,
    notes: research?.notes || fallback.notes,
    clusters: Array.isArray(research?.clusters)
      ? research.clusters
          .map((cluster, index) => ({
            id: cluster.id || `cluster-${index + 1}`,
            topic: cluster.topic || '',
            intent: cluster.intent || 'informational',
            priority: cluster.priority || 'medium',
            keywords: Array.isArray(cluster.keywords) ? cluster.keywords.filter(Boolean) : [],
            contentAngles: Array.isArray(cluster.contentAngles)
              ? cluster.contentAngles.filter(Boolean)
              : [],
          }))
          .filter((cluster) => cluster.topic)
      : [],
  }
}

export function normalizeKit(
  kit: Partial<LaunchKit> | null | undefined,
  language: string,
): LaunchKit {
  const fallback = createEmptyKit(language)
  const platformBlocks = { ...fallback.platformBlocks }

  for (const blockId of PLATFORM_IDS) {
    const block = kit?.platformBlocks?.[blockId]
    if (!block) {
      continue
    }

    platformBlocks[blockId] = normalizePlatformBlock(blockId, block)
  }

  const channelPacks = normalizeChannelPacks(kit?.channelPacks, platformBlocks)

  return {
    generatedAt: kit?.generatedAt || fallback.generatedAt,
    language: kit?.language || language,
    platformBlocks,
    channelPacks,
    mediaKit: {
      founderCompanyBio: kit?.mediaKit?.founderCompanyBio || '',
      productOneLiner: kit?.mediaKit?.productOneLiner || '',
      boilerplate: kit?.mediaKit?.boilerplate || '',
      pressRelease: kit?.mediaKit?.pressRelease || '',
      keyVisualsChecklist: Array.isArray(kit?.mediaKit?.keyVisualsChecklist)
        ? kit.mediaKit.keyVisualsChecklist.filter(Boolean)
        : [],
      screenshotsAndLogos: kit?.mediaKit?.screenshotsAndLogos || '',
      contactDetails: kit?.mediaKit?.contactDetails || '',
    },
    assetLibrary: normalizeAssetLibrary(kit?.assetLibrary),
    growthAssets: {
      ...fallback.growthAssets,
      ...(kit?.growthAssets || {}),
      linkedinOutreach: {
        ...fallback.growthAssets.linkedinOutreach,
        ...(kit?.growthAssets?.linkedinOutreach || {}),
        variants: Array.isArray(kit?.growthAssets?.linkedinOutreach?.variants)
          ? kit.growthAssets.linkedinOutreach.variants.filter((variant) => variant.message)
          : [],
      },
      xOutreach: {
        ...fallback.growthAssets.xOutreach,
        ...(kit?.growthAssets?.xOutreach || {}),
        variants: Array.isArray(kit?.growthAssets?.xOutreach?.variants)
          ? kit.growthAssets.xOutreach.variants.filter((variant) => variant.message)
          : [],
      },
      emailOutreach: {
        ...fallback.growthAssets.emailOutreach,
        ...(kit?.growthAssets?.emailOutreach || {}),
        variants: Array.isArray(kit?.growthAssets?.emailOutreach?.variants)
          ? kit.growthAssets.emailOutreach.variants.filter((variant) => variant.message)
          : [],
      },
      seoPostPacks: Array.isArray(kit?.growthAssets?.seoPostPacks)
        ? kit.growthAssets.seoPostPacks.filter((pack) => pack.title || pack.draft)
        : [],
      followUpSequences: Array.isArray(kit?.growthAssets?.followUpSequences)
        ? kit.growthAssets.followUpSequences.filter((item) => item.message)
        : [],
    },
    prospecting: {
      ...fallback.prospecting,
      ...(kit?.prospecting || {}),
      queryHints: Array.isArray(kit?.prospecting?.queryHints)
        ? kit.prospecting.queryHints.filter(Boolean)
        : [],
      leads: Array.isArray(kit?.prospecting?.leads) ? kit.prospecting.leads : [],
      personalizedOutreach: Array.isArray(kit?.prospecting?.personalizedOutreach)
        ? kit.prospecting.personalizedOutreach
        : [],
      actionRuns: Array.isArray(kit?.prospecting?.actionRuns) ? kit.prospecting.actionRuns : [],
      emailJobs: Array.isArray(kit?.prospecting?.emailJobs) ? kit.prospecting.emailJobs : [],
      lastScrapeAt: kit?.prospecting?.lastScrapeAt || '',
      lastEmailBuildAt: kit?.prospecting?.lastEmailBuildAt || '',
    },
    seoGrowth: normalizeSeoGrowthState(kit?.seoGrowth),
  }
}

function normalizePlatformBlock(
  blockId: PlatformBlockId,
  block: Partial<PlatformBlock>,
): PlatformBlock {
  const notes = safeString(block.notes)

  if (blockId === 'product_hunt') {
    const productHunt = normalizeProductHuntLaunchContent(block.productHunt, {
      tagline: block.title,
      description: block.body,
      firstComment: block.body,
    })

    return {
      id: blockId,
      label: block.label || PLATFORM_LABELS[blockId],
      title: productHunt.tagline || safeString(block.title),
      body: productHunt.description || safeString(block.body),
      cta: safeString(block.cta),
      notes,
      productHunt,
    }
  }

  if (blockId === 'hacker_news') {
    const hackerNews = normalizeHackerNewsLaunchContent(block.hackerNews, {
      showHnTitle: block.title,
      postBody: block.body,
      feedbackAsk: block.cta,
      discussionSeed: block.notes,
    })

    return {
      id: blockId,
      label: block.label || PLATFORM_LABELS[blockId],
      title: hackerNews.showHnTitle || safeString(block.title),
      body: [hackerNews.postBody, hackerNews.feedbackAsk, hackerNews.discussionSeed]
        .filter(Boolean)
        .join('\n\n') || safeString(block.body),
      cta: hackerNews.feedbackAsk || safeString(block.cta),
      notes,
      hackerNews,
    }
  }

  if (blockId === 'reddit') {
    const reddit = normalizeRedditLaunchContent(block.reddit, {
      postTitle: block.title,
      postBody: block.body,
      builderDisclosure: 'I am the builder.',
      discussionQuestion: block.cta,
      linkPolicyNote: block.notes,
    })

    return {
      id: blockId,
      label: block.label || PLATFORM_LABELS[blockId],
      title: reddit.postTitle || safeString(block.title),
      body: [reddit.postBody, reddit.builderDisclosure, reddit.discussionQuestion]
        .filter(Boolean)
        .join('\n\n') || safeString(block.body),
      cta: reddit.discussionQuestion || safeString(block.cta),
      notes,
      reddit,
      redditRecommendations: normalizeRedditRecommendations(block.redditRecommendations),
    }
  }

  if (blockId === 'indie_hackers') {
    const indieHackers = normalizeIndieHackersLaunchContent(block.indieHackers, {
      postTitle: block.title,
      founderStory: block.body,
      feedbackAsk: block.cta,
      nextExperiment: block.notes,
    })

    return {
      id: blockId,
      label: block.label || PLATFORM_LABELS[blockId],
      title: indieHackers.postTitle || safeString(block.title),
      body: [
        indieHackers.founderStory,
        indieHackers.lesson,
        indieHackers.proofOrMetric,
        indieHackers.nextExperiment,
        indieHackers.feedbackAsk,
      ].filter(Boolean).join('\n\n') || safeString(block.body),
      cta: indieHackers.feedbackAsk || safeString(block.cta),
      notes,
      indieHackers,
    }
  }

  if (blockId === 'linkedin') {
    const linkedin = normalizeLinkedInLaunchContent(block.linkedin, {
      hook: block.title,
      postBody: block.body,
      proofPoint: block.notes,
      closingCta: block.cta,
    })

    return {
      id: blockId,
      label: block.label || PLATFORM_LABELS[blockId],
      title: linkedin.hook || safeString(block.title),
      body: [linkedin.hook, linkedin.postBody, linkedin.proofPoint, linkedin.closingCta]
        .filter(Boolean)
        .join('\n\n') || safeString(block.body),
      cta: linkedin.closingCta || safeString(block.cta),
      notes,
      linkedin,
    }
  }

  if (blockId === 'tiktok') {
    const tiktok = normalizeTikTokLaunchContent(block.tiktok, {
      hook: block.title,
      spokenScript: block.body,
      closeCta: block.cta,
    })

    return {
      id: blockId,
      label: block.label || PLATFORM_LABELS[blockId],
      title: tiktok.hook || safeString(block.title),
      body: [
        tiktok.hook,
        tiktok.spokenScript,
        ...tiktok.visualBeats,
        ...tiktok.onScreenText,
      ].filter(Boolean).join('\n\n') || safeString(block.body),
      cta: tiktok.closeCta || safeString(block.cta),
      notes,
      tiktok,
    }
  }

  if (blockId === 'youtube_shorts') {
    const youtubeShorts = normalizeYouTubeShortsLaunchContent(block.youtubeShorts, {
      title: block.title,
      hook: block.title,
      spokenScript: block.body,
      closeCta: block.cta,
    })

    return {
      id: blockId,
      label: block.label || PLATFORM_LABELS[blockId],
      title: youtubeShorts.title || youtubeShorts.hook || safeString(block.title),
      body: [
        youtubeShorts.hook,
        youtubeShorts.spokenScript,
        ...youtubeShorts.visualBeats,
        youtubeShorts.retentionCue,
      ].filter(Boolean).join('\n\n') || safeString(block.body),
      cta: youtubeShorts.closeCta || safeString(block.cta),
      notes,
      youtubeShorts,
    }
  }

  const emailAnnouncement = normalizeEmailAnnouncementLaunchContent(block.emailAnnouncement, {
    subject: block.title,
    body: block.body,
    ctaText: block.cta,
    previewText: block.notes,
  })

  return {
    id: blockId,
    label: block.label || PLATFORM_LABELS[blockId],
    title: emailAnnouncement.subject || safeString(block.title),
    body: [
      emailAnnouncement.previewText,
      emailAnnouncement.greeting,
      emailAnnouncement.opening,
      emailAnnouncement.body,
      emailAnnouncement.ctaText,
      emailAnnouncement.signoff,
    ].filter(Boolean).join('\n\n') || safeString(block.body),
    cta: emailAnnouncement.ctaText || safeString(block.cta),
    notes,
    emailAnnouncement,
  }
}

function normalizeProductHuntTags(tags: unknown): string[] {
  return Array.isArray(tags)
    ? tags
        .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
        .filter(Boolean)
        .slice(0, 3)
    : []
}

function limitText(value: string, maxLength: number): string {
  const trimmed = value.trim()
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength).trim() : trimmed
}

function normalizeStringList(
  values: unknown,
  fallback: string[] | undefined,
  maxItems: number,
): string[] {
  const normalized = Array.isArray(values)
    ? values.map((item) => safeString(item)).filter(Boolean).slice(0, maxItems)
    : []

  return normalized.length > 0
    ? normalized
    : Array.isArray(fallback)
      ? fallback.map((item) => safeString(item)).filter(Boolean).slice(0, maxItems)
      : []
}

export function normalizeChannelPacks(
  channelPacks:
    | Partial<Record<ChannelPackId, Partial<ChannelPack> | null>>
    | null
    | undefined,
  platformBlocks: Record<PlatformBlockId, PlatformBlock> = createEmptyPlatformBlocks(),
): Record<ChannelPackId, ChannelPack> {
  const normalized = createEmptyChannelPacks()

  for (const channelId of CHANNEL_PACK_IDS) {
    const rawPack = channelPacks?.[channelId]
    const legacyPack = synthesizeChannelPackFromPlatformBlock(channelId, platformBlocks)
    const rawCards = Array.isArray(rawPack?.cards) ? rawPack.cards : []
    const cards = rawCards
      .map((card, index) => normalizeChannelCard(card, channelId, index))
      .filter((card): card is ChannelCard => Boolean(card))

    normalized[channelId] = {
      id: channelId,
      label: rawPack?.label?.trim() || CHANNEL_PACK_LABELS[channelId],
      notes: rawPack?.notes?.trim() || legacyPack.notes,
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
  card: Partial<ChannelCard> | null | undefined,
  channelId: ChannelPackId,
  index: number,
): ChannelCard | null {
  const title = safeString(card?.title)
  const body = safeString(card?.body)
  const cta = safeString(card?.cta)

  if (!title && !body && !cta) {
    return null
  }

  return {
    id: safeString(card?.id) || `${channelId}-card-${index + 1}`,
    title,
    body,
    cta,
    proofPoint: safeString(card?.proofPoint) || inferProofPointFromText(body),
    stage: isChannelCardStage(card?.stage) ? card.stage : 'evergreen',
    format: safeString(card?.format) || 'Native post',
    socialContractNote: safeString(card?.socialContractNote),
    qualityChecks: Array.isArray(card?.qualityChecks)
      ? card.qualityChecks.map((item) => safeString(item)).filter(Boolean).slice(0, 6)
      : [],
  }
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
  if (!block || !(block.title.trim() || block.body.trim() || block.cta.trim())) {
    return emptyPack
  }

  return {
    id: channelId,
    label: CHANNEL_PACK_LABELS[channelId],
    notes: block.notes,
    cards: [
      {
        id: `${channelId}-legacy-launch`,
        title: block.title,
        body: block.body,
        cta: block.cta,
        proofPoint: inferProofPointFromText(block.body) || 'Review source evidence before publishing.',
        stage: 'launch_day',
        format: 'Launch post',
        socialContractNote: block.notes,
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
  assetLibrary: Partial<AssetLibrary> | null | undefined,
): AssetLibrary {
  return {
    templates: DEFAULT_LAUNCH_ASSET_TEMPLATES,
    generatedAssets: Array.isArray(assetLibrary?.generatedAssets)
      ? assetLibrary.generatedAssets
          .map((asset, index) => normalizeGeneratedAsset(asset, index))
          .filter(Boolean) as GeneratedLaunchAsset[]
      : [],
  }
}

function normalizeGeneratedAsset(
  asset: Partial<GeneratedLaunchAsset> | null | undefined,
  index: number,
): GeneratedLaunchAsset | null {
  if (!asset?.templateId) {
    return null
  }

  const template = DEFAULT_LAUNCH_ASSET_TEMPLATES.find((item) => item.id === asset.templateId)
  if (!template) {
    return null
  }

  const format = isLaunchAssetFormat(asset.format) && template.formats.includes(asset.format)
    ? asset.format
    : template.formats[0]

  return {
    id: asset.id || `${asset.templateId}-${format}-${index + 1}`,
    templateId: asset.templateId,
    kind: isLaunchAssetKind(asset.kind) ? asset.kind : template.kind,
    mediaType: isLaunchAssetMediaType(asset.mediaType) ? asset.mediaType : template.mediaType,
    format,
    status: isGeneratedAssetStatus(asset.status) ? asset.status : 'failed',
    title: asset.title || template.title,
    prompt: asset.prompt || '',
    outputUrl: asset.outputUrl || '',
    outputText: asset.outputText || '',
    replicatePredictionId: asset.replicatePredictionId || '',
    error: asset.error || '',
    createdAt: asset.createdAt || new Date().toISOString(),
    updatedAt: asset.updatedAt || asset.createdAt || new Date().toISOString(),
  }
}

export function normalizeSeoGrowthState(
  seoGrowth: Partial<SeoGrowthState> | null | undefined,
): SeoGrowthState {
  const fallback = createEmptySeoGrowthState()

  return {
    ...fallback,
    ...(seoGrowth || {}),
    websiteAnalysis: seoGrowth?.websiteAnalysis
      ? {
          generatedAt: seoGrowth.websiteAnalysis.generatedAt || '',
          score: clampNumber(seoGrowth.websiteAnalysis.score, 0, 100, 0),
          summary: seoGrowth.websiteAnalysis.summary || '',
          strengths: Array.isArray(seoGrowth.websiteAnalysis.strengths)
            ? seoGrowth.websiteAnalysis.strengths.filter(Boolean)
            : [],
          fixes: Array.isArray(seoGrowth.websiteAnalysis.fixes)
            ? seoGrowth.websiteAnalysis.fixes.filter(Boolean)
            : [],
          checks: Array.isArray(seoGrowth.websiteAnalysis.checks)
            ? seoGrowth.websiteAnalysis.checks
                .map((check, index) => ({
                  id: check.id || `seo-check-${index + 1}`,
                  label: check.label || '',
                  status: ['pass', 'warning', 'fail'].includes(check.status)
                    ? check.status
                    : 'warning',
                  detail: check.detail || '',
                }))
                .filter((check) => check.label || check.detail)
            : [],
          llmReadinessNotes: Array.isArray(seoGrowth.websiteAnalysis.llmReadinessNotes)
            ? seoGrowth.websiteAnalysis.llmReadinessNotes.filter(Boolean)
            : [],
        }
      : null,
    blogStrategy: Array.isArray(seoGrowth?.blogStrategy)
      ? seoGrowth.blogStrategy
          .map((post, index) => ({
            id: post.id || `blog-post-${index + 1}`,
            dayOffset: clampNumber(post.dayOffset, 0, 365, index * 4),
            keywordClusterId: post.keywordClusterId || `cluster-${index + 1}`,
            keywordTopic: post.keywordTopic || '',
            title: post.title || '',
            intent: post.intent || 'informational',
            targetKeywords: Array.isArray(post.targetKeywords)
              ? post.targetKeywords.filter(Boolean)
              : [],
            tableIdeas: Array.isArray(post.tableIdeas) ? post.tableIdeas.filter(Boolean) : [],
            outline: Array.isArray(post.outline) ? post.outline.filter(Boolean) : [],
            llmNotes: Array.isArray(post.llmNotes) ? post.llmNotes.filter(Boolean) : [],
            cta: post.cta || '',
          }))
          .filter((post) => post.title || post.keywordTopic)
      : [],
    freeTools: Array.isArray(seoGrowth?.freeTools)
      ? seoGrowth.freeTools
          .map((tool, index) => ({
            id: tool.id || `free-tool-${index + 1}`,
            category: tool.category || '',
            title: tool.title || '',
            url: tool.url || '',
            workflow: tool.workflow || '',
          }))
          .filter((tool) => tool.title)
      : [],
    backlinkProspects: Array.isArray(seoGrowth?.backlinkProspects)
      ? seoGrowth.backlinkProspects
          .map((prospect, index) => ({
            id: prospect.id || `backlink-${index + 1}`,
            website: prospect.website || '',
            domain: prospect.domain || '',
            title: prospect.title || '',
            contactName: prospect.contactName || '',
            contactEmail: prospect.contactEmail || '',
            scrapedSummary: prospect.scrapedSummary || '',
            relevanceReason: prospect.relevanceReason || '',
            backlinkAngle: prospect.backlinkAngle || '',
            costToList:
              typeof prospect.costToList === 'number' && Number.isFinite(prospect.costToList)
                ? prospect.costToList
                : null,
            estimatedTraffic:
              typeof prospect.estimatedTraffic === 'number' && Number.isFinite(prospect.estimatedTraffic)
                ? prospect.estimatedTraffic
                : null,
            relevanceScore: clampNumber(prospect.relevanceScore, 0, 100, 50),
            trafficScore: clampNumber(prospect.trafficScore, 0, 100, 50),
            authorityScore: clampNumber(prospect.authorityScore, 0, 100, 50),
            contactabilityScore: clampNumber(prospect.contactabilityScore, 0, 100, 50),
            costScore: clampNumber(prospect.costScore, 0, 100, 50),
            valueScore: clampNumber(prospect.valueScore, 0, 100, 50),
            status: [
              'new',
              'first_contact',
              'second_contact',
              'in_negotiation',
              'closed',
              'rejected',
            ].includes(prospect.status)
              ? prospect.status
              : 'new',
            listIds: Array.isArray(prospect.listIds) ? prospect.listIds.filter(Boolean) : [],
            customizedEmailSubject: prospect.customizedEmailSubject || '',
            customizedEmailBody: prospect.customizedEmailBody || '',
            source: prospect.source || '',
            discoveredAt: prospect.discoveredAt || '',
            lastContactedAt: prospect.lastContactedAt || '',
          }))
          .filter((prospect) => prospect.website || prospect.domain || prospect.title)
      : [],
    prospectLists: Array.isArray(seoGrowth?.prospectLists)
      ? seoGrowth.prospectLists
          .map((list, index) => ({
            id: list.id || `backlink-list-${index + 1}`,
            name: list.name || '',
            description: list.description || '',
            prospectIds: Array.isArray(list.prospectIds) ? list.prospectIds.filter(Boolean) : [],
            createdAt: list.createdAt || '',
            updatedAt: list.updatedAt || '',
          }))
          .filter((list) => list.name)
      : [],
    backlinkEmailJobs: Array.isArray(seoGrowth?.backlinkEmailJobs)
      ? seoGrowth.backlinkEmailJobs
          .map((job, index) => ({
            id: job.id || `backlink-email-job-${index + 1}`,
            status: job.status === 'queued' ? ('queued' as const) : ('completed' as const),
            prospectIds: Array.isArray(job.prospectIds) ? job.prospectIds.filter(Boolean) : [],
            subject: job.subject || '',
            bodyPreview: job.bodyPreview || '',
            createdAt: job.createdAt || '',
            completedAt: job.completedAt || '',
          }))
          .filter((job) => job.prospectIds.length > 0 || job.subject)
      : [],
    lastAnalyzedAt: seoGrowth?.lastAnalyzedAt || '',
    lastBlogStrategyAt: seoGrowth?.lastBlogStrategyAt || '',
    lastBacklinkScrapeAt: seoGrowth?.lastBacklinkScrapeAt || '',
    lastBacklinkEmailAt: seoGrowth?.lastBacklinkEmailAt || '',
  }
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }

  return Math.max(min, Math.min(max, value))
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

export function normalizeRedditRecommendations(
  recommendations:
    | {
        engagementSubreddits?: Partial<SubredditRecommendation>[] | null
        selfPromotionSubreddits?: Partial<SubredditRecommendation>[] | null
      }
    | null
    | undefined,
  fallback?: RedditRecommendations,
): RedditRecommendations {
  return {
    engagementSubreddits: normalizeSubredditRecommendationList(
      recommendations?.engagementSubreddits,
      fallback?.engagementSubreddits,
    ),
    selfPromotionSubreddits: normalizeSubredditRecommendationList(
      recommendations?.selfPromotionSubreddits,
      fallback?.selfPromotionSubreddits,
    ),
  }
}

function normalizeSubredditRecommendationList(
  recommendations: Partial<SubredditRecommendation>[] | null | undefined,
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
      url: recommendation.url.trim() || buildSubredditUrl(slug),
      reason: recommendation.reason.trim(),
      postingGuidance: recommendation.postingGuidance.trim(),
    })
  }

  return deduped.slice(0, 6)
}

function normalizeSubredditRecommendation(
  recommendation: Partial<SubredditRecommendation> | null | undefined,
): SubredditRecommendation | null {
  const name = safeString(recommendation?.name)
  const rawUrl = safeString(recommendation?.url)
  const slug = extractSubredditSlug(name || rawUrl)

  if (!slug) {
    return null
  }

  return {
    name: `r/${slug}`,
    url: rawUrl || buildSubredditUrl(slug),
    reason: safeString(recommendation?.reason),
    postingGuidance: safeString(recommendation?.postingGuidance),
  }
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
