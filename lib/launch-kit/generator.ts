import {
  CHANNEL_PACK_IDS,
  CHANNEL_PACK_LABELS,
  GROWTH_BLOCK_IDS,
  GROWTH_BLOCK_LABELS,
  PLATFORM_LABELS,
  type ChannelCard,
  type ChannelCardStage,
  type ChannelCardTarget,
  type ChannelPack,
  type ChannelPackId,
  type ExtractedBrief,
  type GrowthAssets,
  type GrowthBlockId,
  type LaunchKit,
  type MediaKit,
  type OutreachPack,
  type OutreachVariant,
  type PlatformBlock,
  type PlatformBlockId,
  type RedditRecommendations,
  type SeoPostPack,
  type SubredditRecommendation,
} from '@/lib/launch-kit/types'
import {
  createEmptyAssetLibrary,
  createEmptyChannelPacks,
  createEmptyKit,
  createEmptyProspectingState,
  createEmptySeoGrowthState,
  normalizeRedditRecommendations,
} from '@/lib/launch-kit/normalizers'
import {
  FREE_CHANNEL_PACK_IDS,
  FREE_PLATFORM_BLOCK_IDS,
  isFreeChannelCard,
} from '@/lib/launch-kit/plans'
import { isPlatformBlockId, safeJsonParse } from '@/lib/launch-kit/utils'
import { hasReplicateToken, runReplicateStructured } from '@/lib/launch-kit/replicate'

type GenerateInput = {
  brief: ExtractedBrief
  selectedBlocks?: PlatformBlockId[]
  selectedChannelPackIds?: ChannelPackId[]
  channelCardTarget?: ChannelCardTarget | null
  selectedGrowthBlocks?: GrowthBlockId[]
  includeMediaKit?: boolean
  includeGrowthAssets?: boolean
  existingKit?: LaunchKit | null
}

type RawSubredditRecommendation = Partial<SubredditRecommendation>

type RawRedditRecommendations = {
  engagementSubreddits?: RawSubredditRecommendation[]
  selfPromotionSubreddits?: RawSubredditRecommendation[]
}

type RawPlatformBlock = {
  title?: string
  body?: string
  cta?: string
  notes?: string
  redditRecommendations?: RawRedditRecommendations
}

type RawChannelCard = {
  id?: string
  title?: string
  body?: string
  cta?: string
  proofPoint?: string
  stage?: string
  format?: string
  socialContractNote?: string
  qualityChecks?: string[]
}

type RawChannelPack = {
  notes?: string
  cards?: RawChannelCard[]
  redditRecommendations?: RawRedditRecommendations
}

type ModelOutput = {
  platformBlocks?: Record<string, RawPlatformBlock>
  channelPacks?: Record<string, RawChannelPack>
  mediaKit?: {
    founderCompanyBio?: string
    productOneLiner?: string
    boilerplate?: string
    pressRelease?: string
    keyVisualsChecklist?: string[]
    screenshotsAndLogos?: string
    contactDetails?: string
  }
  growthAssets?: {
    linkedinOutreach?: {
      notes?: string
      personalizationTemplate?: string
      variants?: Array<{
        title?: string
        subject?: string
        message?: string
        cta?: string
      }>
    }
    xOutreach?: {
      notes?: string
      personalizationTemplate?: string
      variants?: Array<{
        title?: string
        message?: string
        cta?: string
      }>
    }
    emailOutreach?: {
      notes?: string
      personalizationTemplate?: string
      variants?: Array<{
        title?: string
        subject?: string
        message?: string
        cta?: string
      }>
    }
    seoPostPacks?: Array<{
      keywordClusterId?: string
      keywordTopic?: string
      title?: string
      metaDescription?: string
      outline?: string[]
      draft?: string
      cta?: string
    }>
  }
}

const STRING_SCHEMA = { type: 'string' } as const

const PLATFORM_BLOCK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: STRING_SCHEMA,
    body: STRING_SCHEMA,
    cta: STRING_SCHEMA,
    notes: STRING_SCHEMA,
  },
  required: ['title', 'body', 'cta', 'notes'],
} as const

const SUBREDDIT_RECOMMENDATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: STRING_SCHEMA,
    url: STRING_SCHEMA,
    reason: STRING_SCHEMA,
    postingGuidance: STRING_SCHEMA,
  },
  required: ['name', 'url', 'reason', 'postingGuidance'],
} as const

const REDDIT_RECOMMENDATIONS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    engagementSubreddits: {
      type: 'array',
      items: SUBREDDIT_RECOMMENDATION_SCHEMA,
      maxItems: 6,
    },
    selfPromotionSubreddits: {
      type: 'array',
      items: SUBREDDIT_RECOMMENDATION_SCHEMA,
      maxItems: 6,
    },
  },
  required: ['engagementSubreddits', 'selfPromotionSubreddits'],
} as const

const REDDIT_PLATFORM_BLOCK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: STRING_SCHEMA,
    body: STRING_SCHEMA,
    cta: STRING_SCHEMA,
    notes: STRING_SCHEMA,
    redditRecommendations: REDDIT_RECOMMENDATIONS_SCHEMA,
  },
  required: ['title', 'body', 'cta', 'notes', 'redditRecommendations'],
} as const

const CHANNEL_CARD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: STRING_SCHEMA,
    title: STRING_SCHEMA,
    body: STRING_SCHEMA,
    cta: STRING_SCHEMA,
    proofPoint: STRING_SCHEMA,
    stage: STRING_SCHEMA,
    format: STRING_SCHEMA,
    socialContractNote: STRING_SCHEMA,
    qualityChecks: { type: 'array', items: STRING_SCHEMA, maxItems: 6 },
  },
  required: [
    'id',
    'title',
    'body',
    'cta',
    'proofPoint',
    'stage',
    'format',
    'socialContractNote',
    'qualityChecks',
  ],
} as const

const CHANNEL_PACK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    notes: STRING_SCHEMA,
    cards: { type: 'array', items: CHANNEL_CARD_SCHEMA, maxItems: 8 },
  },
  required: ['notes', 'cards'],
} as const

const REDDIT_CHANNEL_PACK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    notes: STRING_SCHEMA,
    cards: { type: 'array', items: CHANNEL_CARD_SCHEMA, maxItems: 8 },
    redditRecommendations: REDDIT_RECOMMENDATIONS_SCHEMA,
  },
  required: ['notes', 'cards', 'redditRecommendations'],
} as const

const MEDIA_KIT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    founderCompanyBio: STRING_SCHEMA,
    productOneLiner: STRING_SCHEMA,
    boilerplate: STRING_SCHEMA,
    pressRelease: STRING_SCHEMA,
    keyVisualsChecklist: { type: 'array', items: STRING_SCHEMA },
    screenshotsAndLogos: STRING_SCHEMA,
    contactDetails: STRING_SCHEMA,
  },
  required: [
    'founderCompanyBio',
    'productOneLiner',
    'boilerplate',
    'pressRelease',
    'keyVisualsChecklist',
    'screenshotsAndLogos',
    'contactDetails',
  ],
} as const

const SOCIAL_OUTREACH_VARIANT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: STRING_SCHEMA,
    message: STRING_SCHEMA,
    cta: STRING_SCHEMA,
  },
  required: ['title', 'message', 'cta'],
} as const

const EMAIL_OUTREACH_VARIANT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: STRING_SCHEMA,
    subject: STRING_SCHEMA,
    message: STRING_SCHEMA,
    cta: STRING_SCHEMA,
  },
  required: ['title', 'subject', 'message', 'cta'],
} as const

const SOCIAL_OUTREACH_PACK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    notes: STRING_SCHEMA,
    personalizationTemplate: STRING_SCHEMA,
    variants: { type: 'array', items: SOCIAL_OUTREACH_VARIANT_SCHEMA, maxItems: 3 },
  },
  required: ['notes', 'personalizationTemplate', 'variants'],
} as const

const EMAIL_OUTREACH_PACK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    notes: STRING_SCHEMA,
    personalizationTemplate: STRING_SCHEMA,
    variants: { type: 'array', items: EMAIL_OUTREACH_VARIANT_SCHEMA, maxItems: 3 },
  },
  required: ['notes', 'personalizationTemplate', 'variants'],
} as const

const SEO_POST_PACK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    keywordClusterId: STRING_SCHEMA,
    keywordTopic: STRING_SCHEMA,
    title: STRING_SCHEMA,
    metaDescription: STRING_SCHEMA,
    outline: { type: 'array', items: STRING_SCHEMA },
    draft: STRING_SCHEMA,
    cta: STRING_SCHEMA,
  },
  required: [
    'keywordClusterId',
    'keywordTopic',
    'title',
    'metaDescription',
    'outline',
    'draft',
    'cta',
  ],
} as const

function buildLaunchKitModelSchema(
  selectedBlocks: PlatformBlockId[],
  selectedChannelPackIds: ChannelPackId[],
  selectedGrowthBlocks: GrowthBlockId[],
  includeMediaKit: boolean,
  includeGrowthAssets: boolean,
): Record<string, unknown> {
  const rootProperties: Record<string, unknown> = {}

  if (selectedBlocks.length > 0) {
    rootProperties.platformBlocks = {
      type: 'object',
      additionalProperties: false,
      properties: Object.fromEntries(
        selectedBlocks.map((blockId) => [
          blockId,
          blockId === 'reddit' ? REDDIT_PLATFORM_BLOCK_SCHEMA : PLATFORM_BLOCK_SCHEMA,
        ]),
      ),
      required: selectedBlocks,
    }
  }

  if (selectedChannelPackIds.length > 0) {
    rootProperties.channelPacks = {
      type: 'object',
      additionalProperties: false,
      properties: Object.fromEntries(
        selectedChannelPackIds.map((channelId) => [
          channelId,
          channelId === 'reddit' ? REDDIT_CHANNEL_PACK_SCHEMA : CHANNEL_PACK_SCHEMA,
        ]),
      ),
      required: selectedChannelPackIds,
    }
  }

  if (includeMediaKit) {
    rootProperties.mediaKit = MEDIA_KIT_SCHEMA
  }

  if (includeGrowthAssets && selectedGrowthBlocks.length > 0) {
    const growthProperties: Record<string, unknown> = {}
    const growthRequired: string[] = []

    if (selectedGrowthBlocks.includes('linkedin_outreach')) {
      growthProperties.linkedinOutreach = SOCIAL_OUTREACH_PACK_SCHEMA
      growthRequired.push('linkedinOutreach')
    }

    if (selectedGrowthBlocks.includes('x_outreach')) {
      growthProperties.xOutreach = SOCIAL_OUTREACH_PACK_SCHEMA
      growthRequired.push('xOutreach')
    }

    if (selectedGrowthBlocks.includes('cold_email_outreach')) {
      growthProperties.emailOutreach = EMAIL_OUTREACH_PACK_SCHEMA
      growthRequired.push('emailOutreach')
    }

    if (selectedGrowthBlocks.includes('seo_posts')) {
      growthProperties.seoPostPacks = {
        type: 'array',
        items: SEO_POST_PACK_SCHEMA,
      }
      growthRequired.push('seoPostPacks')
    }

    rootProperties.growthAssets = {
      type: 'object',
      additionalProperties: false,
      properties: growthProperties,
      required: growthRequired,
    }
  }

  if (Object.keys(rootProperties).length === 0) {
    rootProperties.platformBlocks = {
      type: 'object',
      additionalProperties: false,
      properties: {},
      required: [],
    }
  }

  return {
    type: 'object',
    additionalProperties: false,
    properties: rootProperties,
    required: Object.keys(rootProperties),
  }
}

