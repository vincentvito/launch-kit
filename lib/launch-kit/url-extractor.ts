import { cleanText, dedupe, safeJsonParse } from '@/lib/launch-kit/utils'
import type { ExtractedBrief, KeywordCluster, KeywordPriority } from '@/lib/launch-kit/types'
import { hasReplicateToken, runReplicateStructured } from '@/lib/launch-kit/replicate'

type PageExtraction = {
  url: string
  title: string
  description: string
  headings: string[]
  bodyText: string[]
  ctas: string[]
  imageUrls: string[]
  links: string[]
}

type IngestInput = {
  url: string
  languageOverride?: string
}

type LlmBriefInsights = {
  productName?: string
  positioning?: string
  icp?: string
  targetUsers?: string[]
  painPoints?: string[]
  valueProps?: string[]
  keyClaims?: string[]
  proofPoints?: string[]
  cta?: string
  language?: string
}

type LlmKeywordCluster = {
  topic?: string
  intent?: string
  priority?: string
  keywords?: string[]
  contentAngles?: string[]
}

type LlmKeywordResearch = {
  notes?: string
  clusters?: LlmKeywordCluster[]
}

const MAX_PAGES = 5
const MAX_BODY_CHUNKS = 50
const MAX_HEADING_CHUNKS = 24
const MAX_LINE_LENGTH = 220

const CTA_BLOCKLIST = [
  'startups',
  'solutions',
  'resources',
  'pricing',
  'features',
  'product',
  'products',
  'customers',
  'docs',
  'documentation',
  'blog',
  'support',
  'login',
  'log in',
  'sign in',
  'careers',
  'about',
  'downloads',
  'download app',
  'templates',
  'enterprise',
]

const STRONG_CTA_PHRASES = [
  'get started',
  'start free',
  'try free',
  'request a demo',
  'book a demo',
  'sign up',
  'join waitlist',
  'create account',
  'get access',
  'get launch kit',
  'start a shoot',
  'begin a shoot',
  'make a card',
  'start here',
]

const CTA_ACTION_WORDS = [
  'get',
  'start',
  'try',
  'book',
  'request',
  'join',
  'begin',
  'make',
  'buy',
  'subscribe',
  'create',
  'launch',
  'download',
  'use',
]

const LINK_PRIORITY_HINTS = [
  '/product',
  '/products',
  '/pricing',
  '/feature',
  '/features',
  '/solution',
  '/use-case',
  '/about',
  '/platform',
  '/why',
]

const LINK_AVOID_HINTS = [
  '/blog',
  '/docs',
  '/documentation',
  '/help',
  '/support',
  '/privacy',
  '/terms',
  '/cookie',
  '/legal',
  '/status',
  '/careers',
  '/jobs',
  '/press',
  '/newsroom',
]

const BOILERPLATE_SNIPPETS = [
  'skip to main content',
  'all rights reserved',
  'privacy policy',
  'terms of service',
  'cookie policy',
  'copyright',
  'request a demo',
  'contact sales',
]

const NAV_WORDS = [
  'product',
  'products',
  'pricing',
  'resources',
  'docs',
  'templates',
  'blog',
  'developers',
  'help',
  'support',
  'about',
  'careers',
  'security',
  'login',
  'sign in',
]

const BRIEF_INSIGHTS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    icp: { type: 'string' },
    productName: { type: 'string' },
    positioning: { type: 'string' },
    targetUsers: { type: 'array', items: { type: 'string' } },
    painPoints: { type: 'array', items: { type: 'string' } },
    valueProps: { type: 'array', items: { type: 'string' } },
    keyClaims: { type: 'array', items: { type: 'string' } },
    proofPoints: { type: 'array', items: { type: 'string' } },
    cta: { type: 'string' },
    language: { type: 'string' },
  },
  required: [
    'productName',
    'positioning',
    'icp',
    'targetUsers',
    'painPoints',
    'valueProps',
    'keyClaims',
    'proofPoints',
    'cta',
    'language',
  ],
} as const

const KEYWORD_RESEARCH_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    notes: { type: 'string' },
    clusters: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          topic: { type: 'string' },
          intent: { type: 'string' },
          priority: { type: 'string' },
          keywords: { type: 'array', items: { type: 'string' } },
          contentAngles: { type: 'array', items: { type: 'string' } },
        },
        required: ['topic', 'intent', 'priority', 'keywords', 'contentAngles'],
      },
    },
  },
  required: ['notes', 'clusters'],
} as const

