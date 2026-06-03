import { existsSync } from 'fs'
import {
  DEFAULT_LAUNCH_ASSET_TEMPLATES,
  type ExtractedBrief,
  type GeneratedLaunchAsset,
  type LaunchAssetFormat,
  type LaunchAssetTemplate,
  type LaunchKit,
} from '@/lib/launch-kit/types'
import {
  hasReplicateToken,
  runReplicatePrediction,
  runReplicateStructured,
} from '@/lib/launch-kit/replicate'

type GenerateLaunchAssetInput = {
  brief: ExtractedBrief
  kit: LaunchKit
  templateId: string
  format: LaunchAssetFormat
}

type TextAssetOutput = {
  title: string
  body: string
}

type TitleOutput = {
  title: string
}

const STRING_SCHEMA = { type: 'string' } as const
const TEXT_ASSET_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: STRING_SCHEMA,
    body: STRING_SCHEMA,
  },
  required: ['title', 'body'],
} as const
const TITLE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: STRING_SCHEMA,
  },
  required: ['title'],
} as const

const SCREENSHOT_DIMENSIONS: Record<'16:9' | '9:16', { width: number; height: number }> = {
  '16:9': { width: 1600, height: 900 },
  '9:16': { width: 1080, height: 1920 },
}

const SCREENSHOT_VIEWPORTS: Record<'16:9' | '9:16', { width: number; height: number }> = {
  '16:9': { width: 1365, height: 768 },
  '9:16': { width: 390, height: 844 },
}

const CHROME_EXECUTABLE_CANDIDATES = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  process.env.CHROME_EXECUTABLE_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean) as string[]

const GRADIENTS = [
  ['#0f172a', '#14b8a6', '#f8fafc'],
  ['#111827', '#f97316', '#fef3c7'],
  ['#0b1120', '#38bdf8', '#e0f2fe'],
  ['#18181b', '#a3e635', '#ecfccb'],
  ['#1f2937', '#fb7185', '#fff1f2'],
] as const

export async function generateLaunchAsset(input: GenerateLaunchAssetInput): Promise<LaunchKit> {
  const template = getAssetTemplate(input.templateId)
  if (!template) {
    throw new Error('Unknown asset template.')
  }

  if (!template.formats.includes(input.format)) {
    throw new Error('Unsupported asset format.')
  }

  const generatedAsset = await generateAssetRecord(input.brief, template, input.format)
  const previousAssets = input.kit.assetLibrary?.generatedAssets || []
  const generatedAssets = [
    generatedAsset,
    ...previousAssets.filter(
      (asset) => !(asset.templateId === template.id && asset.format === input.format),
    ),
  ]

  return {
    ...input.kit,
    generatedAt: new Date().toISOString(),
    assetLibrary: {
      templates: DEFAULT_LAUNCH_ASSET_TEMPLATES,
      generatedAssets,
    },
  }
}

export function getAssetTemplate(templateId: string): LaunchAssetTemplate | undefined {
  return DEFAULT_LAUNCH_ASSET_TEMPLATES.find((template) => template.id === templateId)
}

async function generateAssetRecord(
  brief: ExtractedBrief,
  template: LaunchAssetTemplate,
  format: LaunchAssetFormat,
): Promise<GeneratedLaunchAsset> {
  if (template.kind === 'screenshots') {
    return generateScreenshotAsset(brief, template, format)
  }

  if (template.kind === 'text_ads') {
    return generateTextAsset(brief, template, format)
  }

  if (template.kind === 'image_ads') {
    return generateImageAsset(brief, template, format)
  }

  return generateVideoAsset(brief, template, format)
}

