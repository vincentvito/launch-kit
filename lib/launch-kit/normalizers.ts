import {
  PLATFORM_IDS,
  PLATFORM_LABELS,
  type ExtractedBrief,
  type GrowthAssets,
  type KeywordResearch,
  type LaunchKit,
  type MediaKit,
  type PlatformBlock,
  type PlatformBlockId,
  type ProspectingState,
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
    }
  }

  return platformBlocks
}

export function createEmptyKit(language: string): LaunchKit {
  return {
    generatedAt: new Date().toISOString(),
    language,
    platformBlocks: createEmptyPlatformBlocks(),
    mediaKit: createEmptyMediaKit(),
    growthAssets: createEmptyGrowthAssets(),
    prospecting: createEmptyProspectingState(),
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

    platformBlocks[blockId] = {
      id: blockId,
      label: block.label || PLATFORM_LABELS[blockId],
      title: block.title || '',
      body: block.body || '',
      cta: block.cta || '',
      notes: block.notes || '',
    }
  }

  return {
    generatedAt: kit?.generatedAt || fallback.generatedAt,
    language: kit?.language || language,
    platformBlocks,
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
  }
}