export async function ingestProductUrl(input: IngestInput): Promise<ExtractedBrief> {
  const normalizedUrl = normalizeUrl(input.url)
  const pages = await crawlSite(normalizedUrl)

  if (pages.length === 0) {
    throw new Error('Could not extract any content from URL')
  }

  const root = pages[0]

  const allHeadings = dedupe(
    pages
      .flatMap((page) => page.headings)
      .flatMap(splitCompositeLine)
      .map(cleanLine)
      .filter(isMeaningfulLine),
  ).slice(0, MAX_HEADING_CHUNKS)

  const allBody = dedupe(
    pages
      .flatMap((page) => page.bodyText)
      .flatMap(splitCompositeLine)
      .map(cleanLine)
      .filter(isMeaningfulLine),
  ).slice(0, MAX_BODY_CHUNKS)

  const allImages = dedupe(pages.flatMap((page) => page.imageUrls)).slice(0, 20)

  const scrapedProductName = pickProductName(root)
  const scrapedPositioning = pickPositioning(root, allHeadings, allBody)
  const detectedLanguage =
    input.languageOverride?.trim() ||
    detectLanguage([root.title, root.description, ...allHeadings, ...allBody])

  const highSignalBody = allBody.filter(isHighSignalEvidenceLine)
  const bodyForInference = highSignalBody.length >= 12 ? highSignalBody : allBody

  const sourceCorpus = dedupe([
    root.description,
    ...allHeadings,
    ...bodyForInference,
  ]).filter(Boolean)

  const ctaCandidates = dedupe(
    pages
      .flatMap((page) => page.ctas)
      .map(normalizeCtaText)
      .filter((value): value is string => Boolean(value)),
  )

  const heuristicTargetUsers = inferTargetUsers(sourceCorpus)
  const heuristicPainPoints = inferPainPoints(sourceCorpus)
  const heuristicValueProps = inferValueProps(sourceCorpus)
  const heuristicProofPoints = inferProofPoints(sourceCorpus)
  const heuristicCta =
    pickPrimaryCta(ctaCandidates, sourceCorpus) ||
    inferCtaFromCorpus(sourceCorpus) ||
    'Get started'
  const heuristicIcp = inferIcp(
    sourceCorpus,
    heuristicTargetUsers,
    heuristicPainPoints,
  )

  const llmInsights = await synthesizeBriefInsights({
    sourceUrl: normalizedUrl,
    productName: scrapedProductName,
    positioning: scrapedPositioning,
    language: detectedLanguage,
    headings: allHeadings,
    body: bodyForInference,
    ctaCandidates,
  })

  const productName = preferText(llmInsights?.productName, scrapedProductName, 90)
  const positioning = preferText(llmInsights?.positioning, scrapedPositioning, 280)
  const language = input.languageOverride?.trim() || normalizeLanguageCode(llmInsights?.language) || detectedLanguage
  const targetUsers = preferList(llmInsights?.targetUsers, heuristicTargetUsers, 6)
  const painPoints = preferList(llmInsights?.painPoints, heuristicPainPoints, 6)
  const valueProps = preferList(llmInsights?.valueProps, heuristicValueProps, 6)
  const keyClaims = preferList(
    llmInsights?.keyClaims,
    dedupe([...allHeadings.slice(0, 7), ...allBody.slice(0, 8)]),
    10,
  )
  const proofPoints = preferList(llmInsights?.proofPoints, heuristicProofPoints, 6)
  const icp = preferText(llmInsights?.icp, heuristicIcp, 220)
  const cta = preferCta(llmInsights?.cta, heuristicCta, ctaCandidates, sourceCorpus)
  const keywordResearch = await synthesizeKeywordResearch({
    sourceUrl: normalizedUrl,
    productName,
    positioning,
    language,
    sourceCorpus,
    targetUsers,
    painPoints,
    valueProps,
  })

  const highlights = dedupe([
    root.description,
    ...allHeadings,
    ...valueProps,
    ...proofPoints,
  ])
    .map(cleanLine)
    .filter(isMeaningfulLine)
    .slice(0, 12)

  return {
    sourceUrl: normalizedUrl,
    productName,
    positioning,
    targetUsers,
    icp,
    painPoints,
    valueProps,
    keyClaims,
    proofPoints,
    cta,
    language,
    sourceHighlights: highlights,
    detectedImageUrls: allImages,
    crawlPages: pages.map((page) => page.url),
    keywordResearch,
  }
}

async function crawlSite(startUrl: string): Promise<PageExtraction[]> {
  const start = new URL(startUrl)
  const queue: Array<{ url: string; score: number }> = [{
    url: start.toString(),
    score: 100,
  }]

  const visited = new Set<string>()
  const queued = new Set<string>([canonicalizeUrl(start.toString())])
  const pages: PageExtraction[] = []

  while (queue.length > 0 && pages.length < MAX_PAGES) {
    const next = queue.shift()
    if (!next) {
      continue
    }

    const canonicalTarget = canonicalizeUrl(next.url)
    queued.delete(canonicalTarget)

    if (visited.has(canonicalTarget)) {
      continue
    }

    visited.add(canonicalTarget)

    const page = await fetchAndExtract(next.url)
    if (!page) {
      continue
    }

    pages.push(page)

    for (const link of page.links) {
      const resolved = resolveUrl(link, page.url)
      if (!resolved) {
        continue
      }

      const candidate = new URL(resolved)
      if (candidate.hostname !== start.hostname) {
        continue
      }

      if (!isLikelyHtmlPage(candidate.pathname)) {
        continue
      }

      const canonical = canonicalizeUrl(candidate.toString())
      if (visited.has(canonical) || queued.has(canonical)) {
        continue
      }

      const score = scoreLinkForCrawl(candidate)
      if (score < -2) {
        continue
      }

      queue.push({
        url: candidate.toString(),
        score,
      })
      queued.add(canonical)
    }

    queue.sort((a, b) => b.score - a.score || a.url.length - b.url.length)
  }

  return pages
}

async function fetchAndExtract(url: string): Promise<PageExtraction | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'LaunchKitBot/1.0 (+https://clickstudio.dev)',
        accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    })

    if (!response.ok) {
      return null
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) {
      return null
    }

    const html = await response.text()
    if (!html.trim()) {
      return null
    }

    return extractFromHtml(url, html)
  } catch {
    return null
  }
}