async function generateScreenshotAsset(
  brief: ExtractedBrief,
  template: LaunchAssetTemplate,
  format: LaunchAssetFormat,
): Promise<GeneratedLaunchAsset> {
  const now = new Date().toISOString()
  const screenshotFormat = format === '9:16' ? '9:16' : '16:9'
  const prompt = buildScreenshotTitlePrompt(brief, template, screenshotFormat)
  const title = await generateScreenshotTitle(prompt, brief, template)

  try {
    const screenshotDataUrl = await captureWebsiteScreenshot(brief.sourceUrl, screenshotFormat)
    const outputUrl = composeScreenshotAsset({
      productName: brief.productName,
      sourceUrl: brief.sourceUrl,
      title,
      screenshotDataUrl,
      format: screenshotFormat,
    })

    return {
      id: buildAssetId(template.id, screenshotFormat),
      templateId: template.id,
      kind: template.kind,
      mediaType: template.mediaType,
      format: screenshotFormat,
      status: 'succeeded',
      title,
      prompt,
      outputUrl,
      outputText: '',
      replicatePredictionId: '',
      error: '',
      createdAt: now,
      updatedAt: now,
    }
  } catch (error) {
    return failedAsset(template, screenshotFormat, title, prompt, error, now)
  }
}

async function generateImageAsset(
  brief: ExtractedBrief,
  template: LaunchAssetTemplate,
  format: LaunchAssetFormat,
): Promise<GeneratedLaunchAsset> {
  const now = new Date().toISOString()
  const title = template.title
  const prompt = buildImageAdPrompt(brief, template, format)

  if (!hasReplicateToken()) {
    return failedAsset(template, format, title, prompt, 'Set REPLICATE_API_TOKEN to generate image ads.', now)
  }

  const result = await runReplicatePrediction({
    model: process.env.REPLICATE_IMAGE_MODEL || 'google/imagen-4-fast',
    input: {
      prompt,
      aspect_ratio: format,
      output_format: 'jpg',
      safety_filter_level: 'block_only_high',
    },
    waitSeconds: 10,
    pollTimeoutMs: 480000,
    cancelAfter: '10m',
  })

  if (!result || result.status !== 'succeeded' || !result.outputUrl) {
    return failedAsset(
      template,
      format,
      title,
      prompt,
      result?.error || 'Image generation failed.',
      now,
      result?.id || '',
    )
  }

  return succeededMediaAsset(template, format, title, prompt, result.outputUrl, result.id, now)
}

async function generateVideoAsset(
  brief: ExtractedBrief,
  template: LaunchAssetTemplate,
  format: LaunchAssetFormat,
): Promise<GeneratedLaunchAsset> {
  const now = new Date().toISOString()
  const videoFormat = format === '16:9' ? '16:9' : '9:16'
  const title = template.title
  const prompt = buildVideoAdPrompt(brief, template, videoFormat)

  if (!hasReplicateToken()) {
    return failedAsset(template, videoFormat, title, prompt, 'Set REPLICATE_API_TOKEN to generate video ads.', now)
  }

  const result = await runReplicatePrediction({
    model: process.env.REPLICATE_VIDEO_MODEL || 'google/veo-3.1-fast',
    input: {
      prompt,
      aspect_ratio: videoFormat,
      duration: template.durationSeconds || 8,
      resolution: '720p',
      generate_audio: true,
      negative_prompt:
        'blurry visuals, distorted UI, unreadable text, fake logos, fake metrics, watermark, generic stock footage',
    },
    waitSeconds: 5,
    pollTimeoutMs: 900000,
    cancelAfter: '15m',
  })

  if (!result || result.status !== 'succeeded' || !result.outputUrl) {
    return failedAsset(
      template,
      videoFormat,
      title,
      prompt,
      result?.error || 'Video generation failed.',
      now,
      result?.id || '',
    )
  }

  return succeededMediaAsset(template, videoFormat, title, prompt, result.outputUrl, result.id, now)
}