export async function generateLaunchKit(input: GenerateInput): Promise<LaunchKit> {
  const selectedBlocks = input.selectedBlocks ?? [...FREE_PLATFORM_BLOCK_IDS]
  const selectedChannelPackIds =
    input.selectedChannelPackIds ??
    (input.selectedBlocks === undefined && input.selectedGrowthBlocks === undefined
      ? [...FREE_CHANNEL_PACK_IDS]
      : [])
  const selectedGrowthBlocks = input.selectedGrowthBlocks ?? []
  const includeMediaKit = input.includeMediaKit ?? true
  const includeGrowthAssets = input.includeGrowthAssets ?? true
  const baseKit = input.existingKit ?? createEmptyKit(input.brief.language)

  if (!hasReplicateToken() && !process.env.OPENAI_API_KEY) {
    return fallbackLaunchKit(
      input.brief,
      selectedBlocks,
      selectedChannelPackIds,
      input.channelCardTarget ?? null,
      selectedGrowthBlocks,
      includeMediaKit,
      includeGrowthAssets,
      baseKit,
    )
  }

  const modelOutput =
    (await tryGenerateModelOutput(
      input.brief,
      selectedBlocks,
      selectedChannelPackIds,
      input.channelCardTarget ?? null,
      selectedGrowthBlocks,
      includeMediaKit,
      includeGrowthAssets,
    )) ||
    (await generateChunkedModelOutput(
      input.brief,
      selectedBlocks,
      selectedChannelPackIds,
      input.channelCardTarget ?? null,
      selectedGrowthBlocks,
      includeMediaKit,
      includeGrowthAssets,
    ))

  const mergedBlocks = { ...baseKit.platformBlocks }
  for (const blockId of selectedBlocks) {
    const raw = modelOutput.platformBlocks?.[blockId]
    mergedBlocks[blockId] = normalizeBlock(blockId, raw, input.brief)
  }

  const mergedChannelPacks = mergeChannelPacks(
    baseKit.channelPacks || createEmptyChannelPacks(),
    modelOutput.channelPacks,
    selectedChannelPackIds,
    input.brief,
    input.channelCardTarget ?? null,
  )

  const nextKit: LaunchKit = {
    generatedAt: new Date().toISOString(),
    language: input.brief.language,
    platformBlocks: mergedBlocks,
    channelPacks: mergedChannelPacks,
    mediaKit: includeMediaKit
      ? normalizeMediaKit(modelOutput.mediaKit, input.brief)
      : baseKit.mediaKit,
    assetLibrary: baseKit.assetLibrary || createEmptyAssetLibrary(),
    growthAssets: includeGrowthAssets
      ? normalizeGrowthAssets(modelOutput.growthAssets, selectedGrowthBlocks, input.brief, baseKit.growthAssets)
      : baseKit.growthAssets,
    prospecting: baseKit.prospecting || createEmptyProspectingState(),
    seoGrowth: baseKit.seoGrowth || createEmptySeoGrowthState(),
  }

  return nextKit
}

async function tryGenerateModelOutput(
  brief: ExtractedBrief,
  selectedBlocks: PlatformBlockId[],
  selectedChannelPackIds: ChannelPackId[],
  channelCardTarget: ChannelCardTarget | null,
  selectedGrowthBlocks: GrowthBlockId[],
  includeMediaKit: boolean,
  includeGrowthAssets: boolean,
): Promise<ModelOutput | null> {
  try {
    return hasReplicateToken()
      ? await generateWithReplicate(
          brief,
          selectedBlocks,
          selectedChannelPackIds,
          channelCardTarget,
          selectedGrowthBlocks,
          includeMediaKit,
          includeGrowthAssets,
        )
      : await generateWithOpenAi(
          brief,
          selectedBlocks,
          selectedChannelPackIds,
          channelCardTarget,
          selectedGrowthBlocks,
          includeMediaKit,
          includeGrowthAssets,
        )
  } catch (error) {
    console.warn('[launch-kit] full generation failed; retrying in smaller chunks', getErrorMessage(error))
    return null
  }
}

async function generateChunkedModelOutput(
  brief: ExtractedBrief,
  selectedBlocks: PlatformBlockId[],
  selectedChannelPackIds: ChannelPackId[],
  channelCardTarget: ChannelCardTarget | null,
  selectedGrowthBlocks: GrowthBlockId[],
  includeMediaKit: boolean,
  includeGrowthAssets: boolean,
): Promise<ModelOutput> {
  const output: ModelOutput = {
    platformBlocks: {},
    channelPacks: {},
    growthAssets: {},
  }

  for (const blockId of selectedBlocks) {
    const chunk = await tryGenerateModelOutput(brief, [blockId], [], null, [], false, false)
    if (chunk?.platformBlocks?.[blockId]) {
      output.platformBlocks = {
        ...output.platformBlocks,
        [blockId]: chunk.platformBlocks[blockId],
      }
    }
  }

  for (const channelId of selectedChannelPackIds) {
    const chunk = await tryGenerateModelOutput(
      brief,
      [],
      [channelId],
      channelCardTarget?.channelId === channelId ? channelCardTarget : null,
      [],
      false,
      false,
    )
    if (chunk?.channelPacks?.[channelId]) {
      output.channelPacks = {
        ...output.channelPacks,
        [channelId]: chunk.channelPacks[channelId],
      }
    }
  }

  if (includeMediaKit) {
    const mediaChunk = await tryGenerateModelOutput(brief, [], [], null, [], true, false)
    if (mediaChunk?.mediaKit) {
      output.mediaKit = mediaChunk.mediaKit
    }
  }

  if (includeGrowthAssets) {
    for (const blockId of selectedGrowthBlocks) {
      const chunk = await tryGenerateModelOutput(brief, [], [], null, [blockId], false, true)
      if (!chunk?.growthAssets) {
        continue
      }

      output.growthAssets = {
        ...output.growthAssets,
        ...(blockId === 'linkedin_outreach' && chunk.growthAssets.linkedinOutreach
          ? { linkedinOutreach: chunk.growthAssets.linkedinOutreach }
          : {}),
        ...(blockId === 'x_outreach' && chunk.growthAssets.xOutreach
          ? { xOutreach: chunk.growthAssets.xOutreach }
          : {}),
        ...(blockId === 'cold_email_outreach' && chunk.growthAssets.emailOutreach
          ? { emailOutreach: chunk.growthAssets.emailOutreach }
          : {}),
        ...(blockId === 'seo_posts' && chunk.growthAssets.seoPostPacks
          ? { seoPostPacks: chunk.growthAssets.seoPostPacks }
          : {}),
      }
    }
  }

  return output
}

type PromptProfile = {
  objective: string
  audience: string
  format: string
  tone: string
  contract: string
  qualityExpectations: string[]
}

const PLATFORM_PROMPT_PROFILES: Record<PlatformBlockId, PromptProfile> = {
  product_hunt: {
    objective: 'Create launch-page copy that helps Product Hunt visitors understand, remember, and support the launch.',
    audience: 'Product Hunt makers, early adopters, and category-curious buyers scanning a launch page quickly.',
    format: 'Tagline-style title, tight maker context, benefit-led body, and a calm feedback/support CTA.',
    tone: 'Crisp, useful, confident, and maker-led without hype.',
    contract:
      'Product Hunt launch-page copy with a clear tagline, maker context, concrete benefit, and calm ask for feedback/support.',
    qualityExpectations: [
      'Make the first sentence understandable without prior product knowledge.',
      'Name the specific user, problem, and outcome.',
      'Avoid buzzwords, inflated launch language, and unsupported traction.',
    ],
  },
  hacker_news: {
    objective: 'Write a Show HN post that earns technical curiosity and candid feedback.',
    audience: 'Hacker News readers who value plain explanations, implementation context, tradeoffs, and useful discussion.',
    format: 'Show HN title/body with what was built, why it exists, how it works, tradeoffs, and specific feedback asks.',
    tone: 'Plain, humble, technical when evidence supports it, and non-promotional.',
    contract:
      'Plain, technical, humble Show HN style. Explain what was built, why, tradeoffs, and what feedback is useful.',
    qualityExpectations: [
      'Lead with what was built and why it is interesting.',
      'Include a concrete tradeoff, constraint, or implementation detail from the brief when available.',
      'Do not sound like a landing page or ad.',
    ],
  },
  reddit: {
    objective: 'Draft a Reddit post that starts a real discussion before asking for attention.',
    audience: 'Subreddit members who are skeptical of promotion and respond to transparency, context, and useful questions.',
    format: 'Discussion-first post with builder disclosure, problem context, product mention only after context, and subreddit-safe CTA.',
    tone: 'Transparent, specific, conversational, and low-pressure.',
    contract:
      'Discussion-first, transparent, context-rich. Mention the product only after the problem/context. Disclose builder role and avoid naked links.',
    qualityExpectations: [
      'Make the post work even if links are removed.',
      'Ask for specific feedback from the community.',
      'Do not use launch hype, engagement bait, or generic self-promo phrasing.',
    ],
  },
  indie_hackers: {
    objective: 'Tell a build-in-public story that other makers can learn from.',
    audience: 'Indie Hackers founders and makers looking for decisions, constraints, proof, lessons, and next experiments.',
    format: 'Founder story with decision, constraint, lesson, proof if sourced, and next experiment.',
    tone: 'Specific, reflective, maker-to-maker, and candid.',
    contract:
      'Build-in-public story with decision, constraint, lesson, metric/proof if available, and next experiment.',
    qualityExpectations: [
      'Share a useful lesson or decision, not only an announcement.',
      'Use proof only when it is sourced.',
      'End with a concrete experiment or feedback question.',
    ],
  },
  linkedin: {
    objective: 'Create a professional founder/operator post that makes the business case clear.',
    audience: 'Operators, founders, functional leaders, and professional buyers evaluating whether the problem matters.',
    format: 'Insight-led LinkedIn post with stakes, audience relevance, sourced proof, and a low-friction CTA.',
    tone: 'Professional, human, precise, and lightly opinionated.',
    contract:
      'Professional but human. Lead with a founder/operator insight, show stakes, name the audience, use sourced proof, and end with a low-friction CTA.',
    qualityExpectations: [
      'Lead with an insight rather than "we launched."',
      'Show why the problem matters to the named audience.',
      'Avoid exaggerated transformation language and empty thought-leadership cadence.',
    ],
  },
  tiktok: {
    objective: 'Write a short vertical video script that earns attention fast and shows the product outcome visually.',
    audience: 'TikTok viewers who decide in the first seconds whether the problem feels familiar and worth watching.',
    format: 'Script with explicit Hook, story beats, visual actions, proof cue, and Close CTA.',
    tone: 'Direct, visual, energetic but grounded, and human-spoken.',
    contract:
      'Short founder/video script with hook, beats, proof slot, visual actions, and comment-friendly close.',
    qualityExpectations: [
      'Make the hook concrete enough to film.',
      'Show the product or outcome before the CTA.',
      'Avoid claims that would require unsupported voiceover proof.',
    ],
  },
  youtube_shorts: {
    objective: 'Write a concise Shorts script with a clear premise, visible product moment, and memorable close.',
    audience: 'YouTube Shorts viewers who expect fast context, clear payoff, and less performative pacing than TikTok.',
    format: 'Shorts script with opening line, retention beats, product moment, proof cue, and close.',
    tone: 'Clear, useful, paced, and credible.',
    contract:
      'Concise Shorts script with a clear hook, product moment, proof slot, and close CTA.',
    qualityExpectations: [
      'Make each beat filmable without relying on dense on-screen text.',
      'Keep the proof cue sourced or mark it as proof to add.',
      'Close with a useful next step, not generic engagement bait.',
    ],
  },
  email_announcement: {
    objective: 'Write a useful announcement email that explains who the launch is for and why now.',
    audience: 'Subscribers, prospects, customers, or waitlist readers who need fast relevance and a clear next step.',
    format: 'Subject, short context, audience relevance, concrete benefit, sourced proof if available, and CTA.',
    tone: 'Direct, skimmable, helpful, and respectful of inbox attention.',
    contract:
      'Useful, direct, skimmable email with subject, context, audience relevance, proof, and CTA.',
    qualityExpectations: [
      'Make the subject specific and not clickbait.',
      'Use short paragraphs and a clear CTA.',
      'Do not overstate urgency, scarcity, or proof.',
    ],
  },
}