function extractFromHtml(pageUrl: string, html: string): PageExtraction {
  const bodyHtml = firstMatch(html, /<body[^>]*>([\s\S]*?)<\/body>/i) || html
  const mainSections = collectTagInnerHtml(bodyHtml, 'main')
  const primaryContent = mainSections.length > 0 ? mainSections.join('\n') : bodyHtml

  const reducedHtml = stripSections(primaryContent, [
    'script',
    'style',
    'noscript',
    'svg',
    'nav',
    'header',
    'footer',
    'aside',
    'form',
    'menu',
    'dialog',
  ])

  const structuralHtml = stripSections(bodyHtml, [
    'script',
    'style',
    'noscript',
    'svg',
  ])

  const title = cleanLine(
    firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i) ||
      firstMatch(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i),
  )

  const description = cleanLine(
    firstMatch(
      html,
      /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i,
    ) ||
      firstMatch(
        html,
        /<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i,
      ),
  )

  const headings = dedupe([
    ...collectTagText(reducedHtml, ['h1', 'h2', 'h3']),
  ])
    .flatMap(splitCompositeLine)
    .map(cleanLine)
    .filter(isMeaningfulLine)
    .slice(0, MAX_HEADING_CHUNKS)

  const paragraphBlocks = dedupe([
    ...collectTagText(reducedHtml, ['p', 'li', 'blockquote']),
    ...extractTextLines(reducedHtml),
  ])
    .flatMap(splitCompositeLine)
    .map(cleanLine)
    .filter(isMeaningfulLine)
    .slice(0, MAX_BODY_CHUNKS)

  const anchors = collectAnchorData(structuralHtml)
  const buttonText = collectTagText(structuralHtml, ['button'])

  const ctaCandidates = dedupe([
    ...anchors.map((anchor) => anchor.text),
    ...buttonText,
  ])
    .map(normalizeCtaText)
    .filter((value): value is string => Boolean(value))

  const ctas = ctaCandidates
    .map((text) => ({ text, score: scoreCtaCandidate(text) }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((candidate) => candidate.text)
    .slice(0, 8)

  const links = dedupe(
    anchors
      .map((anchor) => resolveUrl(anchor.href, pageUrl))
      .filter((value): value is string => Boolean(value)),
  )

  const imageUrls = dedupe(
    collectTagAttribute(structuralHtml, 'img', 'src')
      .map((src) => resolveUrl(src, pageUrl))
      .filter((value): value is string => Boolean(value)),
  ).slice(0, 20)

  return {
    url: pageUrl,
    title,
    description,
    headings,
    bodyText: paragraphBlocks,
    ctas,
    imageUrls,
    links,
  }
}

function collectTagInnerHtml(html: string, tag: string): string[] {
  const pattern = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi')
  const values: string[] = []

  for (const match of html.matchAll(pattern)) {
    const value = match[1]
    if (value) {
      values.push(value)
    }
  }

  return values
}

function stripSections(html: string, tags: string[]): string {
  let next = html
  for (const tag of tags) {
    const pattern = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi')
    next = next.replace(pattern, ' ')
  }

  return next
}

function collectTagText(html: string, tags: string[]): string[] {
  const pattern = new RegExp(`<(${tags.join('|')})\\b[^>]*>([\\s\\S]*?)<\\/\\1>`, 'gi')
  const values: string[] = []

  for (const match of html.matchAll(pattern)) {
    const raw = match[2] || ''
    const value = cleanLine(stripHtml(raw))
    if (value) {
      values.push(value)
    }
  }

  return values
}

function collectTagAttribute(html: string, tag: string, attribute: string): string[] {
  const pattern = new RegExp(`<${tag}\\b[^>]*${attribute}=["']([^"']+)["'][^>]*>`, 'gi')
  const values: string[] = []

  for (const match of html.matchAll(pattern)) {
    if (match[1]) {
      values.push(match[1].trim())
    }
  }

  return values
}

function collectAnchorData(html: string): Array<{ href: string; text: string }> {
  const pattern = /<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  const anchors: Array<{ href: string; text: string }> = []

  for (const match of html.matchAll(pattern)) {
    const href = match[1]?.trim()
    const text = cleanLine(stripHtml(match[2] || ''))

    if (!href || !text) {
      continue
    }

    anchors.push({ href, text })
  }

  return anchors
}

function extractTextLines(html: string): string[] {
  const withBreaks = html
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(p|li|div|section|article|h1|h2|h3|h4|h5|h6)>/gi, '\n')

  const text = stripHtml(withBreaks)

  return text
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean)
}

function splitCompositeLine(input: string): string[] {
  const value = cleanLine(input)
  if (!value) {
    return []
  }

  if (value.length <= MAX_LINE_LENGTH) {
    return [value]
  }

  const segments = value
    .split(/(?:\s[|•·]\s|\s→\s|\s-\s|\s—\s)/)
    .map(cleanLine)
    .filter(Boolean)

  if (segments.length > 1) {
    return segments.filter((segment) => segment.length <= MAX_LINE_LENGTH)
  }

  return []
}

function resolveUrl(candidate: string, base: string): string | null {
  if (!candidate || candidate.startsWith('#') || candidate.startsWith('mailto:') || candidate.startsWith('tel:')) {
    return null
  }

  try {
    const url = new URL(candidate, base)
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null
    }

    return url.toString()
  } catch {
    return null
  }
}

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

function firstMatch(input: string, regex: RegExp): string {
  const match = input.match(regex)
  return match?.[1] || ''
}