async function generateTextAsset(
  brief: ExtractedBrief,
  template: LaunchAssetTemplate,
  format: LaunchAssetFormat,
): Promise<GeneratedLaunchAsset> {
  const now = new Date().toISOString()
  const prompt = buildTextAdPrompt(brief, template)
  const fallback = fallbackTextAsset(brief, template)
  let output = fallback

  if (hasReplicateToken()) {
    const modelOutput = await runReplicateStructured<TextAssetOutput>({
      instructions: buildTextAdInstructions(template),
      prompt,
      jsonSchema: TEXT_ASSET_SCHEMA,
      schemaName: 'launch_text_asset',
      modelVariant: process.env.REPLICATE_OPENAI_MODEL || 'gpt-5',
      maxOutputTokens: 1600,
      pollTimeoutMs: 240000,
      reasoningEffort: 'medium',
      verbosity: 'medium',
    })

    const body = modelString(modelOutput?.body)
    if (body) {
      output = {
        title: modelString(modelOutput?.title) || fallback.title,
        body,
      }
    }
  }

  return {
    id: buildAssetId(template.id, format),
    templateId: template.id,
    kind: template.kind,
    mediaType: template.mediaType,
    format,
    status: 'succeeded',
    title: output.title,
    prompt,
    outputUrl: '',
    outputText: output.body,
    replicatePredictionId: '',
    error: '',
    createdAt: now,
    updatedAt: now,
  }
}

function succeededMediaAsset(
  template: LaunchAssetTemplate,
  format: LaunchAssetFormat,
  title: string,
  prompt: string,
  outputUrl: string,
  predictionId: string,
  now: string,
): GeneratedLaunchAsset {
  return {
    id: buildAssetId(template.id, format),
    templateId: template.id,
    kind: template.kind,
    mediaType: template.mediaType,
    format,
    status: 'succeeded',
    title,
    prompt,
    outputUrl,
    outputText: '',
    replicatePredictionId: predictionId,
    error: '',
    createdAt: now,
    updatedAt: now,
  }
}

function failedAsset(
  template: LaunchAssetTemplate,
  format: LaunchAssetFormat,
  title: string,
  prompt: string,
  error: unknown,
  now: string,
  predictionId = '',
): GeneratedLaunchAsset {
  return {
    id: buildAssetId(template.id, format),
    templateId: template.id,
    kind: template.kind,
    mediaType: template.mediaType,
    format,
    status: 'failed',
    title,
    prompt,
    outputUrl: '',
    outputText: '',
    replicatePredictionId: predictionId,
    error: error instanceof Error ? error.message : String(error),
    createdAt: now,
    updatedAt: now,
  }
}

async function generateScreenshotTitle(
  prompt: string,
  brief: ExtractedBrief,
  template: LaunchAssetTemplate,
): Promise<string> {
  const fallback = `${brief.productName || 'Product'} in motion`

  if (!hasReplicateToken()) {
    return fallback
  }

  const output = await runReplicateStructured<TitleOutput>({
    instructions: [
      'You write short editorial titles for one polished product screenshot asset.',
      'Return a concrete title under 8 words that reflects the product value and target audience.',
      'Do not use quotation marks, emojis, or terminal punctuation.',
      'Return valid JSON only.',
    ].join('\n'),
    prompt,
    jsonSchema: TITLE_SCHEMA,
    schemaName: 'screenshot_title',
    modelVariant: process.env.REPLICATE_OPENAI_MODEL || 'gpt-5',
    maxOutputTokens: 300,
    pollTimeoutMs: 180000,
    reasoningEffort: 'minimal',
    verbosity: 'low',
  })

  return modelString(output?.title) || template.title || fallback
}

function modelString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

async function captureWebsiteScreenshot(
  sourceUrl: string,
  format: '16:9' | '9:16',
): Promise<string> {
  const parsedUrl = new URL(sourceUrl)
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('Screenshots require an HTTP or HTTPS source URL.')
  }

  const { chromium } = await import('playwright-core')
  const executablePath = findChromeExecutable()
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ['--disable-dev-shm-usage', '--disable-gpu', '--no-sandbox'],
  })

  try {
    const page = await browser.newPage({ viewport: SCREENSHOT_VIEWPORTS[format] })
    await page.goto(parsedUrl.toString(), {
      waitUntil: 'networkidle',
      timeout: 30000,
    })
    const buffer = await page.screenshot({ type: 'png', fullPage: false })
    return `data:image/png;base64,${buffer.toString('base64')}`
  } finally {
    await browser.close()
  }
}