const CHANNEL_PACK_PROMPT_PROFILES: Record<ChannelPackId, PromptProfile> = {
  x: {
    objective:
      'Write X posts that sound like a real founder or operator sharing what they built, why they built it, what they learned launching it, or what surprised them while distributing it.',
    audience:
      'X readers who respond to honest build stories, sharp lessons, useful mistakes, distribution experiments, and specific founder observations.',
    format:
      'No post titles. Write the actual post text only. Use a build story, launch lesson, distribution lesson, mistake, short thread, or reply prompt depending on the requested card.',
    tone:
      'Candid, specific, lightly opinionated, human, and a little imperfect. More founder note than marketing copy.',
    contract:
      'Public X timeline content only. The title field is an internal dashboard label; never write a title or headline inside the post body. Lead with a lived observation, mistake, lesson, constraint, or specific build/distribution story before mentioning the product.',
    qualityExpectations: [
      'Do not start with "We launched", "Introducing", "Excited to share", or a generic product claim.',
      'Make the post about a real tension: building it, finding users, launching it, positioning it, distributing it, or learning from feedback.',
      'Use first person when appropriate. Prefer "I built...", "I learned...", or "The hard part was..." over brand voice.',
      'Mention the product only after the story has earned it.',
      'No visible title, no headline, no hashtags unless explicitly useful, no polished ad cadence.',
    ],
  },
  linkedin: {
    objective: 'Create professional public posts that translate the launch into operator insight and buyer relevance.',
    audience: 'Founders, operators, functional leaders, and professional buyers who expect substance before promotion.',
    format: 'Founder launch, lesson, proof, and follow-up posts as requested.',
    tone: 'Professional, human, specific, and evidence-aware.',
    contract:
      'Founder-led professional posts with clear stakes, useful lessons, and evidence-backed claims.',
    qualityExpectations: [
      'Anchor each post in a concrete business situation.',
      'Use proof only when sourced.',
      'Avoid empty thought-leadership formulas.',
    ],
  },
  threads: {
    objective: 'Create reply-friendly posts that feel casual, current, and easy to engage with.',
    audience: 'Threads readers who respond to conversational observations, soft opinions, and low-friction questions.',
    format: 'Casual launch story, build note, reply-driving question, or follow-up post as requested.',
    tone: 'Conversational, direct, human, and less performative than X.',
    contract:
      'Casual, conversational, easy to reply to, with softer CTAs and no hard-sell launch language.',
    qualityExpectations: [
      'Sound like a person sharing a useful thought.',
      'Keep CTAs soft and reply-friendly.',
      'Do not imitate X threads or LinkedIn post structure.',
    ],
  },
  reddit: {
    objective: 'Create subreddit-safe drafts that respect community norms and separate discussion from self-promotion.',
    audience: 'Reddit members who reward context, disclosure, and useful questions while rejecting obvious promo.',
    format: 'Cautious discussion post and/or self-promo launch post as requested, plus subreddit recommendations.',
    tone: 'Transparent, specific, community-aware, and non-salesy.',
    contract:
      'Separate discussion-first and self-promo versions; check current subreddit rules and disclose builder role.',
    qualityExpectations: [
      'Disclose the builder role.',
      'Make the discussion post valuable without a link.',
      'State where self-promo must be checked against current rules/flairs.',
    ],
  },
  indie_hackers: {
    objective: 'Create maker-community posts that share lessons, tradeoffs, proof, and next experiments.',
    audience: 'Indie Hackers founders and makers looking for practical learning from real build decisions.',
    format: 'Founder launch story, build lesson, proof/learnings, or next experiment as requested.',
    tone: 'Candid, practical, founder-to-founder, and specific.',
    contract:
      'Build-in-public posts that share tradeoffs, decisions, lessons, proof, and the next experiment.',
    qualityExpectations: [
      'Include a decision or constraint, not only a launch announcement.',
      'Make the lesson transferable.',
      'Ask for feedback that can improve the next experiment.',
    ],
  },
  instagram: {
    objective: 'Translate the launch into visual-first creative that can guide a designer or founder recording assets.',
    audience: 'Instagram viewers who need a clear visual hook, simple progression, and caption that stands alone.',
    format: 'Carousel brief, launch caption, story sequence, or Reel creative brief as requested.',
    tone: 'Visual, concise, polished, and concrete.',
    contract:
      'Visual-first caption and creative brief copy. Include overlay/slide ideas and do not imply actual media was created.',
    qualityExpectations: [
      'Specify visuals, overlays, or scenes the user can actually produce.',
      'Keep text overlays short and readable.',
      'Do not pretend screenshots, videos, or testimonials exist unless sourced.',
    ],
  },
  tiktok: {
    objective: 'Create short-video scripts or prompts that feel native to vertical video and invite useful responses.',
    audience: 'TikTok viewers who need immediate relevance, visible action, and a quick payoff.',
    format: 'Founder script, problem-to-fix script, or comment prompt as requested.',
    tone: 'Fast, visual, human-spoken, and specific.',
    contract:
      'Short founder/video scripts with hook, beats, proof slot, and comment prompt.',
    qualityExpectations: [
      'Make the first beat filmable and specific.',
      'Use visual actions instead of abstract claims.',
      'Keep comment prompts useful rather than baiting engagement.',
    ],
  },
  youtube_shorts: {
    objective: 'Create concise Shorts scripts with a clean premise, retention path, and product moment.',
    audience: 'Shorts viewers who expect fast clarity, credible payoff, and a useful close.',
    format: 'Founder script, product demo script, or follow-up script as requested.',
    tone: 'Clear, paced, practical, and credible.',
    contract:
      'Concise Shorts scripts with a clear hook, product moment, proof slot, and close.',
    qualityExpectations: [
      'Make every beat easy to film.',
      'Avoid dense text overlays and unsupported voiceover claims.',
      'Close with a clear next step.',
    ],
  },
}

const GROWTH_PROMPT_PROFILES: Record<GrowthBlockId, PromptProfile> = {
  linkedin_outreach: {
    objective: 'Create one-to-one LinkedIn outreach that gives a specific relevance reason and earns permission.',
    audience: 'Prospects on LinkedIn who expect professional context, personalization, and a low-pressure ask.',
    format: 'Notes, personalization template, and three concise LinkedIn message variants.',
    tone: 'Professional, respectful, specific, and low-pressure.',
    contract:
      'Professional one-to-one LinkedIn messages with a specific reason for relevance and a low-pressure close.',
    qualityExpectations: [
      'Use placeholders such as {{firstName}}, {{company}}, and {{category}} where useful.',
      'Avoid public-post cadence, hype, and fake familiarity.',
      'Keep each message short enough for a LinkedIn DM.',
    ],
  },
  x_outreach: {
    objective: 'Create short permission-based X outreach for DMs or direct replies.',
    audience: 'Prospects on X who need a fast reason to care before any ask.',
    format: 'Notes, personalization template, and three concise X DM/reply variants.',
    tone: 'Brief, conversational, direct, and non-spammy.',
    contract:
      'Short permission-based DMs or replies, not public posts. Use placeholders such as {{firstName}}, {{company}}, and {{category}} where useful.',
    qualityExpectations: [
      'Keep messages short and skimmable.',
      'Ask permission before offering a sample or walkthrough.',
      'Do not write public timeline content.',
    ],
  },
  cold_email_outreach: {
    objective: 'Create cold email variants that are specific, useful, and easy to say no to.',
    audience: 'Prospects reading email who need relevance, credibility, and a clear but soft next step.',
    format: 'Notes, personalization template, and three email variants with subject, message, and CTA.',
    tone: 'Useful, concise, respectful, and practical.',
    contract:
      'Cold email outreach with subject lines, useful context, and a clear but soft CTA.',
    qualityExpectations: [
      'Keep subject lines specific and not clickbait.',
      'Use a concrete reason for relevance.',
      'Avoid fake urgency, fake praise, and unsupported claims.',
    ],
  },
  seo_posts: {
    objective: 'Create SEO blog post packs that turn keyword clusters into useful, searchable drafts.',
    audience: 'Searchers and answer-engine users looking for practical information, comparisons, examples, or workflow guidance.',
    format: 'Keyword-aligned title, meta description, outline, draft, and CTA for each selected cluster.',
    tone: 'Practical, answer-first, specific, and non-generic.',
    contract:
      'Practical, non-generic SEO post packs based on keyword clusters and source evidence, with useful outlines and drafts.',
    qualityExpectations: [
      'Match search intent for each cluster.',
      'Open drafts with a direct answer and useful context.',
      'Include product mentions only where they help the searcher.',
    ],
  },
}

const MEDIA_KIT_PROMPT_PROFILE: PromptProfile = {
  objective: 'Create a factual press-ready media kit that can be exported or lightly edited.',
  audience: 'Journalists, partners, launch directories, and internal marketing teams needing reliable facts quickly.',
  format: 'Founder/company bio, one-liner, boilerplate, press release, visual checklist, screenshots/logos guidance, and contact details.',
  tone: 'Factual, concise, press-ready, and source-grounded.',
  contract:
    'Factual, press-ready, website-derived. If contact details are not detected, say so.',
  qualityExpectations: [
    'Do not invent founders, funding, customers, press, or contact details.',
    'Keep claims grounded in the source brief.',
    'Write in a style that can be pasted into a press pack.',
  ],
}