function cleanLine(value: string): string {
  return cleanText(value)
    .replace(/\s+/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
}

function isMeaningfulLine(line: string): boolean {
  if (!line) {
    return false
  }

  if (line.length < 24 || line.length > MAX_LINE_LENGTH) {
    return false
  }

  const lower = line.toLowerCase()

  if (BOILERPLATE_SNIPPETS.some((snippet) => lower.includes(snippet))) {
    return false
  }

  if (isMostlyNavWords(lower)) {
    return false
  }

  if (!isHighSignalEvidenceLine(line)) {
    return false
  }

  if (/^(home|pricing|features|resources|support|docs|about|blog)$/i.test(line)) {
    return false
  }

  const wordCount = lower.split(/\s+/).length
  if (wordCount < 4) {
    return false
  }

  return true
}

function isHighSignalEvidenceLine(line: string): boolean {
  const lower = line.toLowerCase()

  // Filter feed-like crumbs and activity snippets that pollute brief extraction.
  if (/\b\d{1,2}:\d{2}\b/.test(line)) {
    return false
  }

  if (/^[@#]/.test(line.trim())) {
    return false
  }

  if (line.length < 56 && /[·•|]/.test(line)) {
    return false
  }

  if (
    lower.includes('shipped v') ||
    lower.includes('weekly call') ||
    lower.includes('honest feedback only') ||
    lower.includes('equal equity') ||
    lower.includes('async-first')
  ) {
    return false
  }

  return true
}

function isMostlyNavWords(lowerLine: string): boolean {
  const words = lowerLine.split(/\s+/)
  const navHits = words.filter((word) =>
    NAV_WORDS.some((navWord) => navWord.includes(word) || word.includes(navWord)),
  ).length

  if (words.length <= 6 && navHits >= 2) {
    return true
  }

  return words.length > 0 && navHits / words.length > 0.42
}

function normalizeCtaText(value: string): string | null {
  const text = cleanLine(value).replace(/[.:]+$/, '')
  if (!text) {
    return null
  }

  const wordCount = text.split(/\s+/).length
  if (wordCount < 1 || wordCount > 10) {
    return null
  }

  if (text.length > 70) {
    return null
  }

  return text
}

function scoreCtaCandidate(text: string): number {
  const lower = text.toLowerCase()
  let score = 0

  for (const phrase of STRONG_CTA_PHRASES) {
    if (lower.includes(phrase)) {
      score += 12
    }
  }

  for (const word of CTA_ACTION_WORDS) {
    if (new RegExp(`\\b${escapeRegex(word)}\\b`, 'i').test(lower)) {
      score += 3
    }
  }

  for (const blocked of CTA_BLOCKLIST) {
    if (new RegExp(`\\b${escapeRegex(blocked)}\\b`, 'i').test(lower)) {
      score -= 14
    }
  }

  const words = lower.split(/\s+/)
  if (words.length > 7) {
    score -= 6
  }

  if (!CTA_ACTION_WORDS.some((word) => new RegExp(`\\b${escapeRegex(word)}\\b`, 'i').test(lower))) {
    score -= 8
  }

  return score
}

function pickPrimaryCta(candidates: string[], corpus: string[]): string | null {
  const scored = candidates
    .map((text) => ({ text, score: scoreCtaCandidate(text) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  if (scored.length > 0) {
    return scored[0].text
  }

  return inferCtaFromCorpus(corpus)
}

function inferCtaFromCorpus(corpus: string[]): string | null {
  const joined = corpus.join(' \n ').toLowerCase()

  for (const phrase of STRONG_CTA_PHRASES) {
    if (joined.includes(phrase)) {
      return phrase
        .split(' ')
        .map((word, index) => (index === 0 ? capitalize(word) : word))
        .join(' ')
    }
  }

  return null
}

function pickProductName(root: PageExtraction): string {
  const title = root.title.trim()
  if (!title) {
    return 'Untitled Product'
  }

  const separators = ['|', '-', '—', '•']
  for (const separator of separators) {
    if (title.includes(separator)) {
      const parts = title.split(separator).map((part) => cleanLine(part)).filter(Boolean)
      const first = parts[0]
      const last = parts[parts.length - 1]
      if (first && last && looksLikeSeoCategory(first) && !looksLikeSeoCategory(last)) {
        return last
      }

      if (first && first.length > 1) {
        return first
      }
    }
  }

  return title
}

function looksLikeSeoCategory(value: string): boolean {
  const lower = value.toLowerCase()
  return [
    'generator',
    'software',
    'tool',
    'platform',
    'app',
    'service',
    'solution',
  ].some((word) => lower.includes(word))
}

function pickPositioning(root: PageExtraction, headings: string[], body: string[]): string {
  if (root.description) {
    return root.description
  }

  const candidates = [...headings, ...body]
  const firstLong = candidates.find((line) => line.length > 40)
  if (firstLong) {
    return firstLong
  }

  if (headings.length > 0) {
    return headings[0]
  }

  if (body.length > 0) {
    return body[0]
  }

  return 'A product built for modern teams.'
}

function inferTargetUsers(lines: string[]): string[] {
  const dictionary: Array<{ label: string; keywords: string[] }> = [
    { label: 'Families', keywords: ['family', 'families', 'family portrait', 'family photo'] },
    { label: 'Parents', keywords: ['parent', 'parents', 'kids', 'children', 'toddler'] },
    { label: 'Gift buyers', keywords: ['gift', 'partner', 'grandparent', 'friend'] },
    { label: 'Holiday card senders', keywords: ['holiday card', 'christmas card', 'greeting card'] },
    { label: 'Photographers', keywords: ['photographer', 'photo studio', 'studio portrait'] },
    { label: 'Startup founders', keywords: ['founder', 'startup', 'indie hacker'] },
    { label: 'Developers', keywords: ['developer', 'engineer', 'dev team', 'technical team'] },
    { label: 'Designers', keywords: ['designer', 'design team', 'ui', 'ux'] },
    { label: 'Product teams', keywords: ['product team', 'product manager', 'pm'] },
    { label: 'Marketing teams', keywords: ['marketing', 'growth', 'brand team'] },
    { label: 'Sales teams', keywords: ['sales', 'revenue team'] },
    { label: 'Support teams', keywords: ['support', 'customer success'] },
    { label: 'Agencies', keywords: ['agency', 'client work'] },
    { label: 'Creators', keywords: ['creator', 'content creator'] },
    { label: 'Enterprise teams', keywords: ['enterprise', 'large organization'] },
    { label: 'Small businesses', keywords: ['small business', 'smb'] },
  ]

  const joined = lines.join(' ').toLowerCase()
  const scored = dictionary
    .map((entry) => ({
      label: entry.label,
      score: entry.keywords.reduce((sum, keyword) => {
        if (joined.includes(keyword)) {
          return sum + 1
        }

        return sum
      }, 0),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.label)

  if (scored.length === 0) {
    return ['Product teams']
  }

  return dedupe(scored).slice(0, 6)
}

function inferPainPoints(lines: string[]): string[] {
  const patterns = [
    /\bmanual\b/i,
    /\bslow\b/i,
    /\bfragmented\b/i,
    /\bdifficult\b/i,
    /\bhard\b/i,
    /\bstruggl(e|ing|es)?\b/i,
    /\btime[- ]consuming\b/i,
    /\bcontext[- ]switch(ing)?\b/i,
    /\binconsistent\b/i,
    /\bdisconnected\b/i,
    /\bno perfect\b/i,
    /\bnobody is looking\b/i,
    /\bseparate photos\b/i,
    /\bscattered\b/i,
    /\bnot in the same\b/i,
    /\bno studio date\b/i,
    /\bmatching outfits\b/i,
    /\bimpossible to shop\b/i,
  ]

  const candidates = lines
    .filter((line) => patterns.some((pattern) => pattern.test(line)))
    .map(compactSentence)
    .filter(isHighQualityPainPoint)

  if (candidates.length > 0) {
    return dedupe(candidates).slice(0, 6)
  }

  return lines
    .filter((line) => /\bwithout\b|\bneed\b|\bproblem\b|\bmiss\b|\bhard\b|\bdifficult\b/i.test(line))
    .map(compactSentence)
    .filter(isHighQualityPainPoint)
    .slice(0, 6)
}

function inferValueProps(lines: string[]): string[] {
  const keywords = [
    'automate',
    'faster',
    'streamline',
    'save',
    'all in one',
    'one place',
    'collaborate',
    'ship',
    'reduce',
    'improve',
    'centralize',
    'turn',
    'create',
    'upload',
    'pick',
    'professional',
    'print-ready',
    'downloadable',
    'portrait',
    'card',
    'combine',
    'keepsake',
  ]

  const candidates = lines
    .filter((line) => keywords.some((keyword) => line.toLowerCase().includes(keyword)))
    .map(compactSentence)

  if (candidates.length === 0) {
    return lines
      .filter((line) => /\bready\b|\babout\b|\bminutes?\b|\bwithout\b|\bfrom\b/i.test(line))
      .map(compactSentence)
      .filter((line) => line.length >= 16)
      .slice(0, 6)
  }

  return dedupe(candidates).slice(0, 6)
}

function inferProofPoints(lines: string[]): string[] {
  const proofCandidates = lines.filter((line) => {
    const lower = line.toLowerCase()
    if (lower.includes('/mo') || lower.includes('monthly') || lower.includes('annual')) {
      return false
    }

    return (
      /\d/.test(lower) ||
      lower.includes('trusted by') ||
      lower.includes('customers') ||
      lower.includes('case study') ||
      lower.includes('forbes') ||
      lower.includes('g2') ||
      lower.includes('million') ||
      lower.includes('k users')
    )
  })

  return dedupe(proofCandidates.map(compactSentence)).slice(0, 6)
}

function inferIcp(lines: string[], targetUsers: string[], painPoints: string[]): string {
  const audience = targetUsers.slice(0, 3).join(', ') || 'People evaluating this product'
  const topPain =
    painPoints.find(isHighQualityPainPoint) ||
    lines.find((line) => line.length > 40) ||
    'need a clearer way to get the promised outcome.'

  const cleanedPain = topPain.endsWith('.') ? topPain.slice(0, -1) : topPain
  return `${audience} who ${painToIcpClause(cleanedPain)}.`
}

async function synthesizeBriefInsights(input: {
  sourceUrl: string
  productName: string
  positioning: string
  language: string
  headings: string[]
  body: string[]
  ctaCandidates: string[]
}): Promise<LlmBriefInsights | null> {
  if (hasReplicateToken()) {
    const replicateOutput = await runReplicateStructured<LlmBriefInsights>({
      instructions: [
        'You are a product marketing analyst.',
        'Extract a concise launch brief for the actual product in the source evidence.',
        'Reason from the scraped page like a senior positioning strategist before writing.',
        'This is not necessarily a SaaS product. It may be consumer, ecommerce, media, services, or B2B.',
        'Do not output navigation labels or boilerplate.',
        'Ground output in evidence. Avoid generic filler.',
        'Do not mention launch messaging, founders, startups, designers, or platform copy unless the evidence clearly says that.',
        'Output keys: productName, positioning, icp, targetUsers, painPoints, valueProps, keyClaims, proofPoints, cta, language.',
        'Constraints:',
        '- productName: brand or product name, not a generic SEO category unless no brand exists.',
        '- positioning: one clear sentence, max 220 chars.',
        '- icp: one sentence, max 220 chars.',
        '- targetUsers: array of 3-6 concrete buyer/user segments.',
        '- painPoints: array of 3-6 specific frustrations the product solves.',
        '- valueProps: array of 3-6 concrete benefits tied to source evidence.',
        '- keyClaims: array of 4-8 source-grounded product claims.',
        '- proofPoints: array of up to 5 factual signals from source (numbers, prices, ratings, testimonials, privacy promises, recognitions).',
        '- cta: 2-8 words, imperative.',
        '- language: ISO code such as en, es, fr, de, it, pt.',
      ].join('\n'),
      prompt: JSON.stringify(
        {
          sourceUrl: input.sourceUrl,
          language: input.language,
          productName: input.productName,
          positioning: input.positioning,
          headings: input.headings.slice(0, 40),
          body: input.body.slice(0, 80),
          ctaCandidates: input.ctaCandidates.slice(0, 12),
        },
        null,
        2,
      ),
      jsonSchema: BRIEF_INSIGHTS_SCHEMA as unknown as Record<string, unknown>,
      schemaName: 'brief_insights',
      modelVariant: process.env.REPLICATE_OPENAI_MODEL || 'gpt-5',
      maxOutputTokens: 12000,
      reasoningEffort: 'medium',
      verbosity: 'high',
    })

    if (replicateOutput) {
      return {
        productName: normalizeInsightText(replicateOutput.productName, 90),
        positioning: normalizeInsightText(replicateOutput.positioning, 280),
        icp: normalizeInsightText(replicateOutput.icp, 220),
        targetUsers: sanitizeInsightList(replicateOutput.targetUsers, 6),
        painPoints: sanitizeInsightList(replicateOutput.painPoints, 6),
        valueProps: sanitizeInsightList(replicateOutput.valueProps, 6),
        keyClaims: sanitizeInsightList(replicateOutput.keyClaims, 8),
        proofPoints: sanitizeInsightList(replicateOutput.proofPoints, 5),
        cta: normalizeCtaText(replicateOutput.cta || '') || undefined,
        language: normalizeLanguageCode(replicateOutput.language),
      }
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    return null
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini'

  const payload = {
    model,
    temperature: 0.2,
    max_output_tokens: 1400,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: [
              'You are a product marketing analyst.',
              'Extract a concise launch brief for the actual product in the source evidence.',
              'Reason from the scraped page like a senior positioning strategist before writing.',
              'This is not necessarily a SaaS product. It may be consumer, ecommerce, media, services, or B2B.',
              'Do not output navigation labels or boilerplate.',
              'Ground output in evidence. Avoid generic filler.',
              'Return valid JSON only.',
              'Do not mention launch messaging, founders, startups, designers, or platform copy unless the evidence clearly says that.',
              'Output keys: productName, positioning, icp, targetUsers, painPoints, valueProps, keyClaims, proofPoints, cta, language.',
              'Constraints:',
              '- productName: brand or product name, not a generic SEO category unless no brand exists.',
              '- positioning: one clear sentence, max 220 chars.',
              '- icp: one sentence, max 220 chars.',
              '- targetUsers: array of 3-6 concrete buyer/user segments.',
              '- painPoints: array of 3-6 specific frustrations the product solves.',
              '- valueProps: array of 3-6 concrete benefits tied to source evidence.',
              '- keyClaims: array of 4-8 source-grounded product claims.',
              '- proofPoints: array of up to 5 factual signals from source (numbers, prices, ratings, testimonials, privacy promises, recognitions).',
              '- cta: 2-8 words, imperative (e.g., "Start free", "Request a demo").',
              '- language: ISO code such as en, es, fr, de, it, pt.',
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
                sourceUrl: input.sourceUrl,
                language: input.language,
                productName: input.productName,
                positioning: input.positioning,
                headings: input.headings.slice(0, 40),
                body: input.body.slice(0, 80),
                ctaCandidates: input.ctaCandidates.slice(0, 12),
              },
              null,
              2,
            ),
          },
        ],
      },
    ],
  }

  try {
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
      return null
    }

    const raw = (await response.json()) as { output_text?: string }
    const parsed = parseLlmInsightJson(raw.output_text || '')
    if (!parsed) {
      return null
    }

    return {
      productName: normalizeInsightText(parsed.productName, 90),
      positioning: normalizeInsightText(parsed.positioning, 280),
      icp: normalizeInsightText(parsed.icp, 220),
      targetUsers: sanitizeInsightList(parsed.targetUsers, 6),
      painPoints: sanitizeInsightList(parsed.painPoints, 6),
      valueProps: sanitizeInsightList(parsed.valueProps, 6),
      keyClaims: sanitizeInsightList(parsed.keyClaims, 8),
      proofPoints: sanitizeInsightList(parsed.proofPoints, 5),
      cta: normalizeCtaText(parsed.cta || '') || undefined,
      language: normalizeLanguageCode(parsed.language),
    }
  } catch {
    return null
  }
}

function parseLlmInsightJson(input: string): LlmBriefInsights | null {
  const direct = safeJsonParse<LlmBriefInsights | null>(input, null)
  if (direct) {
    return direct
  }

  const start = input.indexOf('{')
  const end = input.lastIndexOf('}')
  if (start < 0 || end <= start) {
    return null
  }

  return safeJsonParse<LlmBriefInsights | null>(input.slice(start, end + 1), null)
}

function sanitizeInsightList(input: unknown, maxItems: number): string[] {
  if (!Array.isArray(input)) {
    return []
  }

  return dedupe(
    input
      .map((item) => (typeof item === 'string' ? compactSentence(item) : ''))
      .map(cleanLine)
      .filter((item) => item.length >= 8 && item.length <= MAX_LINE_LENGTH)
      .filter((item) => !isMostlyNavWords(item.toLowerCase())),
  ).slice(0, maxItems)
}

function preferList(candidate: string[] | undefined, fallback: string[], maxItems: number): string[] {
  if (candidate && candidate.length > 0) {
    const sanitizedCandidate = sanitizeInsightList(candidate, maxItems)
    if (sanitizedCandidate.length > 0) {
      return sanitizedCandidate
    }
  }

  return dedupe(fallback.map(compactSentence)).slice(0, maxItems)
}

function normalizeInsightText(value: unknown, maxChars: number): string {
  if (typeof value !== 'string') {
    return ''
  }

  return compactSentence(value).slice(0, maxChars)
}

function preferText(candidate: string | undefined, fallback: string, maxChars: number): string {
  const normalized = normalizeInsightText(candidate, maxChars)
  if (normalized) {
    return normalized
  }

  return fallback.slice(0, maxChars)
}

function preferCta(
  candidate: string | undefined,
  fallback: string,
  ctaCandidates: string[],
  corpus: string[],
): string {
  const direct = normalizeCtaText(candidate || '')
  if (direct && scoreCtaCandidate(direct) > 0) {
    return direct
  }

  return pickPrimaryCta(ctaCandidates, corpus) || fallback
}

async function synthesizeKeywordResearch(input: {
  sourceUrl: string
  productName: string
  positioning: string
  language: string
  sourceCorpus: string[]
  targetUsers: string[]
  painPoints: string[]
  valueProps: string[]
}): Promise<ExtractedBrief['keywordResearch']> {
  const heuristic = buildHeuristicKeywordResearch(input)
  if (hasReplicateToken()) {
    const replicateOutput = await runReplicateStructured<LlmKeywordResearch>({
      instructions: [
        'You are an SEO strategist for B2B SaaS launches.',
        'Generate keyword clusters from source evidence and product brief fields.',
        'Output keys: notes, clusters.',
        'clusters: array of 3-6 items with keys: topic, intent, priority, keywords, contentAngles.',
        'intent allowed values: informational, commercial, transactional, navigational.',
        'priority allowed values: high, medium, low.',
        'keywords: 3-8 phrases per cluster.',
        'contentAngles: 2-4 concrete post angles per cluster.',
        'No fabricated volume metrics. No generic filler.',
      ].join('\n'),
      prompt: JSON.stringify(
        {
          sourceUrl: input.sourceUrl,
          language: input.language,
          productName: input.productName,
          positioning: input.positioning,
          targetUsers: input.targetUsers.slice(0, 6),
          painPoints: input.painPoints.slice(0, 6),
          valueProps: input.valueProps.slice(0, 6),
          sourceEvidence: input.sourceCorpus.slice(0, 90),
        },
        null,
        2,
      ),
      jsonSchema: KEYWORD_RESEARCH_SCHEMA as unknown as Record<string, unknown>,
      schemaName: 'keyword_research',
      modelVariant: process.env.REPLICATE_OPENAI_MODEL || 'gpt-5',
      maxOutputTokens: 14000,
      reasoningEffort: 'medium',
      verbosity: 'high',
    })

    if (replicateOutput) {
      const clusters = normalizeKeywordClusters(replicateOutput.clusters, input.productName)
      if (clusters.length > 0) {
        return {
          generatedAt: new Date().toISOString(),
          notes: cleanLine(replicateOutput.notes || '') || heuristic.notes,
          clusters: clusters.slice(0, 6),
        }
      }
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    return heuristic
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini'
  const payload = {
    model,
    temperature: 0.3,
    max_output_tokens: 1800,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: [
              'You are an SEO strategist for B2B SaaS launches.',
              'Generate keyword clusters from source evidence and product brief fields.',
              'Return valid JSON only.',
              'Output keys: notes, clusters.',
              'clusters: array of 3-6 items with keys: topic, intent, priority, keywords, contentAngles.',
              'intent allowed values: informational, commercial, transactional, navigational.',
              'priority allowed values: high, medium, low.',
              'keywords: 3-8 phrases per cluster.',
              'contentAngles: 2-4 concrete post angles per cluster.',
              'No fabricated volume metrics. No generic filler.',
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
                sourceUrl: input.sourceUrl,
                language: input.language,
                productName: input.productName,
                positioning: input.positioning,
                targetUsers: input.targetUsers.slice(0, 6),
                painPoints: input.painPoints.slice(0, 6),
                valueProps: input.valueProps.slice(0, 6),
                sourceEvidence: input.sourceCorpus.slice(0, 90),
              },
              null,
              2,
            ),
          },
        ],
      },
    ],
  }

  try {
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
      return heuristic
    }

    const raw = (await response.json()) as { output_text?: string }
    const parsed = parseKeywordResearchJson(raw.output_text || '')
    if (!parsed) {
      return heuristic
    }

    const clusters = normalizeKeywordClusters(parsed.clusters, input.productName)
    if (clusters.length === 0) {
      return heuristic
    }

    return {
      generatedAt: new Date().toISOString(),
      notes: cleanLine(parsed.notes || '') || heuristic.notes,
      clusters: clusters.slice(0, 6),
    }
  } catch {
    return heuristic
  }
}