function findChromeExecutable(): string | undefined {
  return CHROME_EXECUTABLE_CANDIDATES.find((candidate) => existsSync(candidate))
}

function composeScreenshotAsset(input: {
  productName: string
  sourceUrl: string
  title: string
  screenshotDataUrl: string
  format: '16:9' | '9:16'
}): string {
  const { width, height } = SCREENSHOT_DIMENSIONS[input.format]
  const [from, via, to] = GRADIENTS[hashString(input.productName || input.sourceUrl) % GRADIENTS.length]
  const isVertical = input.format === '9:16'
  const titleLines = splitTitle(input.title, isVertical ? 18 : 34)
  const frame = isVertical
    ? { x: 96, y: 520, width: 888, height: 1180, radius: 42 }
    : { x: 216, y: 238, width: 1168, height: 552, radius: 34 }
  const titleY = isVertical ? 168 : 96
  const titleSize = isVertical ? 78 : 64
  const subtitleY = titleY + titleLines.length * (titleSize * 0.98) + 24

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="55%" stop-color="${via}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="28" stdDeviation="28" flood-color="#020617" flood-opacity="0.28"/>
    </filter>
    <clipPath id="shot">
      <rect x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}" rx="${frame.radius}"/>
    </clipPath>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <circle cx="${isVertical ? 900 : 1320}" cy="${isVertical ? 230 : 120}" r="${isVertical ? 260 : 220}" fill="#ffffff" opacity="0.18"/>
  <circle cx="${isVertical ? 90 : 220}" cy="${isVertical ? 1720 : 780}" r="${isVertical ? 280 : 180}" fill="#ffffff" opacity="0.12"/>
  <text x="${isVertical ? 88 : 128}" y="${titleY}" fill="#ffffff" font-size="${titleSize}" font-family="Inter, Arial, sans-serif" font-weight="800" letter-spacing="0">
    ${titleLines.map((line, index) => `<tspan x="${isVertical ? 88 : 128}" dy="${index === 0 ? 0 : titleSize * 0.98}">${escapeXml(line)}</tspan>`).join('')}
  </text>
  <text x="${isVertical ? 92 : 132}" y="${subtitleY}" fill="#ffffff" opacity="0.78" font-size="${isVertical ? 28 : 24}" font-family="Inter, Arial, sans-serif" font-weight="600">${escapeXml(input.productName || 'Product')}</text>
  <rect x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}" rx="${frame.radius}" fill="#ffffff" opacity="0.9" filter="url(#shadow)"/>
  <image href="${input.screenshotDataUrl}" x="${frame.x + 8}" y="${frame.y + 8}" width="${frame.width - 16}" height="${frame.height - 16}" preserveAspectRatio="xMidYMid slice" clip-path="url(#shot)"/>
  <rect x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}" rx="${frame.radius}" fill="none" stroke="#ffffff" stroke-opacity="0.7" stroke-width="3"/>
  <text x="${isVertical ? 96 : 218}" y="${height - (isVertical ? 104 : 44)}" fill="#ffffff" opacity="0.72" font-size="${isVertical ? 24 : 18}" font-family="Inter, Arial, sans-serif">${escapeXml(input.sourceUrl)}</text>