function buildLaunchKitInstructions(
  selectedBlocks: PlatformBlockId[],
  selectedChannelPackIds: ChannelPackId[],
  channelCardTarget: ChannelCardTarget | null,
  selectedGrowthBlocks: GrowthBlockId[],
  includeMediaKit: boolean,
  includeGrowthAssets: boolean,
): string {
  const lines = [
    'You are Launch Kit, a senior launch strategist, growth operator, and channel-native copywriter.',
    'Mission: generate high-quality promotional content that sounds human, specific, and ready for a founder or marketer to lightly edit and publish.',
    'Core principle: every output has its own social contract. Preserve the product story, but adapt the structure, pacing, proof, CTA, and level of direct promotion to the specific requested output.',
    'Use brief.voiceGuide as the baseline brand voice. If it conflicts with a channel social contract, keep the brand personality but adapt the delivery to the channel.',
    'Ground every output in brief fields: productName, positioning, icp, targetUsers, painPoints, valueProps, keyClaims, proofPoints, voiceGuide, cta, sourceHighlights, and keywordResearch.',
    'Use concrete source details. Prefer specific nouns, audience language, workflow details, and real proof over broad adjectives.',
    'Do not write generic AI copy. Avoid phrases like "game-changer", "revolutionary", "unlock", "supercharge", "seamless", "elevate", "transform your workflow", "in today\'s fast-paced world", and "say goodbye to".',
    'Do not invent metrics, customer logos, revenue, user counts, press mentions, testimonials, founder stories, funding, security claims, or contact details.',
    'Use only proof from brief.proofPoints or source evidence. If proof is missing, mark the proof slot as "Proof to add before publishing: ..." and make the body work without that claim.',
    'Vary sentence length and rhythm. Write like a thoughtful operator, not a template. No unnecessary hashtags, emojis, em dashes, or exclamation marks.',
    'Mention AI only when the brief makes AI central through positioning, key claims, source evidence, or keyword research. Never mention the model.',
    'Respect the requested language.',
    'Only write the requested outputs. Inside each output, focus on that output alone; do not reference other channels unless the product itself is explicitly about those channels in the brief.',
    '',
    'Requested output contracts:',
    ...buildRequestedContractLines(
      selectedBlocks,
      selectedChannelPackIds,
      channelCardTarget,
      selectedGrowthBlocks,
      includeMediaKit,
      includeGrowthAssets,
    ),
  ]

  if (selectedChannelPackIds.length > 0) {
    lines.push(
      '',
      'Channel card rules:',
      '- For every requested channel card, return one polished card matching requiredChannelCards.',
      '- The body must be publishable as-is after light review and must fit the requested format.',
      '- proofPoint must be one concrete source-backed proof signal, or a clearly labeled proof-to-add slot.',
      '- socialContractNote must explain the target channel-specific posting expectation, not repeat generic advice.',
      '- qualityChecks must be actionable checks a human should run before publishing.',
    )
  }

  if (selectedChannelPackIds.includes('x')) {
    lines.push(
      '',
      'X-specific rules:',
      '- The title field is an internal dashboard label only. Never write a title or headline inside the body.',
      '- The body must read like a post someone would actually publish on X, not a launch page excerpt.',
      '- Pick one angle: honest build story, launch lesson, distribution lesson, mistake, constraint, surprising user insight, or what changed after shipping.',
      '- Avoid sterile phrases such as "streamline", "unlock", "supercharge", "the bet", "proof signal", and "next step".',
      '- If proof is missing, do not write "Proof signal" in the body. Put proof needs in proofPoint or qualityChecks only.',
    )
  }

  if (selectedBlocks.includes('reddit') || selectedChannelPackIds.includes('reddit')) {
    lines.push(
      '',
      'Reddit recommendation rules:',
      '- Return redditRecommendations with engagementSubreddits and selfPromotionSubreddits.',
      '- Each list may contain up to 6 relevant subreddits with name, url, reason, and postingGuidance.',
      '- Use r/name format and remind users to check current rules/flairs before self-promotion.',
    )
  }

  if (includeGrowthAssets && selectedGrowthBlocks.length > 0) {
    lines.push(
      '',
      'Growth asset rules:',
      '- Personalization templates must be ready to merge with lead data and use clear placeholders.',
      '- Outreach variants must be concise, respectful, and specific to the target outreach channel.',
      '- Never invent personal details about a prospect or imply prior interaction that is not provided.',
    )
  }

  lines.push('', 'Return valid JSON matching the schema. No markdown wrapper.')

  return lines.join('\n')
}

function buildRequestedContractLines(
  selectedBlocks: PlatformBlockId[],
  selectedChannelPackIds: ChannelPackId[],
  channelCardTarget: ChannelCardTarget | null,
  selectedGrowthBlocks: GrowthBlockId[],
  includeMediaKit: boolean,
  includeGrowthAssets: boolean,
): string[] {
  const lines: string[] = []

  for (const blockId of selectedBlocks) {
    const profile = PLATFORM_PROMPT_PROFILES[blockId]
    lines.push(`- ${PLATFORM_LABELS[blockId]} platform block: ${profile.contract}`)
  }

  for (const channelId of selectedChannelPackIds) {
    const profile = CHANNEL_PACK_PROMPT_PROFILES[channelId]
    const cards = getRequestedChannelBlueprints(channelId, channelCardTarget)
      .map((blueprint) => blueprint.format)
      .join(', ')
    lines.push(`- ${CHANNEL_PACK_LABELS[channelId]} channel pack: ${profile.contract} Requested card formats: ${cards}.`)
  }

  if (includeMediaKit) {
    lines.push(`- Media kit: ${MEDIA_KIT_PROMPT_PROFILE.contract}`)
  }

  if (includeGrowthAssets) {
    for (const blockId of selectedGrowthBlocks) {
      const profile = GROWTH_PROMPT_PROFILES[blockId]
      lines.push(`- ${GROWTH_BLOCK_LABELS[blockId]}: ${profile.contract}`)
    }
  }

  return lines.length > 0 ? lines : ['- No content outputs requested; return the schema-compatible empty result.']
}

function buildGenerationTask(
  brief: ExtractedBrief,
  selectedBlocks: PlatformBlockId[],
  selectedChannelPackIds: ChannelPackId[],
  channelCardTarget: ChannelCardTarget | null,
  selectedGrowthBlocks: GrowthBlockId[],
  includeMediaKit: boolean,
  includeGrowthAssets: boolean,
): string {
  const names = buildRequestedOutputNames(
    selectedBlocks,
    selectedChannelPackIds,
    channelCardTarget,
    selectedGrowthBlocks,
    includeMediaKit,
    includeGrowthAssets,
  )
  const product = brief.productName || 'the product'

  if (names.length === 1) {
    return `Generate only ${names[0]} for ${product}.`
  }

  return `Generate the requested launch outputs for ${product}: ${names.join('; ')}.`
}

function buildGenerationFocus(
  selectedBlocks: PlatformBlockId[],
  selectedChannelPackIds: ChannelPackId[],
  channelCardTarget: ChannelCardTarget | null,
  selectedGrowthBlocks: GrowthBlockId[],
  includeMediaKit: boolean,
  includeGrowthAssets: boolean,
): string {
  const names = buildRequestedOutputNames(
    selectedBlocks,
    selectedChannelPackIds,
    channelCardTarget,
    selectedGrowthBlocks,
    includeMediaKit,
    includeGrowthAssets,
  )

  if (names.length === 1) {
    return `This is a single-output generation for ${names[0]}. Keep the content focused on that target format and do not include unrelated channel language.`
  }

  return 'Generate each requested output independently. Inside each body, follow only that output target and avoid cross-channel wording unless it is part of the product value proposition in the brief.'
}

function buildRequestedOutputNames(
  selectedBlocks: PlatformBlockId[],
  selectedChannelPackIds: ChannelPackId[],
  channelCardTarget: ChannelCardTarget | null,
  selectedGrowthBlocks: GrowthBlockId[],
  includeMediaKit: boolean,
  includeGrowthAssets: boolean,
): string[] {
  const names = [
    ...selectedBlocks.map((blockId) => `${PLATFORM_LABELS[blockId]} platform block`),
    ...selectedChannelPackIds.map((channelId) => {
      if (channelCardTarget?.channelId === channelId) {
        const blueprint = getRequestedChannelBlueprints(channelId, channelCardTarget)[0]
        return `${CHANNEL_PACK_LABELS[channelId]} ${blueprint?.format || 'channel'} card`
      }

      return `${CHANNEL_PACK_LABELS[channelId]} channel pack`
    }),
  ]

  if (includeMediaKit) {
    names.push('media kit')
  }

  if (includeGrowthAssets) {
    names.push(...selectedGrowthBlocks.map((blockId) => GROWTH_BLOCK_LABELS[blockId]))
  }

  return names
}

function buildRequestedOutputBriefs(
  selectedBlocks: PlatformBlockId[],
  selectedChannelPackIds: ChannelPackId[],
  channelCardTarget: ChannelCardTarget | null,
  selectedGrowthBlocks: GrowthBlockId[],
  includeMediaKit: boolean,
  includeGrowthAssets: boolean,
) {
  return {
    platformBlocks: selectedBlocks.map((blockId) => ({
      id: blockId,
      label: PLATFORM_LABELS[blockId],
      ...PLATFORM_PROMPT_PROFILES[blockId],
    })),
    channelPacks: selectedChannelPackIds.map((channelId) => ({
      id: channelId,
      label: CHANNEL_PACK_LABELS[channelId],
      ...CHANNEL_PACK_PROMPT_PROFILES[channelId],
      cards: getRequestedChannelBlueprints(channelId, channelCardTarget).map((blueprint) =>
        buildChannelCardPromptBrief(channelId, blueprint),
      ),
    })),
    mediaKit: includeMediaKit ? MEDIA_KIT_PROMPT_PROFILE : null,
    growthAssets: includeGrowthAssets
      ? selectedGrowthBlocks.map((blockId) => ({
          id: blockId,
          label: GROWTH_BLOCK_LABELS[blockId],
          ...GROWTH_PROMPT_PROFILES[blockId],
        }))
      : [],
  }
}

function buildChannelCardPromptBrief(channelId: ChannelPackId, blueprint: ChannelCardBlueprint) {
  const profile = CHANNEL_PACK_PROMPT_PROFILES[channelId]

  return {
    id: blueprint.id,
    stage: blueprint.stage,
    format: blueprint.format,
    objective: `Create a ${CHANNEL_PACK_LABELS[channelId]} ${blueprint.format.toLowerCase()} for the ${formatStageName(blueprint.stage)} stage.`,
    audience: profile.audience,
    tone: profile.tone,
    qualityExpectations: profile.qualityExpectations,
    ...(channelId === 'x' ? { contentAngle: getXChannelCardPromptAngle(blueprint.id) } : {}),
  }
}

function getXChannelCardPromptAngle(cardId: string): string {
  const angles: Record<string, string> = {
    'x-build-in-public':
      'A candid note about what was harder than expected while building, validating, or explaining it.',
    'x-launch-post':
      'A launch-day story that begins with the repeated problem or distribution lesson, then mentions the product.',
    'x-lesson-post':
      'A what-I-learned post about launching, positioning, distribution, or user feedback.',
    'x-short-thread':
      'A short thread where each numbered post advances one build or launch lesson; no title tweet.',
    'x-reply-prompts':
      'Questions that invite founders or operators to reply with launch or distribution pain, not engagement bait.',
  }

  return angles[cardId] || 'A specific founder story or launch lesson that can stand alone on X.'
}

function getRequestedChannelBlueprints(
  channelId: ChannelPackId,
  channelCardTarget: ChannelCardTarget | null,
): ChannelCardBlueprint[] {
  const blueprints = CHANNEL_CARD_BLUEPRINTS[channelId]

  if (channelCardTarget?.channelId !== channelId) {
    const freeBlueprints = blueprints.filter((blueprint) =>
      isFreeChannelCard(channelId, blueprint.id),
    )
    return freeBlueprints.length > 0 ? freeBlueprints : blueprints
  }

  const requested = blueprints.filter((blueprint) => blueprint.id === channelCardTarget.cardId)
  return requested.length > 0 ? requested : blueprints.slice(0, 1)
}

function formatStageName(stage: ChannelCardStage): string {
  const labels: Record<ChannelCardStage, string> = {
    pre_launch: 'pre-launch',
    launch_day: 'launch-day',
    follow_up: 'follow-up',
    evergreen: 'evergreen',
  }

  return labels[stage]
}