function buildHeuristicKeywordResearch(input: {
  productName: string
  positioning: string
  targetUsers: string[]
  painPoints: string[]
  valueProps: string[]
}): ExtractedBrief['keywordResearch'] {
  const audienceSeed = input.targetUsers[0] || 'buyers'
  const primaryPain = input.painPoints[0] || input.positioning
  const primaryValue = input.valueProps[0] || input.positioning
  const baseName = input.productName.toLowerCase()
  const categorySeed = extractKeywordSeed(input.positioning) || baseName

  const clusters: KeywordCluster[] = [
    {
      id: 'kw-product-category',
      topic: `${input.productName} category demand`,
      intent: 'commercial',
      priority: 'high',
      keywords: dedupe([
        baseName,
        categorySeed,
        `${categorySeed} pricing`,
        `${categorySeed} reviews`,
      ]).slice(0, 6),
      contentAngles: [
        `How ${input.productName} helps ${audienceSeed}`,
        `What to know before choosing ${categorySeed}`,
      ],
    },
    {
      id: 'kw-problem-solution',
      topic: `Solving ${lowercaseFirst(primaryPain)}`,
      intent: 'informational',
      priority: 'high',
      keywords: dedupe([
        lowercaseFirst(primaryPain),
        `${categorySeed} for ${audienceSeed.toLowerCase()}`,
        `how to ${lowercaseFirst(primaryValue)}`,
      ]).slice(0, 6),
      contentAngles: [
        `How ${audienceSeed} handle ${lowercaseFirst(primaryPain)}`,
        `A practical guide to ${lowercaseFirst(primaryValue)}`,
      ],
    },
    {
      id: 'kw-outcome',
      topic: `Getting ${lowercaseFirst(primaryValue)}`,
      intent: 'commercial',
      priority: 'medium',
      keywords: dedupe([
        lowercaseFirst(primaryValue),
        `${baseName} ${categorySeed}`,
        `best ${categorySeed}`,
      ]).slice(0, 6),
      contentAngles: [
        `Why ${lowercaseFirst(primaryValue)} matters`,
        `${input.productName} use cases by audience`,
      ],
    },
  ]

  return {
    generatedAt: new Date().toISOString(),
    notes: 'Keyword clusters generated from product brief signals (no external volume metrics).',
    clusters,
  }
}

