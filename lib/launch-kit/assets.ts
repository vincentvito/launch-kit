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
      negative_prompt: 'blurry visuals, distorted UI, unreadable text, fake logos, watermark',
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
      instructions: [
        'You are Launch Kit, an expert paid-social copywriter.',
        'Write native text ads grounded in the product brief.',
        'Avoid hype, fake scarcity, unsupported claims, and generic AI wording.',
        'Return valid JSON only.',
      ].join('\n'),
      prompt,
      jsonSchema: TEXT_ASSET_SCHEMA,
      schemaName: 'launch_text_asset',
      modelVariant: process.env.REPLICATE_OPENAI_MODEL || 'gpt-5',
      maxOutputTokens: 1600,
      pollTimeoutMs: 240000,
      reasoningEffort: 'medium',
      verbosity: 'medium',
    })

    if (modelOutput?.body?.trim()) {
      output = {
        title: modelOutput.title?.trim() || fallback.title,
        body: modelOutput.body.trim(),
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
      'You write short editorial titles for polished product screenshots.',
      'Return a concrete title under 8 words.',
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

  return output?.title?.trim() || template.title || fallback
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
      task: 'Create a short title for a polished launch screenshot.',
      productName: brief.productName,
      positioning: brief.positioning,
      audience: brief.icp || brief.targetUsers[0],
      valueProps: brief.valueProps,
      proofPoints: brief.proofPoints,
      templateAngle: template.angle,
      format,
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
  return [
    `Create an evergreen paid image ad for ${brief.productName}.`,
    `Format/aspect ratio: ${format}.`,
    `Template angle: ${template.angle}`,
    `Audience: ${brief.icp || brief.targetUsers.join(', ') || 'startup operators'}.`,
    `Positioning: ${brief.positioning}.`,
    `Core value props: ${brief.valueProps.slice(0, 4).join('; ') || brief.positioning}.`,
    `Proof cues: ${brief.proofPoints.slice(0, 3).join('; ') || 'use credible, non-specific visual trust cues without inventing metrics'}.`,
    `CTA: ${brief.cta || 'Learn more'}.`,
    'Visual direction: premium SaaS/product advertising, clean composition, rich but not one-note palette, realistic product-marketing scene, clear focal point, accessible contrast.',
    'Typography direction: minimal readable headline area, no dense paragraphs, no fake UI text, no distorted letters, no invented logos.',
  ].join('\n')
}

function buildVideoAdPrompt(
  brief: ExtractedBrief,
  template: LaunchAssetTemplate,
  format: '16:9' | '9:16',
): string {
  return [
    `Create an ${template.durationSeconds || 8}-second evergreen video ad for ${brief.productName}.`,
    `Aspect ratio: ${format}.`,
    `Template angle: ${template.angle}`,
    `Audience: ${brief.icp || brief.targetUsers.join(', ') || 'startup operators'}.`,
    `Problem: ${brief.painPoints[0] || 'a slow, fragmented workflow'}.`,
    `Outcome: ${brief.valueProps[0] || brief.positioning}.`,
    `Proof cues: ${brief.proofPoints.slice(0, 2).join('; ') || 'show calm credibility without invented numbers'}.`,
    `CTA: ${brief.cta || 'Learn more'}.`,
    'Creative direction: polished product-marketing motion, clear opening hook, concise middle beat, memorable close, native paid-social pacing, no fake logos, no unreadable overlays.',
    'Audio direction: subtle modern sound design, no spoken claims that are not in the brief.',
  ].join('\n')
}

function buildTextAdPrompt(brief: ExtractedBrief, template: LaunchAssetTemplate): string {
  return JSON.stringify(
    {
      task: 'Write one native text ad using this template.',
      template: {
        id: template.id,
        title: template.title,
        angle: template.angle,
      },
      product: {
        name: brief.productName,
        positioning: brief.positioning,
        audience: brief.icp || brief.targetUsers.join(', '),
        painPoints: brief.painPoints,
        valueProps: brief.valueProps,
        proofPoints: brief.proofPoints,
        cta: brief.cta,
      },
      constraints: [
        'Use only claims supported by the brief.',
        'For X, keep the post concise and punchy.',
        'For Threads, make it conversational and reply-friendly.',
        'No hashtags unless truly useful.',
      ],
    },
    null,
    2,
  )
}

function fallbackTextAsset(brief: ExtractedBrief, template: LaunchAssetTemplate): TextAssetOutput {
  const product = brief.productName || 'Product'
  const pain = brief.painPoints[0] || 'the workflow that slows your team down'
  const value = brief.valueProps[0] || brief.positioning || 'move faster with a clearer workflow'
  const cta = brief.cta || 'Learn more'

  if (template.id === 'text_ad_x_thread') {
    return {
      title: template.title,
      body: [
        `1/ ${pain} is usually where launch momentum disappears.`,
        `2/ ${product} helps by giving teams one clearer way to ${value.toLowerCase()}.`,
        `3/ If you are preparing a launch, start with one source brief and adapt the story per channel.`,
        `${cta}`,
      ].join('\n\n'),
    }
  }

  if (template.id === 'text_ad_threads_thread') {
    return {
      title: template.title,
      body: [
        `Launch prep gets messy fast when every channel needs a different version of the same story.`,
        `${product} helps teams ${value.toLowerCase()} from one source brief.`,
        `Useful if ${pain.toLowerCase()} keeps slowing down the work.`,
        `${cta}`,
      ].join('\n\n'),
    }
  }

  if (template.id === 'text_ad_threads_post') {
    return {
      title: template.title,
      body: `${pain} should not be the thing that delays launch week. ${product} helps teams ${value.toLowerCase()} from one clearer source brief. ${cta}`,
    }
  }

  return {
    title: template.title,
    body: `${pain}? ${product} helps teams ${value.toLowerCase()}. ${cta}`,
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