function buildOutputContract(
  selectedBlocks: PlatformBlockId[],
  selectedChannelPackIds: ChannelPackId[],
  selectedGrowthBlocks: GrowthBlockId[],
  includeMediaKit: boolean,
  includeGrowthAssets: boolean,
) {
  const contract: Record<string, string> = {}

  if (selectedBlocks.length > 0) {
    contract.platformBlocks = `Object keyed only by these platform ids: ${selectedBlocks.join(', ')}. Each value has title, body, cta, notes, and redditRecommendations only for reddit.`
  }

  if (selectedChannelPackIds.length > 0) {
    contract.channelPacks = `Object keyed only by these channel pack ids: ${selectedChannelPackIds.join(', ')}. Each value has notes, cards, and redditRecommendations only for reddit.`
    contract.channelCards =
      'Each requested card has id, title, body, cta, proofPoint, stage, format, socialContractNote, and qualityChecks.'
  }

  if (includeMediaKit) {
    contract.mediaKit =
      'Include founderCompanyBio, productOneLiner, boilerplate, pressRelease, keyVisualsChecklist, screenshotsAndLogos, and contactDetails.'
  }

  if (includeGrowthAssets && selectedGrowthBlocks.length > 0) {
    contract.growthAssets = selectedGrowthBlocks
      .map((blockId) => `${blockId} -> growthAssets.${growthOutputKey(blockId)}`)
      .join('; ')
  }

  return contract
}

function growthOutputKey(blockId: GrowthBlockId): string {
  const keys: Record<GrowthBlockId, string> = {
    linkedin_outreach: 'linkedinOutreach',
    x_outreach: 'xOutreach',
    cold_email_outreach: 'emailOutreach',
    seo_posts: 'seoPostPacks',
  }

  return keys[blockId]
}

function buildLaunchKitPrompt(
  brief: ExtractedBrief,
  selectedBlocks: PlatformBlockId[],
  selectedChannelPackIds: ChannelPackId[],
  channelCardTarget: ChannelCardTarget | null,
  selectedGrowthBlocks: GrowthBlockId[],
  includeMediaKit: boolean,
  includeGrowthAssets: boolean,
): string {
  return JSON.stringify(
    {
      task: buildGenerationTask(
        brief,
        selectedBlocks,
        selectedChannelPackIds,
        channelCardTarget,
        selectedGrowthBlocks,
        includeMediaKit,
        includeGrowthAssets,
      ),
      qualityGoal:
        'Human, source-specific, channel-native content that respects the target format, audience, objective, and brand voice guide.',
      focus: buildGenerationFocus(
        selectedBlocks,
        selectedChannelPackIds,
        channelCardTarget,
        selectedGrowthBlocks,
        includeMediaKit,
        includeGrowthAssets,
      ),
      requestedOutputs: buildRequestedOutputBriefs(
        selectedBlocks,
        selectedChannelPackIds,
        channelCardTarget,
        selectedGrowthBlocks,
        includeMediaKit,
        includeGrowthAssets,
      ),
      channelCardTarget,
      requiredChannelCards: buildRequiredChannelCards(selectedChannelPackIds, channelCardTarget),
      brief,
      outputContract: buildOutputContract(
        selectedBlocks,
        selectedChannelPackIds,
        selectedGrowthBlocks,
        includeMediaKit,
        includeGrowthAssets,
      ),
    },
    null,
    2,
  )
}

async function generateWithReplicate(
  brief: ExtractedBrief,
  selectedBlocks: PlatformBlockId[],
  selectedChannelPackIds: ChannelPackId[],
  channelCardTarget: ChannelCardTarget | null,
  selectedGrowthBlocks: GrowthBlockId[],
  includeMediaKit: boolean,
  includeGrowthAssets: boolean,
): Promise<ModelOutput> {
  const output = await runReplicateStructured<ModelOutput>({
    instructions: buildLaunchKitInstructions(
      selectedBlocks,
      selectedChannelPackIds,
      channelCardTarget,
      selectedGrowthBlocks,
      includeMediaKit,
      includeGrowthAssets,
    ),
    prompt: buildLaunchKitPrompt(
      brief,
      selectedBlocks,
      selectedChannelPackIds,
      channelCardTarget,
      selectedGrowthBlocks,
      includeMediaKit,
      includeGrowthAssets,
    ),
    jsonSchema: buildLaunchKitModelSchema(
      selectedBlocks,
      selectedChannelPackIds,
      selectedGrowthBlocks,
      includeMediaKit,
      includeGrowthAssets,
    ),
    schemaName: 'launch_kit_output',
    modelVariant: process.env.REPLICATE_OPENAI_MODEL || 'gpt-5',
    maxOutputTokens: 16000,
    pollTimeoutMs: 480000,
    reasoningEffort: 'medium',
    verbosity: 'high',
  })

  if (!output) {
    throw new Error('Replicate generation failed')
  }

  return output
}

