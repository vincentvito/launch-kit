import {
  GROWTH_BLOCK_IDS,
  GROWTH_BLOCK_LABELS,
  PLATFORM_IDS,
  PLATFORM_LABELS,
  type ExtractedBrief,
  type GrowthAssets,
  type GrowthBlockId,
  type LaunchKit,
  type MediaKit,
  type OutreachPack,
  type OutreachVariant,
  type PlatformBlock,
  type PlatformBlockId,
  type SeoPostPack,
} from '@/lib/launch-kit/types'
import {
  createEmptyKit,
  createEmptyProspectingState,
} from '@/lib/launch-kit/normalizers'
import { isPlatformBlockId, safeJsonParse } from '@/lib/launch-kit/utils'
import { hasReplicateToken, runReplicateStructured } from '@/lib/launch-kit/replicate'

type GenerateInput = {
  brief: ExtractedBrief
  selectedBlocks?: PlatformBlockId[]
  selectedGrowthBlocks?: GrowthBlockId[]
  includeMediaKit?: boolean
  includeGrowthAssets?: boolean
  existingKit?: LaunchKit | null
}

type ModelOutput = {
  platformBlocks?: Record<string, { title?: string; body?: string; cta?: string; notes?: string }>
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

const OUTREACH_VARIANT_SCHEMA = {
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

const OUTREACH_PACK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    notes: STRING_SCHEMA,
    personalizationTemplate: STRING_SCHEMA,
    variants: { type: 'array', items: OUTREACH_VARIANT_SCHEMA },
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
  selectedGrowthBlocks: GrowthBlockId[],
  includeMediaKit: boolean,
  includeGrowthAssets: boolean,
): Record<string, unknown> {
  const rootProperties: Record<string, unknown> = {
    platformBlocks: {
      type: 'object',
      additionalProperties: false,
      properties: Object.fromEntries(
        selectedBlocks.map((blockId) => [blockId, PLATFORM_BLOCK_SCHEMA]),
      ),
      required: selectedBlocks,
    },
  }

  if (includeMediaKit) {
    rootProperties.mediaKit = MEDIA_KIT_SCHEMA
  }

  if (includeGrowthAssets && selectedGrowthBlocks.length > 0) {
    const growthProperties: Record<string, unknown> = {}
    const growthRequired: string[] = []

    if (selectedGrowthBlocks.includes('linkedin_outreach')) {
      growthProperties.linkedinOutreach = OUTREACH_PACK_SCHEMA
      growthRequired.push('linkedinOutreach')
    }

    if (selectedGrowthBlocks.includes('x_outreach')) {
      growthProperties.xOutreach = OUTREACH_PACK_SCHEMA
      growthRequired.push('xOutreach')
    }

    if (selectedGrowthBlocks.includes('cold_email_outreach')) {
      growthProperties.emailOutreach = OUTREACH_PACK_SCHEMA
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

  return {
    type: 'object',
    additionalProperties: false,
    properties: rootProperties,
    required: Object.keys(rootProperties),
  }
}

export async function generateLaunchKit(input: GenerateInput): Promise<LaunchKit> {
  const selectedBlocks = input.selectedBlocks ?? [...PLATFORM_IDS]
  const selectedGrowthBlocks = input.selectedGrowthBlocks ?? [...GROWTH_BLOCK_IDS]
  const includeMediaKit = input.includeMediaKit ?? true
  const includeGrowthAssets = input.includeGrowthAssets ?? true
  const baseKit = input.existingKit ?? createEmptyKit(input.brief.language)

  if (!hasReplicateToken() && !process.env.OPENAI_API_KEY) {
    return fallbackLaunchKit(
      input.brief,
      selectedBlocks,
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
      selectedGrowthBlocks,
      includeMediaKit,
      includeGrowthAssets,
    )) ||
    (await generateChunkedModelOutput(
      input.brief,
      selectedBlocks,
      selectedGrowthBlocks,
      includeMediaKit,
      includeGrowthAssets,
    ))

  const mergedBlocks = { ...baseKit.platformBlocks }
  for (const blockId of selectedBlocks) {
    const raw = modelOutput.platformBlocks?.[blockId]
    mergedBlocks[blockId] = normalizeBlock(blockId, raw, input.brief)
  }

  const nextKit: LaunchKit = {
    generatedAt: new Date().toISOString(),
    language: input.brief.language,
    platformBlocks: mergedBlocks,
    mediaKit: includeMediaKit
      ? normalizeMediaKit(modelOutput.mediaKit, input.brief)
      : baseKit.mediaKit,
    growthAssets: includeGrowthAssets
      ? normalizeGrowthAssets(modelOutput.growthAssets, selectedGrowthBlocks, input.brief, baseKit.growthAssets)
      : baseKit.growthAssets,
    prospecting: baseKit.prospecting || createEmptyProspectingState(),
  }

  return nextKit
}

async function tryGenerateModelOutput(
  brief: ExtractedBrief,
  selectedBlocks: PlatformBlockId[],
  selectedGrowthBlocks: GrowthBlockId[],
  includeMediaKit: boolean,
  includeGrowthAssets: boolean,
): Promise<ModelOutput | null> {
  try {
    return hasReplicateToken()
      ? await generateWithReplicate(
          brief,
          selectedBlocks,
          selectedGrowthBlocks,
          includeMediaKit,
          includeGrowthAssets,
        )
      : await generateWithOpenAi(
          brief,
          selectedBlocks,
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
  selectedGrowthBlocks: GrowthBlockId[],
  includeMediaKit: boolean,
  includeGrowthAssets: boolean,
): Promise<ModelOutput> {
  const output: ModelOutput = {
    platformBlocks: {},
    growthAssets: {},
  }

  for (const blockId of selectedBlocks) {
    const chunk = await tryGenerateModelOutput(brief, [blockId], [], false, false)
    if (chunk?.platformBlocks?.[blockId]) {
      output.platformBlocks = {
        ...output.platformBlocks,
        [blockId]: chunk.platformBlocks[blockId],
      }
    }
  }

  if (includeMediaKit) {
    const mediaChunk = await tryGenerateModelOutput(brief, [], [], true, false)
    if (mediaChunk?.mediaKit) {
      output.mediaKit = mediaChunk.mediaKit
    }
  }

  if (includeGrowthAssets) {
    for (const blockId of selectedGrowthBlocks) {
      const chunk = await tryGenerateModelOutput(brief, [], [blockId], false, true)
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

async function generateWithReplicate(
  brief: ExtractedBrief,
  selectedBlocks: PlatformBlockId[],
  selectedGrowthBlocks: GrowthBlockId[],
  includeMediaKit: boolean,
  includeGrowthAssets: boolean,
): Promise<ModelOutput> {
  const output = await runReplicateStructured<ModelOutput>({
    instructions: [
      'You are Launch Kit, an expert launch strategist and growth operator.',
      'Core positioning angle: every platform has a different social contract.',
      'Write platform-native, specific, practical content.',
      'Ground every output in the brief fields: icp, targetUsers, painPoints, valueProps, proofPoints, cta, and keywordResearch.',
      'Do not write generic AI copy. Use concrete details from the brief.',
      'For Hacker News: humble, technical, no hype.',
      'For Reddit: conversational, transparent, context-first.',
      'For Indie Hackers: build-in-public, lessons and tradeoffs.',
      'For LinkedIn posts: professional but human, outcome-oriented.',
      'For TikTok and YouTube Shorts: trend-inspired scripts with explicit Hook, Story Beats, and Close CTA.',
      'For outbound outreach: concise, respectful, personalization-ready, no spammy language.',
      'For SEO post packs: practical, structured, include non-generic outline and draft based on keyword clusters.',
      'For the media kit: infer bio, boilerplate, press release, assets, and contact details only from website-derived brief evidence.',
      'If contact details are not present in the source website evidence, say they were not detected. Do not ask the user to manually add them and do not invent personal contact data.',
      'Respect the requested language.',
      'Return valid JSON matching schema.',
    ].join('\n'),
    prompt: JSON.stringify(
      {
        task: 'Generate launch kit content and growth assets from this brief.',
        selectedBlocks,
        selectedGrowthBlocks,
        includeMediaKit,
        includeGrowthAssets,
        brief,
      },
      null,
      2,
    ),
    jsonSchema: buildLaunchKitModelSchema(
      selectedBlocks,
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
  selectedGrowthBlocks: GrowthBlockId[],
  includeMediaKit: boolean,
  includeGrowthAssets: boolean,
): Promise<ModelOutput> {
  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini'
  const payload = {
    model,
    temperature: 0.8,
    max_output_tokens: 4200,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: [
              'You are Launch Kit, an expert launch strategist and growth operator.',
              'Core positioning angle: every platform has a different social contract.',
              'Write platform-native, specific, practical content.',
              'Ground every output in the brief fields: icp, targetUsers, painPoints, valueProps, proofPoints, cta, and keywordResearch.',
              'Do not write generic AI copy. Use concrete details from the brief.',
              'For Hacker News: humble, technical, no hype.',
              'For Reddit: conversational, transparent, context-first.',
              'For Indie Hackers: build-in-public, lessons and tradeoffs.',
              'For LinkedIn posts: professional but human, outcome-oriented.',
              'For TikTok and YouTube Shorts: trend-inspired scripts with explicit Hook, Story Beats, and Close CTA.',
              'For outbound outreach: concise, respectful, personalization-ready, no spammy language.',
              'For SEO post packs: practical, structured, include non-generic outline and draft based on keyword clusters.',
              'For the media kit: infer bio, boilerplate, press release, assets, and contact details only from website-derived brief evidence.',
              'If contact details are not present in the source website evidence, say they were not detected. Do not ask the user to manually add them and do not invent personal contact data.',
              'Respect the requested language. Return valid JSON only.',
            ].join('\n'),
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: JSON.stringify(
              {
                task: 'Generate launch kit content and growth assets from this brief.',
                selectedBlocks,
                selectedGrowthBlocks,
                includeMediaKit,
                includeGrowthAssets,
                brief,
                outputShape: {
                  platformBlocks: {
                    '<platform_id>': {
                      title: 'string',
                      body: 'string',
                      cta: 'string',
                      notes: 'string',
                    },
                  },
                  mediaKit: {
                    founderCompanyBio: 'string',
                    productOneLiner: 'string',
                    boilerplate: 'string',
                    pressRelease: 'string',
                    keyVisualsChecklist: ['string'],
                    screenshotsAndLogos: 'string',
                    contactDetails: 'string',
                  },
                  growthAssets: {
                    linkedinOutreach: {
                      notes: 'string',
                      personalizationTemplate: 'string',
                      variants: [
                        {
                          title: 'string',
                          message: 'string',
                          cta: 'string',
                        },
                      ],
                    },
                    xOutreach: {
                      notes: 'string',
                      personalizationTemplate: 'string',
                      variants: [
                        {
                          title: 'string',
                          message: 'string',
                          cta: 'string',
                        },
                      ],
                    },
                    emailOutreach: {
                      notes: 'string',
                      personalizationTemplate: 'string',
                      variants: [
                        {
                          title: 'string',
                          subject: 'string',
                          message: 'string',
                          cta: 'string',
                        },
                      ],
                    },
                    seoPostPacks: [
                      {
                        keywordClusterId: 'string',
                        keywordTopic: 'string',
                        title: 'string',
                        metaDescription: 'string',
                        outline: ['string'],
                        draft: 'string',
                        cta: 'string',
                      },
                    ],
                  },
                },
              },
              null,
              2,
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

function normalizeBlock(
  blockId: PlatformBlockId,
  raw: { title?: string; body?: string; cta?: string; notes?: string } | undefined,
  brief: ExtractedBrief,
): PlatformBlock {
  return {
    id: blockId,
    label: PLATFORM_LABELS[blockId],
    title: raw?.title?.trim() || `${brief.productName} on ${PLATFORM_LABELS[blockId]}`,
    body: raw?.body?.trim() || fallbackBlockBody(blockId, brief),
    cta: raw?.cta?.trim() || brief.cta,
    notes: raw?.notes?.trim() || 'Generated from your product brief and adapted to this platform.',
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
      `${brief.productName} helps teams turn one product brief into channel-specific launch content across discovery, social, and press platforms.`,
    pressRelease:
      raw?.pressRelease?.trim() ||
      `Today, ${brief.productName} announced a new way for ${brief.targetUsers.join(', ') || 'teams'} to publish launch content faster while preserving platform-specific voice.`,
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
    }
  }

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
    mediaKit: includeMediaKit
      ? normalizeMediaKit(undefined, brief)
      : baseKit.mediaKit,
    growthAssets: growth,
    prospecting: baseKit.prospecting || createEmptyProspectingState(),
  }
}

function fallbackOutreachPack(
  channel: 'linkedin' | 'x' | 'email',
  brief: ExtractedBrief,
): OutreachPack {
  const topPain = brief.painPoints[0] || 'rewriting launch messaging for every channel'
  const topValue = brief.valueProps[0] || brief.positioning

  if (channel === 'linkedin') {
    return {
      channel,
      notes: 'Professional, concise, and proof-led outreach tone.',
      personalizationTemplate:
        'Hi {{firstName}} - saw {{company}} is launching in {{category}}. We built this for teams tackling launch messaging overhead.',
      variants: [
        {
          id: 'linkedin-v1',
          title: 'Pain-led opener',
          message: `Hi {{firstName}}, many teams lose launch momentum because of ${topPain}. ${brief.productName} helps with that by turning one product URL into channel-ready drafts.`,
          cta: 'Want a sample for your current launch?',
        },
        {
          id: 'linkedin-v2',
          title: 'Value-led opener',
          message: `Hi {{firstName}}, ${brief.productName} helps teams ship faster with ${topValue}. We adapt copy for each platform social contract automatically.`,
          cta: 'Open to a 10-minute walkthrough?',
        },
        {
          id: 'linkedin-v3',
          title: 'Proof-led opener',
          message: `Hi {{firstName}}, early users tell us they can reduce launch prep time by centralizing messaging in one brief and regenerating per channel as needed.`,
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
        'Hey {{firstName}} - noticed {{company}} is shipping in public. Thought this might help your launch workflow.',
      variants: [
        {
          id: 'x-v1',
          title: 'Quick intro',
          message: `Hey {{firstName}} - if ${topPain} is a headache, we built ${brief.productName} to fix exactly that.`,
          cta: 'Want a sample output?',
        },
        {
          id: 'x-v2',
          title: 'Outcome angle',
          message: `${brief.productName} turns one URL into launch copy for HN, Reddit, LinkedIn, and short video scripts.`,
          cta: 'Can I run it on your site?',
        },
        {
          id: 'x-v3',
          title: 'Build-in-public angle',
          message: `Built this for founders who are tired of rewriting launch posts platform by platform.`,
          cta: brief.cta,
        },
      ],
    }
  }

  return {
    channel,
    notes: 'Short personalized cold-email structure.',
    personalizationTemplate:
      'Subject: Quick idea for {{company}} launch workflow\n\nHi {{firstName}},\n\nSaw what you are building at {{company}}.',
    variants: [
      {
        id: 'email-v1',
        title: 'Direct intro',
        subject: `Quick idea for ${brief.productName}`,
        message: `Hi {{firstName}},\n\nWe built ${brief.productName} for teams dealing with ${topPain}. It generates channel-specific launch copy from one source brief.`,
        cta: 'Want me to generate a sample kit for your product page?',
      },
      {
        id: 'email-v2',
        title: 'Value-led',
        subject: 'Launch day workflow idea',
        message: `Hi {{firstName}},\n\n${brief.productName} helps teams move faster with ${topValue} while keeping message quality high across channels.`,
        cta: 'Open to a short walkthrough?',
      },
      {
        id: 'email-v3',
        title: 'Proof-led',
        subject: 'Reducing launch prep time',
        message: 'Hi {{firstName}},\n\nTeams using this workflow report spending far less time rewriting the same launch story for every community.',
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
          topic: `${brief.productName} launch workflow`,
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

function fallbackBlockBody(blockId: PlatformBlockId, brief: ExtractedBrief): string {
  const highlights = brief.keyClaims.slice(0, 3).map((line) => `- ${line}`).join('\n')
  const painPoints = brief.painPoints.slice(0, 2).map((line) => `- ${line}`).join('\n')
  const valueProps = brief.valueProps.slice(0, 2).map((line) => `- ${line}`).join('\n')
  const proofPoints = brief.proofPoints.slice(0, 2).map((line) => `- ${line}`).join('\n')
  const audience = brief.targetUsers.join(', ') || 'builders'

  const templates: Record<PlatformBlockId, string> = {
    product_hunt: `${brief.productName} is live on Product Hunt.\n\n${brief.positioning}\n\nBuilt for: ${audience}\n\nValue props:\n${valueProps}\n\nProof:\n${proofPoints || '- Building with customer feedback'}\n\nHighlights:\n${highlights}`,
    hacker_news: `Show HN: ${brief.productName}\n\nI built this for ${audience}. ${brief.positioning}\n\nPain points we targeted:\n${painPoints}\n\nWould value candid feedback on product, positioning, and launch execution.`,
    reddit: `Hey everyone, I built ${brief.productName}. ${brief.positioning}\n\nPain points this addresses:\n${painPoints}\n\nCurious if this resonates with how your team launches products.`,
    indie_hackers: `Launched ${brief.productName} today.\n\nWho it helps: ${audience}\nWhat worked: ${brief.valueProps[0] || brief.positioning}\nWhat was hard: ${brief.painPoints[0] || 'Translating one story across channels.'}\nProof signals:\n${proofPoints || '- Early user feedback in progress'}\nWhat I am testing next: distribution and onboarding loops.`,
    linkedin: `Today we launched ${brief.productName}.\n\n${brief.positioning}\n\nBuilt for ${audience}.\nWhy this matters:\n${valueProps}\nProof:\n${proofPoints || '- First launch feedback coming in'}`,
    tiktok: `Hook: Launch copy should not take all day.\nStory beats: Problem (${brief.painPoints[0] || 'channel-by-channel rewrite'}) -> Solution (${brief.productName}) -> Outcome (${brief.valueProps[0] || 'faster launch execution'}).\nProof cue: ${brief.proofPoints[0] || 'teams can ship with one source URL'}.\nCTA: ${brief.cta}`,
    youtube_shorts: `Hook: One URL should power your full launch.\nStory beats: Pain (${brief.painPoints[0] || 'fragmented launch messaging'}) -> Workflow (extract brief -> platform drafts) -> Outcome (${brief.valueProps[0] || 'faster launch day shipping'}).\nProof cue: ${brief.proofPoints[0] || 'structured outputs per platform'}.\nCTA: ${brief.cta}`,
    email_announcement: `Subject: ${brief.productName} is live\n\nHi there,\n\n${brief.positioning}\n\nBuilt for: ${audience}\nPain points:\n${painPoints}\nValue props:\n${valueProps}\nProof:\n${proofPoints || '- Early launch feedback ongoing'}\n\n${brief.cta}`,
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

export function buildGrowthBlockTitle(blockId: GrowthBlockId): string {
  return GROWTH_BLOCK_LABELS[blockId]
}