function extractKeywordSeed(input: string): string {
  const lower = input.toLowerCase()
  const candidates = lower.match(/[a-z][a-z0-9]+(?: [a-z][a-z0-9]+){1,4}/g) || []
  return candidates
    .map((candidate) => cleanLine(candidate))
    .find((candidate) => candidate.length >= 10 && !candidate.startsWith('turn ')) || ''
}

function parseKeywordResearchJson(input: string): LlmKeywordResearch | null {
  const direct = safeJsonParse<LlmKeywordResearch | null>(input, null)
  if (direct) {
    return direct
  }

  const start = input.indexOf('{')
  const end = input.lastIndexOf('}')
  if (start < 0 || end <= start) {
    return null
  }

  return safeJsonParse<LlmKeywordResearch | null>(input.slice(start, end + 1), null)
}

function normalizeKeywordClusters(input: unknown, productName: string): KeywordCluster[] {
  if (!Array.isArray(input)) {
    return []
  }

  const clusters: KeywordCluster[] = []
  for (const [index, item] of input.entries()) {
    if (!item || typeof item !== 'object') {
      continue
    }

    const entry = item as LlmKeywordCluster
    const topic = cleanLine(entry.topic || '')
    if (!topic) {
      continue
    }

    const keywords = sanitizeInsightList(entry.keywords, 8).slice(0, 8)
    const contentAngles = sanitizeInsightList(entry.contentAngles, 4).slice(0, 4)
    const intent = normalizeKeywordIntent(entry.intent)
    const priority = normalizeKeywordPriority(entry.priority)

    clusters.push({
      id: `kw-${slugify(topic)}-${index + 1}`,
      topic,
      intent,
      priority,
      keywords: keywords.length > 0 ? keywords : [`${productName.toLowerCase()} ${topic.toLowerCase()}`],
      contentAngles: contentAngles.length > 0 ? contentAngles : ['Practical implementation guide'],
    })
  }

  return clusters
}