async function generateWithOpenAi(
  brief: ExtractedBrief,
  selectedBlocks: PlatformBlockId[],
  selectedChannelPackIds: ChannelPackId[],
  channelCardTarget: ChannelCardTarget | null,
  selectedGrowthBlocks: GrowthBlockId[],
  includeMediaKit: boolean,
  includeGrowthAssets: boolean,
): Promise<ModelOutput> {
  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini'
  const payload = {
    model,
    temperature: 0.8,
    max_output_tokens: 10000,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: buildLaunchKitInstructions(
              selectedBlocks,
              selectedChannelPackIds,
              channelCardTarget,
              selectedGrowthBlocks,
              includeMediaKit,
              includeGrowthAssets,
            ),
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: buildLaunchKitPrompt(
              brief,
              selectedBlocks,
              selectedChannelPackIds,
              channelCardTarget,
              selectedGrowthBlocks,
              includeMediaKit,
              includeGrowthAssets,
            ),
          },
        ],
      },
    ],
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(45000),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI generation failed: ${response.status} ${error}`)
  }

  const raw = (await response.json()) as { output_text?: string }
  const outputText = raw.output_text || ''
  const parsed = parseModelJson(outputText)

  return parsed
}

function parseModelJson(input: string): ModelOutput {
  const direct = safeJsonParse<ModelOutput | null>(input, null)
  if (direct) {
    return direct
  }

  const start = input.indexOf('{')
  const end = input.lastIndexOf('}')
  if (start >= 0 && end > start) {
    const fragment = input.slice(start, end + 1)
    const fallback = safeJsonParse<ModelOutput | null>(fragment, null)
    if (fallback) {
      return fallback
    }
  }

  throw new Error('Could not parse model JSON output')
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

type ChannelCardBlueprint = {
  id: string
  stage: ChannelCardStage
  format: string
}

const CHANNEL_CARD_BLUEPRINTS: Record<ChannelPackId, ChannelCardBlueprint[]> = {
  x: [
    { id: 'x-build-in-public', stage: 'pre_launch', format: 'Build-in-public update' },
    { id: 'x-launch-post', stage: 'launch_day', format: 'Launch post' },
    { id: 'x-lesson-post', stage: 'evergreen', format: 'Lesson post' },
    { id: 'x-short-thread', stage: 'launch_day', format: 'Short thread' },
    { id: 'x-reply-prompts', stage: 'follow_up', format: 'Reply prompts' },
  ],
  linkedin: [
    { id: 'linkedin-founder-launch', stage: 'launch_day', format: 'Founder launch post' },
    { id: 'linkedin-lesson', stage: 'evergreen', format: 'Lesson post' },
    { id: 'linkedin-proof', stage: 'follow_up', format: 'Proof post' },
    { id: 'linkedin-follow-up', stage: 'follow_up', format: 'Follow-up post' },
  ],
  threads: [
    { id: 'threads-launch-story', stage: 'launch_day', format: 'Casual launch story' },
    { id: 'threads-build-note', stage: 'pre_launch', format: 'Build note' },
    { id: 'threads-question', stage: 'follow_up', format: 'Reply-driving question' },
    { id: 'threads-follow-up', stage: 'follow_up', format: 'Follow-up post' },
  ],
  reddit: [
    { id: 'reddit-cautious-discussion', stage: 'pre_launch', format: 'Cautious discussion post' },
    { id: 'reddit-self-promo-launch', stage: 'launch_day', format: 'Self-promo launch post' },
  ],
  indie_hackers: [
    { id: 'indie-hackers-founder-launch', stage: 'launch_day', format: 'Founder launch story' },
    { id: 'indie-hackers-lesson', stage: 'evergreen', format: 'Build lesson' },
    { id: 'indie-hackers-proof', stage: 'follow_up', format: 'Proof and learnings' },
    { id: 'indie-hackers-next-experiment', stage: 'follow_up', format: 'Next experiment' },
  ],
  instagram: [
    { id: 'instagram-carousel-brief', stage: 'launch_day', format: 'Carousel creative brief' },
    { id: 'instagram-caption', stage: 'launch_day', format: 'Launch caption' },
    { id: 'instagram-story-sequence', stage: 'follow_up', format: 'Story sequence' },
    { id: 'instagram-reel-brief', stage: 'evergreen', format: 'Reel creative brief' },
  ],
  tiktok: [
    { id: 'tiktok-founder-script', stage: 'launch_day', format: 'Founder video script' },
    { id: 'tiktok-problem-script', stage: 'evergreen', format: 'Problem to fix script' },
    { id: 'tiktok-comment-prompt', stage: 'follow_up', format: 'Comment prompt' },
  ],
  youtube_shorts: [
    { id: 'youtube-shorts-founder-script', stage: 'launch_day', format: 'Founder Shorts script' },
    { id: 'youtube-shorts-demo-script', stage: 'evergreen', format: 'Product demo script' },
    { id: 'youtube-shorts-follow-up', stage: 'follow_up', format: 'Follow-up Shorts script' },
  ],
}

function buildRequiredChannelCards(
  selectedChannelPackIds: ChannelPackId[],
  channelCardTarget: ChannelCardTarget | null,
): Partial<Record<ChannelPackId, ChannelCardBlueprint[]>> {
  const result: Partial<Record<ChannelPackId, ChannelCardBlueprint[]>> = {}

  for (const channelId of selectedChannelPackIds) {
    result[channelId] = getRequestedChannelBlueprints(channelId, channelCardTarget)
  }

  return result
}

function mergeChannelPacks(
  baseChannelPacks: Record<ChannelPackId, ChannelPack>,
  rawChannelPacks: ModelOutput['channelPacks'] | undefined,
  selectedChannelPackIds: ChannelPackId[],
  brief: ExtractedBrief,
  channelCardTarget: ChannelCardTarget | null,
): Record<ChannelPackId, ChannelPack> {
  const next = { ...baseChannelPacks }

  for (const channelId of selectedChannelPackIds) {
    const rawPack = rawChannelPacks?.[channelId]
    const normalizedPack = normalizeChannelPack(channelId, rawPack, brief)

    if (channelCardTarget?.channelId === channelId) {
      const rawCard = rawPack?.cards?.[0]
      const existingPack = next[channelId] || fallbackChannelPack(channelId, brief)
      const existingCard = existingPack.cards.find((card) => card.id === channelCardTarget.cardId)
      const targetBlueprint =
        CHANNEL_CARD_BLUEPRINTS[channelId].find((blueprint) => blueprint.id === channelCardTarget.cardId) ||
        CHANNEL_CARD_BLUEPRINTS[channelId][0]
      const normalizedCard = normalizeChannelCard(
        channelId,
        rawCard,
        existingCard ||
          normalizedPack.cards.find((card) => card.id === channelCardTarget.cardId) ||
          fallbackChannelCard(channelId, targetBlueprint, brief),
      )
      const regeneratedCard = {
        ...normalizedCard,
        id: channelCardTarget.cardId,
      }
      const hasExistingCard = existingPack.cards.some((card) => card.id === channelCardTarget.cardId)

      next[channelId] = {
        ...existingPack,
        notes: rawPack?.notes?.trim() || existingPack.notes || normalizedPack.notes,
        cards: hasExistingCard
          ? existingPack.cards.map((card) =>
              card.id === channelCardTarget.cardId ? regeneratedCard : card,
            )
          : [...existingPack.cards, regeneratedCard],
        ...(channelId === 'reddit'
          ? {
              redditRecommendations: normalizeRedditRecommendations(
                rawPack?.redditRecommendations,
                existingPack.redditRecommendations,
              ),
            }
          : {}),
      }
      continue
    }

    next[channelId] = normalizedPack
  }

  return next
}

function normalizeChannelPack(
  channelId: ChannelPackId,
  raw: RawChannelPack | undefined,
  brief: ExtractedBrief,
): ChannelPack {
  const fallback = fallbackChannelPack(channelId, brief)
  const cards = Array.isArray(raw?.cards)
    ? raw.cards
        .map((card, index) =>
          normalizeChannelCard(channelId, card, fallback.cards[index] || fallback.cards[0]),
        )
        .filter((card) => card.title || card.body || card.cta)
    : []

  return {
    id: channelId,
    label: CHANNEL_PACK_LABELS[channelId],
    notes: raw?.notes?.trim() || fallback.notes,
    cards: cards.length > 0 ? cards : fallback.cards,
    ...(channelId === 'reddit'
      ? {
          redditRecommendations: normalizeRedditRecommendations(
            raw?.redditRecommendations,
            fallback.redditRecommendations,
          ),
        }
      : {}),
  }
}

function normalizeChannelCard(
  channelId: ChannelPackId,
  raw: RawChannelCard | undefined,
  fallback: ChannelCard,
): ChannelCard {
  const stage = isChannelCardStage(raw?.stage) ? raw.stage : fallback.stage

  return {
    id: raw?.id?.trim() || fallback.id,
    title: raw?.title?.trim() || fallback.title,
    body: raw?.body?.trim() || fallback.body,
    cta: raw?.cta?.trim() || fallback.cta,
    proofPoint: raw?.proofPoint?.trim() || fallback.proofPoint,
    stage,
    format: raw?.format?.trim() || fallback.format,
    socialContractNote: raw?.socialContractNote?.trim() || fallback.socialContractNote,
    qualityChecks: Array.isArray(raw?.qualityChecks) && raw.qualityChecks.length > 0
      ? raw.qualityChecks.map((item) => item.trim()).filter(Boolean).slice(0, 6)
      : fallback.qualityChecks,
  }
}

function fallbackChannelPack(
  channelId: ChannelPackId,
  brief: ExtractedBrief,
  channelCardTarget: ChannelCardTarget | null = null,
): ChannelPack {
  const blueprints = getRequestedChannelBlueprints(channelId, channelCardTarget)
  const selectedBlueprints = blueprints.length > 0 ? blueprints : CHANNEL_CARD_BLUEPRINTS[channelId]

  return {
    id: channelId,
    label: CHANNEL_PACK_LABELS[channelId],
    notes: fallbackChannelPackNotes(channelId),
    cards: selectedBlueprints.map((blueprint) => fallbackChannelCard(channelId, blueprint, brief)),
    ...(channelId === 'reddit'
      ? { redditRecommendations: fallbackRedditRecommendations(brief) }
      : {}),
  }
}

function fallbackChannelCard(
  channelId: ChannelPackId,
  blueprint: ChannelCardBlueprint,
  brief: ExtractedBrief,
): ChannelCard {
  const product = brief.productName || 'the product'
  const audience = brief.targetUsers[0] || brief.icp || 'the people this is built for'
  const pain = brief.painPoints[0] || 'the workflow problem this product solves'
  const value = brief.valueProps[0] || brief.positioning || 'a clearer path to the promised outcome'
  const proof = fallbackProofPoint(brief)
  const cta = brief.cta || 'Learn more'

  return {
    id: blueprint.id,
    title: fallbackChannelCardTitle(channelId, blueprint, product),
    body: fallbackChannelCardBody(channelId, blueprint, { product, audience, pain, value, proof, cta }),
    cta,
    proofPoint: proof,
    stage: blueprint.stage,
    format: blueprint.format,
    socialContractNote: fallbackSocialContractNote(channelId, blueprint),
    qualityChecks: fallbackQualityChecks(channelId),
  }
}

function fallbackProofPoint(brief: ExtractedBrief): string {
  const proof = brief.proofPoints.find((item) => item.trim())

  return (
    proof ||
    'Proof to add before publishing: add a source-backed metric, testimonial, customer example, rating, case study, or compliance signal.'
  )
}

function fallbackChannelCardTitle(
  channelId: ChannelPackId,
  blueprint: ChannelCardBlueprint,
  product: string,
): string {
  if (channelId === 'reddit' && blueprint.id === 'reddit-cautious-discussion') {
    return `Question about ${product} and the problem it solves`
  }

  if (channelId === 'reddit' && blueprint.id === 'reddit-self-promo-launch') {
    return `I built ${product} and would value feedback`
  }

  return `${CHANNEL_PACK_LABELS[channelId]} - ${blueprint.format}`
}

function fallbackChannelCardBody(
  channelId: ChannelPackId,
  blueprint: ChannelCardBlueprint,
  values: {
    product: string
    audience: string
    pain: string
    value: string
    proof: string
    cta: string
  },
): string {
  const { product, audience, pain, value, proof, cta } = values

  if (channelId === 'x') {
    if (blueprint.id === 'x-build-in-public') {
      return `I thought the hard part would be building ${product}.\n\nIt was actually explaining ${pain} in a way ${audience} would care about.\n\nCurrent version is focused on this: ${value}\n\nStill figuring out what proof would make people trust it enough to try.`
    }

    if (blueprint.id === 'x-launch-post') {
      return `I built ${product} because I kept seeing the same launch problem:\n\n${pain}\n\nThe first useful version does one thing: ${value}\n\nIf you have dealt with this, I would genuinely like to know what would make it worth trying.`
    }

    if (blueprint.id === 'x-lesson-post') {
      return `Launch lesson: a product can be useful and still sound boring if the distribution story is wrong.\n\nFor ${audience}, the pain is not "needing another tool."\n\nIt is this: ${pain}\n\nThat changed how I talk about ${product}: lead with the lived problem, then show ${value}.`
    }

    if (blueprint.id === 'x-short-thread') {
      return `1/ I used to think launching was mostly about writing a good announcement.\n\n2/ The harder part is translating one product story for different rooms without sounding fake.\n\n3/ That is why I built ${product}: ${pain}\n\n4/ The useful part so far is simple: ${value}\n\n5/ What I am still testing: what proof or demo would make ${audience} trust it enough to try?`
    }

    if (blueprint.id === 'x-reply-prompts') {
      return `Reply prompts:\n- What part of launching or distribution still feels weirdly manual for you?\n- When you see a new tool like ${product}, what makes you trust it enough to try?\n- Which launch channel is hardest to write for without sounding fake?`
    }

    return `I built ${product} after getting tired of this problem:\n\n${pain}\n\nFor ${audience}, the useful part is not another tool. It is finally getting ${value}.\n\nStill learning which part of that story makes people stop scrolling.`
  }

  if (channelId === 'reddit') {
    if (blueprint.id === 'reddit-self-promo-launch') {
      return `I built ${product} for ${audience}.\n\nThe problem: ${pain}.\n\nWhat it does: ${value}.\n\nProof/context: ${proof}\n\nI am the builder. If self-promotion is allowed here, I would appreciate specific feedback on whether this solves a real workflow problem.`
    }

    return `I am trying to understand how others handle this: ${pain}.\n\nFor context, I am working on ${product}, but I am more interested in the workflow than dropping a link.\n\nFor ${audience}, what would make a solution like this credible or not worth trying?`
  }

  if (channelId === 'instagram') {
    return `Creative brief:\nSlide/scene 1: Show the familiar pain: ${pain}.\nSlide/scene 2: Show the workflow change: ${value}.\nSlide/scene 3: Proof signal: ${proof}.\nCaption: Built ${product} for ${audience}. ${cta}`
  }

  if (channelId === 'tiktok' || channelId === 'youtube_shorts') {
    return `Hook: ${pain} should not be the thing that slows down ${audience}.\nBeat 1: Show the messy current workflow.\nBeat 2: Show ${product} and the clearer path: ${value}.\nBeat 3: Proof signal: ${proof}.\nClose: ${cta}`
  }

  if (channelId === 'threads') {
    return `I keep coming back to this problem: ${pain}.\n\n${product} is the current attempt to make it easier for ${audience}.\n\nWhat I am learning: ${value}.\n\nProof signal: ${proof}`
  }

  return `I built ${product} for ${audience} because ${pain}.\n\nThe useful outcome: ${value}.\n\nProof signal: ${proof}\n\n${cta}`
}

function fallbackChannelPackNotes(channelId: ChannelPackId): string {
  const notes: Record<ChannelPackId, string> = {
    x: 'Public timeline content for build-in-public, launch, lessons, threads, and reply prompts. Keep DMs in outbound outreach.',
    linkedin: 'Founder-led professional posts with clear stakes, useful lessons, and evidence-backed claims.',
    threads: 'Casual, reply-friendly posts that invite conversation without sounding like a launch blast.',
    reddit: 'Separate discussion-first and self-promo versions; check current subreddit rules and disclose your role.',
    indie_hackers: 'Build-in-public posts that share tradeoffs, decisions, lessons, proof, and the next experiment.',
    instagram: 'Visual-first creative briefs and captions; use product screenshots or founder-recorded clips before posting.',
    tiktok: 'Short founder/video scripts with hook, beats, proof slot, and comment prompt.',
    youtube_shorts: 'Concise Shorts scripts with a clear hook, product moment, proof slot, and close.',
  }

  return notes[channelId]
}

function fallbackSocialContractNote(
  channelId: ChannelPackId,
  blueprint: ChannelCardBlueprint,
): string {
  if (channelId === 'reddit') {
    return blueprint.id === 'reddit-self-promo-launch'
      ? 'Use only in communities that explicitly allow self-promotion; disclose that you built it.'
      : 'Lead with the discussion and context before mentioning the product.'
  }

  if (channelId === 'x') {
    return 'X works best when the post feels like a lived build, launch, or distribution lesson, not a polished announcement.'
  }

  if (channelId === 'linkedin') {
    return 'LinkedIn expects a professional but human lesson, outcome, or operator insight.'
  }

  if (channelId === 'instagram') {
    return 'Instagram needs the idea translated into visuals, overlays, and a caption that can stand alone.'
  }

  if (channelId === 'tiktok' || channelId === 'youtube_shorts') {
    return 'Short video needs a fast hook, visible workflow, and a close that does not overclaim.'
  }

  return 'Keep the founder voice specific, useful, and easy to respond to.'
}

function fallbackQualityChecks(channelId: ChannelPackId): string[] {
  const shared = [
    'Use only sourced proof or clearly mark proof to add.',
    'Keep the founder role transparent.',
    'Avoid fake metrics and generic launch hype.',
  ]

  if (channelId === 'reddit') {
    return [
      'Check current subreddit rules and flair.',
      'Disclose that you built the product.',
      'Avoid naked links unless the community allows them.',
      ...shared,
    ].slice(0, 6)
  }

  if (channelId === 'instagram' || channelId === 'tiktok' || channelId === 'youtube_shorts') {
    return [
      'Pair the copy with real product visuals or founder footage.',
      'Make the first beat understandable without sound.',
      ...shared,
    ].slice(0, 6)
  }

  return shared
}

function isChannelCardStage(value: unknown): value is ChannelCardStage {
  return (
    value === 'pre_launch' ||
    value === 'launch_day' ||
    value === 'follow_up' ||
    value === 'evergreen'
  )
}

function normalizeBlock(
  blockId: PlatformBlockId,
  raw: RawPlatformBlock | undefined,
  brief: ExtractedBrief,
): PlatformBlock {
  return {
    id: blockId,
    label: PLATFORM_LABELS[blockId],
    title: raw?.title?.trim() || `${brief.productName} on ${PLATFORM_LABELS[blockId]}`,
    body: raw?.body?.trim() || fallbackBlockBody(blockId, brief),
    cta: raw?.cta?.trim() || brief.cta,
    notes: raw?.notes?.trim() || 'Generated from your product brief and adapted to this platform.',
    ...(blockId === 'reddit'
      ? {
          redditRecommendations: normalizeRedditRecommendations(
            raw?.redditRecommendations,
            fallbackRedditRecommendations(brief),
          ),
        }
      : {}),
  }
}

function normalizeMediaKit(raw: ModelOutput['mediaKit'], brief: ExtractedBrief): MediaKit {
  return {
    founderCompanyBio:
      raw?.founderCompanyBio?.trim() ||
      `${brief.productName} is built for ${brief.targetUsers[0] || 'teams'} and positioned around ${brief.positioning || 'a clearer product launch story'}.`,
    productOneLiner: raw?.productOneLiner?.trim() || brief.positioning,
    boilerplate:
      raw?.boilerplate?.trim() ||
      `${brief.productName} helps ${brief.targetUsers[0] || 'teams'} ${(
        brief.valueProps[0] ||
        brief.positioning ||
        'solve a specific workflow problem'
      ).toLowerCase()}.`,
    pressRelease:
      raw?.pressRelease?.trim() ||
      `Today, ${brief.productName} announced a focused way for ${brief.targetUsers.join(', ') || 'teams'} to ${(
        brief.valueProps[0] ||
        brief.positioning ||
        'move from problem to outcome faster'
      ).toLowerCase()}.`,
    keyVisualsChecklist:
      raw?.keyVisualsChecklist?.filter(Boolean).slice(0, 12) || [
        'Primary logo (light and dark variants)',
        'Product screenshots (home, key workflow, results)',
        'Founder headshot',
        'Social preview image',
      ],
    screenshotsAndLogos:
      raw?.screenshotsAndLogos?.trim() ||
      'Provide landscape and portrait screenshots plus SVG/PNG logos for platform submissions and media coverage.',
    contactDetails:
      raw?.contactDetails?.trim() ||
      `Website: ${brief.sourceUrl}\nContact details: Not detected in the source website evidence.`,
  }
}

function normalizeGrowthAssets(
  raw: ModelOutput['growthAssets'] | undefined,
  selectedGrowthBlocks: GrowthBlockId[],
  brief: ExtractedBrief,
  baseGrowth: GrowthAssets,
): GrowthAssets {
  const next = {
    ...baseGrowth,
    generatedAt: new Date().toISOString(),
  }

  if (selectedGrowthBlocks.includes('linkedin_outreach')) {
    next.linkedinOutreach = normalizeOutreachPack(raw?.linkedinOutreach, 'linkedin', brief)
  }

  if (selectedGrowthBlocks.includes('x_outreach')) {
    next.xOutreach = normalizeOutreachPack(raw?.xOutreach, 'x', brief)
  }

  if (selectedGrowthBlocks.includes('cold_email_outreach')) {
    next.emailOutreach = normalizeOutreachPack(raw?.emailOutreach, 'email', brief)
  }

  if (selectedGrowthBlocks.includes('seo_posts')) {
    next.seoPostPacks = normalizeSeoPostPacks(raw?.seoPostPacks, brief)
  }

  return next
}

function normalizeOutreachPack(
  raw:
    | {
        notes?: string
        personalizationTemplate?: string
        variants?: Array<{
          title?: string
          subject?: string
          message?: string
          cta?: string
        }>
      }
    | undefined,
  channel: 'linkedin' | 'x' | 'email',
  brief: ExtractedBrief,
): OutreachPack {
  const fallback = fallbackOutreachPack(channel, brief)
  const variants: OutreachVariant[] = []

  for (const [index, rawVariant] of (raw?.variants || []).entries()) {
    const message = rawVariant.message?.trim() || ''
    if (!message) {
      continue
    }

    variants.push({
      id: `${channel}-variant-${index + 1}`,
      title: rawVariant.title?.trim() || `Variant ${index + 1}`,
      subject: channel === 'email' ? (rawVariant.subject?.trim() || `Idea for ${brief.productName}`) : undefined,
      message,
      cta: rawVariant.cta?.trim() || brief.cta,
    })
  }

  const seeded = variants.length > 0 ? variants.slice(0, 3) : fallback.variants

  return {
    channel,
    notes: raw?.notes?.trim() || fallback.notes,
    personalizationTemplate:
      raw?.personalizationTemplate?.trim() || fallback.personalizationTemplate,
    variants: seeded,
  }
}

function normalizeSeoPostPacks(
  raw: ModelOutput['growthAssets'] extends infer T
    ? T extends { seoPostPacks?: infer U }
      ? U | undefined
      : never
    : never,
  brief: ExtractedBrief,
): SeoPostPack[] {
  const keywordClusters = brief.keywordResearch.clusters.slice(0, 5)
  const fallback = fallbackSeoPostPacks(brief)

  if (!Array.isArray(raw) || raw.length === 0) {
    return fallback
  }

  const packs: SeoPostPack[] = []
  for (const [index, rawPack] of raw.entries()) {
    const topic = rawPack?.keywordTopic?.trim() || keywordClusters[index % Math.max(1, keywordClusters.length)]?.topic || brief.productName
    const clusterId = rawPack?.keywordClusterId?.trim() || keywordClusters[index % Math.max(1, keywordClusters.length)]?.id || `cluster-${index + 1}`
    const title = rawPack?.title?.trim() || `How ${brief.productName} helps with ${topic}`
    const metaDescription =
      rawPack?.metaDescription?.trim() ||
      `${brief.productName}: practical guidance and examples for ${topic.toLowerCase()}.`
    const outline = Array.isArray(rawPack?.outline)
      ? rawPack.outline
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter(Boolean)
          .slice(0, 8)
      : []

    packs.push({
      id: `seo-pack-${index + 1}`,
      keywordClusterId: clusterId,
      keywordTopic: topic,
      title,
      metaDescription,
      outline: outline.length > 0 ? outline : ['Introduction', 'Core workflow', 'Execution steps', 'Conclusion'],
      draft: rawPack?.draft?.trim() || `This post explains how ${brief.productName} addresses ${topic.toLowerCase()}.`,
      cta: rawPack?.cta?.trim() || brief.cta,
    })
  }

  return packs.slice(0, 6)
}

function fallbackLaunchKit(
  brief: ExtractedBrief,
  selectedBlocks: PlatformBlockId[],
  selectedChannelPackIds: ChannelPackId[],
  channelCardTarget: ChannelCardTarget | null,
  selectedGrowthBlocks: GrowthBlockId[],
  includeMediaKit: boolean,
  includeGrowthAssets: boolean,
  baseKit: LaunchKit,
): LaunchKit {
  const blocks = { ...baseKit.platformBlocks }
  for (const blockId of selectedBlocks) {
    blocks[blockId] = {
      id: blockId,
      label: PLATFORM_LABELS[blockId],
      title: `${brief.productName} for ${PLATFORM_LABELS[blockId]}`,
      body: fallbackBlockBody(blockId, brief),
      cta: brief.cta,
      notes: 'Template output (set REPLICATE_API_TOKEN or OPENAI_API_KEY for AI-enhanced results).',
      ...(blockId === 'reddit'
        ? { redditRecommendations: normalizeRedditRecommendations(undefined, fallbackRedditRecommendations(brief)) }
      : {}),
    }
  }

  const channelPacks = mergeChannelPacks(
    baseKit.channelPacks || createEmptyChannelPacks(),
    Object.fromEntries(
      selectedChannelPackIds.map((channelId) => [
        channelId,
        fallbackChannelPack(channelId, brief, channelCardTarget),
      ]),
    ),
    selectedChannelPackIds,
    brief,
    channelCardTarget,
  )

  const growth = { ...baseKit.growthAssets }
  if (includeGrowthAssets) {
    growth.generatedAt = new Date().toISOString()
    if (selectedGrowthBlocks.includes('linkedin_outreach')) {
      growth.linkedinOutreach = fallbackOutreachPack('linkedin', brief)
    }

    if (selectedGrowthBlocks.includes('x_outreach')) {
      growth.xOutreach = fallbackOutreachPack('x', brief)
    }

    if (selectedGrowthBlocks.includes('cold_email_outreach')) {
      growth.emailOutreach = fallbackOutreachPack('email', brief)
    }

    if (selectedGrowthBlocks.includes('seo_posts')) {
      growth.seoPostPacks = fallbackSeoPostPacks(brief)
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    language: brief.language,
    platformBlocks: blocks,
    channelPacks,
    mediaKit: includeMediaKit
      ? normalizeMediaKit(undefined, brief)
      : baseKit.mediaKit,
    assetLibrary: baseKit.assetLibrary || createEmptyAssetLibrary(),
    growthAssets: growth,
    prospecting: baseKit.prospecting || createEmptyProspectingState(),
    seoGrowth: baseKit.seoGrowth || createEmptySeoGrowthState(),
  }
}

function fallbackOutreachPack(
  channel: 'linkedin' | 'x' | 'email',
  brief: ExtractedBrief,
): OutreachPack {
  const topPain = brief.painPoints[0] || 'finding the right moment to reach high-fit prospects'
  const topValue = brief.valueProps[0] || brief.positioning
  const proof = brief.proofPoints[0] || ''
  const proofLine = proof
    ? `The source proof I would lean on is: ${proof}.`
    : 'I would keep this proof-light until there is a metric, testimonial, customer example, or other sourced signal to reference.'

  if (channel === 'linkedin') {
    return {
      channel,
      notes: 'Professional, concise, and respectful outreach. Use sourced proof only.',
      personalizationTemplate:
        'Hi {{firstName}} - saw {{company}} is active in {{category}} and thought this might be relevant to your current workflow.',
      variants: [
        {
          id: 'linkedin-v1',
          title: 'Pain-led opener',
          message: `Hi {{firstName}}, saw {{company}} is working in {{category}}. If ${topPain} is showing up, ${brief.productName} may be useful because it focuses the workflow around ${topValue}.`,
          cta: 'Want a sample for your current workflow?',
        },
        {
          id: 'linkedin-v2',
          title: 'Value-led opener',
          message: `Hi {{firstName}}, ${brief.productName} is built around ${topValue}. The useful part is connecting the problem, outcome, and next step in one focused workflow.`,
          cta: 'Open to a 10-minute walkthrough?',
        },
        {
          id: 'linkedin-v3',
          title: 'Credibility-led opener',
          message: `Hi {{firstName}}, I thought ${brief.productName} might be relevant for {{company}}'s current workflow. ${proofLine}`,
          cta: brief.cta,
        },
      ],
    }
  }

  if (channel === 'x') {
    return {
      channel,
      notes: 'Short conversational DM style.',
      personalizationTemplate:
        'Hey {{firstName}} - noticed {{company}} is active in {{category}}. Thought this might help with the workflow.',
      variants: [
        {
          id: 'x-v1',
          title: 'Quick intro',
          message: `Hey {{firstName}} - noticed {{company}} is active around {{category}}. If ${topPain} is on your plate, ${brief.productName} might be useful.`,
          cta: 'Want a sample output?',
        },
        {
          id: 'x-v2',
          title: 'Outcome angle',
          message: `${brief.productName} is built around ${topValue} without adding another manual step.`,
          cta: 'Can I run it on your site?',
        },
        {
          id: 'x-v3',
          title: 'Build-in-public angle',
          message: `Built this for teams tired of turning the same problem into a clear next step by hand. Happy to run a sample on {{company}} if useful.`,
          cta: brief.cta,
        },
      ],
    }
  }

  return {
    channel,
    notes: 'Short personalized cold-email structure.',
    personalizationTemplate:
      'Subject: Quick idea for {{company}}\n\nHi {{firstName}},\n\nSaw what you are building at {{company}}.',
    variants: [
      {
        id: 'email-v1',
        title: 'Direct intro',
        subject: `Quick idea for ${brief.productName}`,
        message: `Hi {{firstName}},\n\nI saw {{company}} is active in {{category}} and thought this might be relevant. ${brief.productName} is built for teams dealing with ${topPain}; it keeps the relevant pain, outcome, and next step in one focused workflow.`,
        cta: 'Want me to generate a sample kit for your product page?',
      },
      {
        id: 'email-v2',
        title: 'Value-led',
        subject: 'Workflow idea',
        message: `Hi {{firstName}},\n\n${brief.productName} is built around ${topValue}. The angle is simple: start from the prospect's real problem, show the relevant outcome, and make the next step easy to evaluate.`,
        cta: 'Open to a short walkthrough?',
      },
      {
        id: 'email-v3',
        title: 'Credibility-led',
        subject: 'Relevant workflow idea',
        message: `Hi {{firstName}},\n\nI thought ${brief.productName} might be relevant to {{company}} if ${topPain} is on the roadmap. ${proofLine}`,
        cta: brief.cta,
      },
    ],
  }
}