</svg>`

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

function buildScreenshotTitlePrompt(
  brief: ExtractedBrief,
  template: LaunchAssetTemplate,
  format: LaunchAssetFormat,
): string {
  return JSON.stringify(
    {
      task: `Create one short title for a ${format} launch screenshot asset.`,
      objective:
        'Name the most compelling product outcome visible in the screenshot without making unsupported claims.',
      targetAsset: {
        templateId: template.id,
        title: template.title,
        angle: template.angle,
        format,
      },
      businessContext: {
        productName: brief.productName,
        positioning: brief.positioning,
        audience: brief.icp || brief.targetUsers[0],
        voiceGuide: brief.voiceGuide,
        valueProps: brief.valueProps.slice(0, 4),
      },
      proofPoints: brief.proofPoints,
      qualityBar: [
        'Specific enough to feel written for this product.',
        'Short enough to overlay cleanly on a screenshot.',
        'No vague hype words, invented metrics, or broad category claims.',
      ],
    },
    null,
    2,
  )
}

function buildImageAdPrompt(
  brief: ExtractedBrief,
  template: LaunchAssetTemplate,
  format: LaunchAssetFormat,
): string {
  const audience = brief.icp || brief.targetUsers.join(', ') || 'the highest-intent audience'
  const pain = brief.painPoints[0] || 'a clear workflow problem the product solves'
  const value = brief.valueProps[0] || brief.positioning || 'the practical outcome the product creates'
  const proof = brief.proofPoints.slice(0, 3).join('; ') || 'use visual credibility cues without inventing metrics'

  return [
    `Create one ${format} paid social image asset for ${brief.productName}.`,
    `Placement: ${describeAssetPlacement(format)}.`,
    `Asset concept: ${template.title} - ${template.angle}.`,
    `Business context: ${brief.positioning}.`,
    `Target audience: ${audience}.`,
    `Audience problem to make visible: ${pain}.`,
    `Product outcome to make obvious: ${value}.`,
    `Voice and tone: ${brief.voiceGuide || 'human, specific, and source-grounded'}.`,
    `Primary CTA: ${brief.cta || 'Learn more'}.`,
    `Proof cues: ${proof}.`,
    `Message hierarchy: 1) familiar problem, 2) product-led shift, 3) credible proof cue, 4) short CTA.`,
    `Visual direction: ${buildImageVisualDirection(template)}.`,
    'Copy direction: one short human headline only; no dense paragraphs, fake urgency, unsupported metrics, or generic AI phrasing.',
    'Typography direction: readable headline space, accessible contrast, no distorted letters, no tiny fake UI labels, no invented logos.',
    'Quality bar: polished product-marketing creative that feels specific to this product, not a stock template.',
  ].join('\n')
}

function buildVideoAdPrompt(
  brief: ExtractedBrief,
  template: LaunchAssetTemplate,
  format: '16:9' | '9:16',
): string {
  const audience = brief.icp || brief.targetUsers.join(', ') || 'the highest-intent audience'
  const pain = brief.painPoints[0] || 'a clear workflow problem the product solves'
  const value = brief.valueProps[0] || brief.positioning || 'the practical outcome the product creates'
  const proof = brief.proofPoints.slice(0, 2).join('; ') || 'show calm credibility without invented numbers'

  return [
    `Create one ${template.durationSeconds || 8}-second ${format} paid social video asset for ${brief.productName}.`,
    `Placement: ${describeAssetPlacement(format)}.`,
    `Asset concept: ${template.title} - ${template.angle}.`,
    `Business context: ${brief.positioning}.`,
    `Target audience: ${audience}.`,
    `Opening problem: ${pain}.`,
    `Product outcome: ${value}.`,
    `Voice and tone: ${brief.voiceGuide || 'human, specific, and source-grounded'}.`,
    `Primary CTA: ${brief.cta || 'Learn more'}.`,
    `Proof cues: ${proof}.`,
    `Beat plan: 0-2s hook, 2-5s problem/product contrast, 5-7s proof or product moment, final second CTA.`,
    `Creative direction: ${buildVideoVisualDirection(template)}.`,
    'Script direction: make the hook sound like a real person, show the product outcome before the CTA, and keep every claim supported by the brief.',
    'Audio direction: subtle modern sound design; no spoken metrics, testimonials, or claims that are not in the brief.',
    'Quality bar: polished product-marketing motion with readable overlays, clear focal point, and no generic stock-ad feel.',
  ].join('\n')
}

type TextAdSpec = {
  channel: string
  formatName: string
  objective: string
  bodyRequirements: string[]
  tone: string
}

function buildTextAdInstructions(template: LaunchAssetTemplate): string {
  const spec = getTextAdSpec(template)

  return [
    `You are Launch Kit, an expert ${spec.channel} paid-social copywriter.`,
    `Write exactly one ${spec.channel} ${spec.formatName} grounded in the product brief and voice guide.`,
    'Make the copy sound human, specific, and native to the requested placement rather than AI-generated.',
    'Avoid hype, fake scarcity, unsupported claims, unnecessary hashtags, and generic AI wording.',
    'Use proof only when it appears in the brief. If proof is missing, write without making proof claims.',
    'Return valid JSON only.',
  ].join('\n')
}

function buildTextAdPrompt(brief: ExtractedBrief, template: LaunchAssetTemplate): string {
  const spec = getTextAdSpec(template)

  return JSON.stringify(
    {
      task: `Write one ${spec.channel} ${spec.formatName} for ${brief.productName}.`,
      targetChannel: spec.channel,
      objective: spec.objective,
      template: {
        id: template.id,
        title: template.title,
        angle: template.angle,
      },
      businessContext: {
        name: brief.productName,
        positioning: brief.positioning,
        audience: brief.icp || brief.targetUsers.join(', '),
        voiceGuide: brief.voiceGuide,
        painPoints: brief.painPoints,
        valueProps: brief.valueProps,
        proofPoints: brief.proofPoints,
        cta: brief.cta,
      },
      outputRequirements: {
        title: 'Short internal asset title matching the template.',
        body: spec.bodyRequirements,
      },
      tone: spec.tone,
      qualityBar: [
        'Use only claims supported by the brief.',
        'Follow the voice guide while adapting to the requested placement.',
        'Avoid generic AI phrases, inflated promises, fake urgency, and unsupported proof.',
        'No hashtags unless truly useful.',
      ],
    },
    null,
    2,
  )
}

function getTextAdSpec(template: LaunchAssetTemplate): TextAdSpec {
  if (template.id === 'text_ad_x_thread') {
    return {
      channel: 'X',
      formatName: 'short thread',
      objective:
        'Move from a sharp problem observation to the product outcome in a thread people can read quickly and reply to.',
      bodyRequirements: [
        'Write 4-6 numbered posts.',
        'Keep each post concise enough to fit comfortably in a single X post.',
        'End with a soft CTA or useful question, not engagement bait.',
      ],
      tone: 'Concise, specific, lightly opinionated, and public timeline native.',
    }
  }

  if (template.id === 'text_ad_x_short') {
    return {
      channel: 'X',
      formatName: 'short post',
      objective:
        'Create one sharp public timeline post that makes the product problem and outcome memorable.',
      bodyRequirements: [
        'Write one post, not a thread.',
        'Keep it punchy and easy to scan.',
        'Include one concrete pain, outcome, or proof cue from the brief.',
      ],
      tone: 'Concise, specific, direct, and easy to reply to.',
    }
  }

  if (template.id === 'text_ad_threads_thread') {
    return {
      channel: 'Threads',
      formatName: 'compact sequence',
      objective:
        'Tell a casual short sequence that moves from relatable pain to practical product next step.',
      bodyRequirements: [
        'Write 3-5 short posts in a conversational sequence.',
        'Make each post feel like a natural continuation, not a formal thread.',
        'End with a soft reply-friendly CTA.',
      ],
      tone: 'Conversational, relaxed, human, and reply-friendly.',
    }
  }

  return {
    channel: 'Threads',
    formatName: 'single post',
    objective:
      'Write a casual post that makes the product feel useful and easy to respond to.',
    bodyRequirements: [
      'Write one conversational post.',
      'Use simple language and a soft CTA.',
      'Avoid hard-sell phrasing and polished announcement cadence.',
    ],
    tone: 'Casual, specific, human, and lightly conversational.',
  }
}

function describeAssetPlacement(format: LaunchAssetFormat): string {
  const placements: Record<LaunchAssetFormat, string> = {
    '16:9': 'landscape feed or website hero placement with room for product context',
    '9:16': 'vertical mobile placement with a fast hook and large readable focal point',
    '1:1': 'square feed placement with a centered message and strong visual hierarchy',
    '4:5': 'portrait feed placement optimized for mobile scrolling',
    '1.91:1': 'wide feed placement with concise copy and a clear product moment',
    text: 'text-only paid social placement',
  }

  return placements[format]
}

function buildImageVisualDirection(template: LaunchAssetTemplate): string {
  const directions: Record<string, string> = {
    image_ad_problem_solution:
      'show a clear before/after contrast between the painful current state and the cleaner product-enabled outcome',
    image_ad_social_proof:
      'make credibility the hero through sourced proof cues, trust signals, and restrained product context',
    image_ad_feature_benefit:
      'visualize one concrete product capability and the practical benefit it creates for the audience',
    image_ad_before_after:
      'compose a transformation scene with old workflow on one side and improved state on the other',
    image_ad_offer_cta:
      'center the next step with a clear CTA area, product promise, and minimal supporting proof',
  }

  return (
    directions[template.id] ||
    'use premium product advertising composition with a clear focal point, realistic product context, and a rich but balanced palette'
  )
}

function buildVideoVisualDirection(template: LaunchAssetTemplate): string {
  const directions: Record<string, string> = {
    video_ad_hook_problem_fix:
      'open on the specific problem, show the friction, then reveal the product fix with a clean final CTA',
    video_ad_product_walkthrough:
      'move through the core product workflow as a concise visual story with one obvious outcome',
    video_ad_founder_story:
      'feel founder-led, with a human problem setup, product reveal, and grounded reason the product exists',
    video_ad_social_proof:
      'sequence proof cues and product outcomes calmly, avoiding flashy claims or unsupported numbers',
    video_ad_objection_handler:
      'state the likely hesitation, answer it visually, then show why the next step feels low-risk',
  }

  return (
    directions[template.id] ||
    'use polished product-marketing motion with a clear hook, concise middle beat, and memorable close'
  )
}

function fallbackTextAsset(brief: ExtractedBrief, template: LaunchAssetTemplate): TextAssetOutput {
  const product = brief.productName || 'Product'
  const audience = brief.targetUsers[0] || brief.icp || 'the people it is built for'
  const pain = brief.painPoints[0] || 'the workflow that slows your team down'
  const value = brief.valueProps[0] || brief.positioning || 'move faster with a clearer workflow'
  const cta = brief.cta || 'Learn more'

  if (template.id === 'text_ad_x_thread') {
    return {
      title: template.title,
      body: [
        `1/ ${pain} is usually where momentum disappears.`,
        `2/ ${product} gives ${audience} one clearer way to ${value.toLowerCase()}.`,
        `3/ The useful shift: less guessing, more obvious next step.`,
        `${cta}`,
      ].join('\n\n'),
    }
  }

  if (template.id === 'text_ad_threads_thread') {
    return {
      title: template.title,
      body: [
        `${pain} tends to turn a simple next step into a messy one.`,
        `${product} helps ${audience} ${value.toLowerCase()} with less friction.`,
        `Useful if ${pain.toLowerCase()} keeps slowing down the work.`,
        `${cta}`,
      ].join('\n\n'),
    }
  }

  if (template.id === 'text_ad_threads_post') {
    return {
      title: template.title,
      body: `${pain} should not be the thing that slows the next step. ${product} helps ${audience} ${value.toLowerCase()}. ${cta}`,
    }
  }

  return {
    title: template.title,
    body: `${pain}? ${product} helps ${audience} ${value.toLowerCase()}. ${cta}`,
  }
}

function splitTitle(title: string, maxLineLength: number): string[] {
  const words = title.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxLineLength && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }

  if (current) {
    lines.push(current)
  }

  return lines.slice(0, 3)
}

function buildAssetId(templateId: string, format: LaunchAssetFormat): string {
  return `${templateId}-${format.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}`
}

function hashString(input: string): number {
  return input.split('').reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) >>> 0, 0)
}

function escapeXml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}