function normalizeKeywordIntent(input: unknown): KeywordCluster['intent'] {
  const value = typeof input === 'string' ? input.toLowerCase().trim() : ''
  if (value === 'informational' || value === 'commercial' || value === 'transactional' || value === 'navigational') {
    return value
  }

  return 'informational'
}

function normalizeKeywordPriority(input: unknown): KeywordPriority {
  const value = typeof input === 'string' ? input.toLowerCase().trim() : ''
  if (value === 'high' || value === 'medium' || value === 'low') {
    return value
  }

  return 'medium'
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function compactSentence(line: string): string {
  const text = cleanLine(line)
  if (!text) {
    return ''
  }

  const segments = text
    .split(/(?:;|\|)/)
    .map(cleanLine)
    .filter(Boolean)

  if (segments.length > 0 && segments[0].length >= 12) {
    return segments[0]
  }

  return text
}

function detectLanguage(input: string[]): string {
  const text = input.join(' ').toLowerCase()

  const spanishSignals = [
    ' para ',
    ' con ',
    ' que ',
    ' los ',
    ' las ',
    ' una ',
    ' este ',
    ' esta ',
    ' de ',
    ' y ',
  ]

  let spanishHits = 0
  for (const signal of spanishSignals) {
    if (text.includes(signal)) {
      spanishHits += 1
    }
  }

  return spanishHits >= 4 ? 'es' : 'en'
}

function normalizeLanguageCode(input: unknown): string {
  if (typeof input !== 'string') {
    return ''
  }

  const value = input.toLowerCase().trim()
  const match = value.match(/^[a-z]{2}(?:-[a-z]{2})?$/)
  return match ? value : ''
}

function isLikelyHtmlPage(pathname: string): boolean {
  const lowered = pathname.toLowerCase()
  const blockedExtensions = [
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.webp',
    '.pdf',
    '.zip',
    '.mp4',
    '.mp3',
    '.ico',
    '.xml',
    '.json',
  ]
  return !blockedExtensions.some((extension) => lowered.endsWith(extension))
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new Error('URL is required')
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  const parsed = new URL(withProtocol)
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP(S) URLs are supported')
  }

  parsed.hash = ''
  return parsed.toString()
}