function fallbackSeoPostPacks(brief: ExtractedBrief): SeoPostPack[] {
  const clusters = brief.keywordResearch.clusters.length > 0
    ? brief.keywordResearch.clusters.slice(0, 3)
    : [
        {
          id: 'cluster-general',
          topic: `${brief.productName} use cases`,
          intent: 'informational' as const,
          priority: 'high' as const,
          keywords: [brief.productName.toLowerCase()],
          contentAngles: ['Launch process improvements'],
        },
      ]

  return clusters.map((cluster, index) => ({
    id: `seo-pack-${index + 1}`,
    keywordClusterId: cluster.id,
    keywordTopic: cluster.topic,
    title: `${cluster.topic}: A practical guide for ${brief.targetUsers[0] || 'builders'}`,
    metaDescription: `A practical guide on ${cluster.topic.toLowerCase()} with examples and launch execution tips.`,
    outline: [
      'Problem context and stakes',
      'Core workflow',
      'Examples and templates',
      'Execution checklist',
    ],
    draft: `${brief.productName} helps ${brief.targetUsers[0] || 'teams'} solve ${brief.painPoints[0] || 'launch messaging bottlenecks'} by turning one narrative into channel-specific assets.`,
    cta: brief.cta,
  }))
}

function fallbackRedditRecommendations(brief: ExtractedBrief): RedditRecommendations {
  const product = brief.productName || 'your product'
  const audience = brief.targetUsers[0] || brief.icp || 'early users'
  const category = brief.keywordResearch.clusters[0]?.topic || brief.positioning || 'the product category'

  return {
    engagementSubreddits: [
      {
        name: 'r/startups',
        url: 'https://www.reddit.com/r/startups/',
        reason: `Founder and startup operators can discuss the launch problem ${product} addresses.`,
        postingGuidance: 'Participate in feedback and strategy threads first; avoid dropping a launch link without context.',
      },
      {
        name: 'r/SaaS',
        url: 'https://www.reddit.com/r/SaaS/',
        reason: `Useful for SaaS positioning, pricing, onboarding, and growth discussions around ${category}.`,
        postingGuidance: 'Lead with lessons, metrics, or a specific question for other SaaS builders.',
      },
      {
        name: 'r/Entrepreneur',
        url: 'https://www.reddit.com/r/Entrepreneur/',
        reason: `Broad founder audience that can react to the business pain and customer angle for ${audience}.`,
        postingGuidance: 'Frame the post as a business lesson or decision point, not a product announcement.',
      },
      {
        name: 'r/smallbusiness',
        url: 'https://www.reddit.com/r/smallbusiness/',
        reason: `Relevant when ${product} helps operators, lean teams, or service businesses solve practical work.`,
        postingGuidance: 'Answer existing operator questions and mention the product only when it is directly relevant.',
      },
      {
        name: 'r/ProductManagement',
        url: 'https://www.reddit.com/r/ProductManagement/',
        reason: `Product-minded readers can engage with the workflow, prioritization, and customer discovery angle.`,
        postingGuidance: 'Use a problem-first discussion prompt and avoid promotional links unless rules allow them.',
      },
      {
        name: 'r/indiehackers',
        url: 'https://www.reddit.com/r/indiehackers/',
        reason: `Good fit for build-in-public context, founder tradeoffs, and early-user learning around ${product}.`,
        postingGuidance: 'Share what was learned while building and ask for specific feedback from other makers.',
      },
    ],
    selfPromotionSubreddits: [
      {
        name: 'r/SideProject',
        url: 'https://www.reddit.com/r/SideProject/',
        reason: 'Common destination for makers sharing new projects, launches, and early product experiments.',
        postingGuidance: 'Check current rules and flairs; disclose your role and ask for concrete feedback.',
      },
      {
        name: 'r/sideprojects',
        url: 'https://www.reddit.com/r/sideprojects/',
        reason: 'Focused on showcasing side projects and getting reactions from other builders.',
        postingGuidance: 'Post only when there is a meaningful update and avoid repeating the same pitch.',
      },
      {
        name: 'r/AlphaandBetaUsers',
        url: 'https://www.reddit.com/r/AlphaandBetaUsers/',
        reason: 'Built for finding early testers, beta users, and feedback on unfinished products.',
        postingGuidance: 'Be explicit about beta status, who should test, and what feedback you need.',
      },
      {
        name: 'r/MicroSaas',
        url: 'https://www.reddit.com/r/MicroSaas/',
        reason: 'Relevant for lean SaaS products, micro-SaaS launches, and solo-founder experiments.',
        postingGuidance: 'Lead with the niche, traction, or build story; confirm self-promotion rules before linking.',
      },
      {
        name: 'r/startup_resources',
        url: 'https://www.reddit.com/r/startup_resources/',
        reason: 'A candidate for useful startup resources when the product genuinely helps founders or startup teams.',
        postingGuidance: 'Position the post as a resource and check whether promotional posts require approval.',
      },
      {
        name: 'r/EntrepreneurRideAlong',
        url: 'https://www.reddit.com/r/EntrepreneurRideAlong/',
        reason: 'Works for transparent build stories, launch experiments, and progress updates.',
        postingGuidance: 'Share the journey, numbers, and next experiment instead of a bare launch link.',
      },
    ],
  }
}

function fallbackBlockBody(blockId: PlatformBlockId, brief: ExtractedBrief): string {
  const highlights = brief.keyClaims.slice(0, 3).map((line) => `- ${line}`).join('\n')
  const painPoints = brief.painPoints.slice(0, 2).map((line) => `- ${line}`).join('\n')
  const valueProps = brief.valueProps.slice(0, 2).map((line) => `- ${line}`).join('\n')
  const proofPoints = brief.proofPoints.slice(0, 2).map((line) => `- ${line}`).join('\n')
  const proofSection = proofPoints || '- Add a source-backed metric, testimonial, customer logo, or certification before publishing.'
  const proofCue = brief.proofPoints[0] || 'add a source-backed metric or testimonial before publishing'
  const audience = brief.targetUsers.join(', ') || 'builders'

  const templates: Record<PlatformBlockId, string> = {
    product_hunt: `${brief.productName} is live on Product Hunt.\n\n${brief.positioning}\n\nBuilt for: ${audience}\n\nValue props:\n${valueProps}\n\nProof:\n${proofSection}\n\nHighlights:\n${highlights}`,
    hacker_news: `Show HN: ${brief.productName}\n\nI built this for ${audience}. ${brief.positioning}\n\nPain points we targeted:\n${painPoints}\n\nWould value candid feedback on product, positioning, and launch execution.`,
    reddit: `Hey everyone, I built ${brief.productName}. ${brief.positioning}\n\nPain points this addresses:\n${painPoints}\n\nCurious if this resonates with how your team launches products.`,
    indie_hackers: `Launched ${brief.productName} today.\n\nWho it helps: ${audience}\nWhat worked: ${brief.valueProps[0] || brief.positioning}\nWhat was hard: ${brief.painPoints[0] || 'Finding a sharper path from problem to proof.'}\nProof signals:\n${proofSection}\nWhat I am testing next: distribution and onboarding loops.`,
    linkedin: `Today we launched ${brief.productName}.\n\n${brief.positioning}\n\nBuilt for ${audience}.\nWhy this matters:\n${valueProps}\nProof:\n${proofSection}`,
    tiktok: `Hook: ${brief.painPoints[0] || `This should be easier for ${audience}`}.\nStory beats: Problem -> ${brief.productName} -> Outcome (${brief.valueProps[0] || brief.positioning || 'a clearer next step'}).\nProof cue: ${proofCue}.\nCTA: ${brief.cta}`,
    youtube_shorts: `Hook: ${brief.valueProps[0] || brief.positioning || `${brief.productName} makes the next step clearer`}.\nStory beats: Pain (${brief.painPoints[0] || 'the old workflow friction'}) -> Product moment (${brief.productName}) -> Outcome (${brief.valueProps[0] || 'a more practical path forward'}).\nProof cue: ${proofCue}.\nCTA: ${brief.cta}`,
    email_announcement: `Subject: ${brief.productName} is live\n\nHi there,\n\n${brief.positioning}\n\nBuilt for: ${audience}\nPain points:\n${painPoints}\nValue props:\n${valueProps}\nProof:\n${proofSection}\n\n${brief.cta}`,
  }

  return templates[blockId]
}

export function parseSelectedBlockIds(input: unknown): PlatformBlockId[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input
    .map((value) => (typeof value === 'string' ? value : ''))
    .filter((value): value is PlatformBlockId => isPlatformBlockId(value))
}

export function parseSelectedGrowthBlockIds(input: unknown): GrowthBlockId[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input
    .map((value) => (typeof value === 'string' ? value : ''))
    .filter((value): value is GrowthBlockId => GROWTH_BLOCK_IDS.includes(value as GrowthBlockId))
}

export function parseSelectedChannelPackIds(input: unknown): ChannelPackId[] {
  if (!Array.isArray(input)) {
    return []
  }

  return input
    .map((value) => (typeof value === 'string' ? value : ''))
    .filter((value): value is ChannelPackId => CHANNEL_PACK_IDS.includes(value as ChannelPackId))
}

export function parseChannelCardTarget(input: unknown): ChannelCardTarget | null {
  if (!input || typeof input !== 'object') {
    return null
  }

  const target = input as Partial<ChannelCardTarget>
  const channelId = typeof target.channelId === 'string' ? target.channelId : ''
  const cardId = typeof target.cardId === 'string' ? target.cardId.trim() : ''

  if (!CHANNEL_PACK_IDS.includes(channelId as ChannelPackId) || !cardId) {
    return null
  }

  return {
    channelId: channelId as ChannelPackId,
    cardId,
  }
}

export function buildGrowthBlockTitle(blockId: GrowthBlockId): string {
  return GROWTH_BLOCK_LABELS[blockId]
}