function canonicalizeUrl(input: string): string {
  const url = new URL(input)
  url.hash = ''
  url.search = ''
  const normalizedPath = url.pathname.replace(/\/$/, '') || '/'
  return `${url.origin}${normalizedPath}`
}

function scoreLinkForCrawl(url: URL): number {
  const path = url.pathname.toLowerCase()
  let score = 0

  for (const hint of LINK_PRIORITY_HINTS) {
    if (path.includes(hint)) {
      score += 6
    }
  }

  for (const hint of LINK_AVOID_HINTS) {
    if (path.includes(hint)) {
      score -= 8
    }
  }

  if (path === '/' || path.split('/').filter(Boolean).length <= 2) {
    score += 2
  }

  if (url.search) {
    score -= 2
  }

  return score
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function capitalize(input: string): string {
  if (!input) {
    return input
  }

  return input[0].toUpperCase() + input.slice(1)
}

function lowercaseFirst(input: string): string {
  if (!input) {
    return input
  }

  return input[0].toLowerCase() + input.slice(1)
}

function painToIcpClause(input: string): string {
  const lower = input.toLowerCase()
  if (lower.startsWith('need ') || lower.startsWith('struggle') || lower.startsWith('have ')) {
    return lowercaseFirst(input)
  }

  return `struggle with ${lowercaseFirst(input)}`
}

function isHighQualityPainPoint(input: string): boolean {
  const line = cleanLine(input)
  if (!line) {
    return false
  }

  if (line.length < 24 || line.length > 150) {
    return false
  }

  const lower = line.toLowerCase()
  if (lower.includes('trusted by') || lower.includes('forbes') || lower.includes('g2')) {
    return false
  }

  if (line.includes('“') || line.includes('”') || line.includes('"')) {
    return false
  }

  return true
}
