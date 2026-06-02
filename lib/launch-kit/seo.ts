import {
  type BacklinkProspect,
  type BacklinkProspectStatus,
  type BlogStrategyPost,
  type ExtractedBrief,
  type FreeToolSuggestion,
  type KeywordCluster,
  type SeoGrowthState,
  type WebsiteSeoCheck,
} from '@/lib/launch-kit/types'
import { normalizeSeoGrowthState } from '@/lib/launch-kit/normalizers'
import { dedupe, escapeCsvCell } from '@/lib/launch-kit/utils'

type BacklinkDiscoveryEntity = {
  title: string
  website: string
  summary: string
  source: string
  estimatedTraffic: number | null
  costToList: number | null
  contactName: string
  contactEmail: string
  authorityScore: number
  relevanceScore: number
  backlinkAngle: string
}

type BacklinkDiscoveryProvider = {
  discover: (queries: string[]) => Promise<{
    entities: BacklinkDiscoveryEntity[]
    providerName: string
    note?: string
  }>
}

type DeliveryState = {
  configured: boolean
  delivered: boolean
}

type SendBacklinkEmailInput = {
  seoGrowth: SeoGrowthState | null | undefined
  prospectIds?: string[]
}

const MAX_BLOG_POSTS = 12
const MAX_BACKLINK_PROSPECTS = 80
const MAX_BACKLINK_EMAIL_JOBS = 80

const BACKLINK_STATUSES: BacklinkProspectStatus[] = [
  'new',
  'first_contact',
  'second_contact',
  'in_negotiation',
  'closed',
  'rejected',
]

const MOCK_BACKLINK_SITES = [
  {
    title: 'SaaS Worthy',
    website: 'https://www.saasworthy.com',
    summary: 'SaaS comparison directory with category pages and product listings.',
    categories: ['saas', 'software', 'tools', 'reviews'],
    estimatedTraffic: 140000,
    costToList: null,
    contactName: 'Editorial Team',
    contactEmail: 'partners@saasworthy.com',
    authorityScore: 76,
    backlinkAngle: 'Product listing and category comparison mention',
  },
  {
    title: 'AlternativeTo',
    website: 'https://alternativeto.net',
    summary: 'Software alternatives directory used by buyers comparing tools.',
    categories: ['software', 'alternatives', 'reviews', 'tools'],
    estimatedTraffic: 2200000,
    costToList: 0,
    contactName: 'Listings Team',
    contactEmail: '',
    authorityScore: 88,
    backlinkAngle: 'Alternative listing for buyers searching comparable tools',
  },
  {
    title: 'Indie Hackers',
    website: 'https://www.indiehackers.com',
    summary: 'Founder community with product stories, launch posts, and build-in-public content.',
    categories: ['founders', 'startup', 'saas', 'indie hackers'],
    estimatedTraffic: 310000,
    costToList: 0,
    contactName: 'Community Team',
    contactEmail: '',
    authorityScore: 82,
    backlinkAngle: 'Founder story or launch teardown with useful workflow examples',
  },
  {
    title: 'GrowthMentor Blog',
    website: 'https://www.growthmentor.com/blog',
    summary: 'Marketing and growth blog covering acquisition, SEO, and startup execution.',
    categories: ['marketing', 'growth', 'seo', 'startup'],
    estimatedTraffic: 74000,
    costToList: null,
    contactName: 'Content Team',
    contactEmail: 'content@growthmentor.com',
    authorityScore: 70,
    backlinkAngle: 'Guest contribution with a practical distribution workflow',
  },
  {
    title: 'BetaList',
    website: 'https://betalist.com',
    summary: 'Startup discovery platform for early adopters and new product launches.',
    categories: ['startup', 'launch', 'early adopters', 'saas'],
    estimatedTraffic: 91000,
    costToList: 129,
    contactName: 'Listings Team',
    contactEmail: 'hello@betalist.com',
    authorityScore: 73,
    backlinkAngle: 'Launch listing with product positioning and founder context',
  },
  {
    title: 'Startup Stash',
    website: 'https://startupstash.com',
    summary: 'Curated startup tool directory grouped by startup workflow categories.',
    categories: ['startup tools', 'directories', 'saas', 'marketing'],
    estimatedTraffic: 120000,
    costToList: 299,
    contactName: 'Partnerships',
    contactEmail: 'hello@startupstash.com',
    authorityScore: 74,
    backlinkAngle: 'Tool directory listing for the most relevant workflow category',
  },
  {
    title: 'NoCodeDevs',
    website: 'https://www.nocodedevs.com',
    summary: 'No-code and automation community with tutorials, tools, and founder resources.',
    categories: ['no code', 'automation', 'creators', 'tools'],
    estimatedTraffic: 44000,
    costToList: null,
    contactName: 'Editorial Team',
    contactEmail: 'team@nocodedevs.com',
    authorityScore: 62,
    backlinkAngle: 'Tutorial or tool mention for teams building workflows without heavy setup',
  },
  {
    title: 'MarTech Series',
    website: 'https://martechseries.com',
    summary: 'Marketing technology publication covering tools, launches, and growth operations.',
    categories: ['marketing', 'martech', 'growth', 'saas'],
    estimatedTraffic: 260000,
    costToList: null,
    contactName: 'Editorial Desk',
    contactEmail: 'news@martechseries.com',
    authorityScore: 78,
    backlinkAngle: 'News-style product announcement or practical marketing operations article',
  },
]

export function runWebsiteSeoAnalysisAction(input: {
  brief: ExtractedBrief
  seoGrowth: SeoGrowthState | null | undefined
}) {
  const state = normalizeSeoGrowthState(input.seoGrowth)
  const clusters = input.brief.keywordResearch.clusters
  const checks = buildWebsiteSeoChecks(input.brief)
  const score = calculateSeoAnalysisScore(input.brief, checks)
  const now = new Date().toISOString()

  const next: SeoGrowthState = {
    ...state,
    websiteAnalysis: {
      generatedAt: now,
      score,
      summary: `${input.brief.productName} has ${clusters.length || 'limited'} keyword cluster${clusters.length === 1 ? '' : 's'} and ${input.brief.sourceHighlights.length || 'limited'} crawl highlights available for SEO planning.`,
      strengths: buildSeoStrengths(input.brief),
      fixes: buildSeoFixes(input.brief),
      checks,
      llmReadinessNotes: buildLlmReadinessNotes(input.brief),
    },
    freeTools: state.freeTools.length > 0 ? state.freeTools : buildFreeToolSuggestions(input.brief),
    lastAnalyzedAt: now,
  }

  return {
    seoGrowth: next,
    info: `SEO analysis updated (${score}/100)`,
  }
}

export function runBlogStrategyAction(input: {
  brief: ExtractedBrief
  seoGrowth: SeoGrowthState | null | undefined
}) {
  const state = normalizeSeoGrowthState(input.seoGrowth)
  const now = new Date().toISOString()
  const posts = buildBlogStrategyPosts(input.brief)

  const next: SeoGrowthState = {
    ...state,
    blogStrategy: posts,
    freeTools: state.freeTools.length > 0 ? state.freeTools : buildFreeToolSuggestions(input.brief),
    lastBlogStrategyAt: now,
  }

  return {
    seoGrowth: next,
    info: `Blog strategy updated (${posts.length} posts, one every 4 days)`,
  }
}

export async function runBacklinkProspectAction(input: {
  brief: ExtractedBrief
  seoGrowth: SeoGrowthState | null | undefined
}) {
  const state = normalizeSeoGrowthState(input.seoGrowth)
  const queries = buildBacklinkQueries(input.brief)
  const provider = resolveBacklinkDiscoveryProvider()
  const discovery = await provider.discover(queries)
  const now = new Date().toISOString()
  const existing = state.backlinkProspects
  const prospects = [...existing]
  const seen = new Set(existing.map((prospect) => prospect.domain || domainFromWebsite(prospect.website)))

  for (const [index, entity] of discovery.entities.entries()) {
    const website = normalizeWebsite(entity.website)
    const domain = domainFromWebsite(website)
    if (!website || !domain || seen.has(domain)) {
      continue
    }

    seen.add(domain)
    prospects.push(entityToBacklinkProspect(entity, input.brief, index, now))
  }

  const nextProspects = prospects
    .sort((a, b) => b.valueScore - a.valueScore)
    .slice(0, MAX_BACKLINK_PROSPECTS)
  const next: SeoGrowthState = {
    ...state,
    freeTools: state.freeTools.length > 0 ? state.freeTools : buildFreeToolSuggestions(input.brief),
    backlinkProspects: nextProspects,
    prospectLists: ensureDefaultBacklinkLists(state.prospectLists, nextProspects),
    lastBacklinkScrapeAt: now,
  }

  const summary = discovery.note
    ? `${discovery.providerName}: ${discovery.note} (${nextProspects.length} backlink prospects)`
    : `${discovery.providerName}: ${nextProspects.length} backlink prospects`

  return {
    seoGrowth: next,
    info: summary,
  }
}

export function runAddBacklinkProspectsToListAction(input: {
  seoGrowth: SeoGrowthState | null | undefined
  prospectIds?: string[]
  listName?: string
}) {
  const state = normalizeSeoGrowthState(input.seoGrowth)
  const selectedIds = new Set((input.prospectIds || []).filter(Boolean))
  const name = input.listName?.trim() || 'Selected backlink prospects'
  const now = new Date().toISOString()
  const slug = slugify(name)
  const existingList = state.prospectLists.find((list) => slugify(list.name) === slug)
  const listId = existingList?.id || `backlink-list-${slug}-${Date.now()}`

  const prospectIds = state.backlinkProspects
    .filter((prospect) => selectedIds.has(prospect.id))
    .map((prospect) => prospect.id)

  const lists = existingList
    ? state.prospectLists.map((list) =>
        list.id === existingList.id
          ? {
              ...list,
              prospectIds: dedupe([...list.prospectIds, ...prospectIds]),
              updatedAt: now,
            }
          : list,
      )
    : [
        ...state.prospectLists,
        {
          id: listId,
          name,
          description: 'Custom backlink outreach list.',
          prospectIds,
          createdAt: now,
          updatedAt: now,
        },
      ]

  const next: SeoGrowthState = {
    ...state,
    prospectLists: lists,
    backlinkProspects: state.backlinkProspects.map((prospect) =>
      selectedIds.has(prospect.id)
        ? {
            ...prospect,
            listIds: dedupe([...prospect.listIds, listId]),
          }
        : prospect,
    ),
  }

  return {
    seoGrowth: next,
    info: `Added ${prospectIds.length} prospect${prospectIds.length === 1 ? '' : 's'} to ${name}`,
  }
}

export function runUpdateBacklinkProspectStatusAction(input: {
  seoGrowth: SeoGrowthState | null | undefined
  prospectId?: string
  status?: string
}) {
  const state = normalizeSeoGrowthState(input.seoGrowth)
  const status = normalizeBacklinkStatus(input.status)

  const next: SeoGrowthState = {
    ...state,
    backlinkProspects: state.backlinkProspects.map((prospect) =>
      prospect.id === input.prospectId ? { ...prospect, status } : prospect,
    ),
  }

  return {
    seoGrowth: next,
    info: 'Backlink prospect status updated',
  }
}

export function runPersonalizeBacklinkEmailsAction(input: {
  brief: ExtractedBrief
  seoGrowth: SeoGrowthState | null | undefined
  prospectIds?: string[]
}) {
  const state = normalizeSeoGrowthState(input.seoGrowth)
  const selected = new Set((input.prospectIds || []).filter(Boolean))
  const targets = selected.size
    ? state.backlinkProspects.filter((prospect) => selected.has(prospect.id))
    : state.backlinkProspects.slice(0, 12)

  const personalized = new Map(
    targets.map((prospect) => [prospect.id, buildBacklinkEmail(input.brief, prospect)]),
  )

  const next: SeoGrowthState = {
    ...state,
    backlinkProspects: state.backlinkProspects.map((prospect) => {
      const email = personalized.get(prospect.id)
      if (!email) {
        return prospect
      }

      return {
        ...prospect,
        customizedEmailSubject: email.subject,
        customizedEmailBody: email.body,
      }
    }),
  }

  return {
    seoGrowth: next,
    info: `Customized backlink emails for ${targets.length} prospect${targets.length === 1 ? '' : 's'}`,
  }
}

export function buildBacklinkOutreachDeliveryPayload(input: SendBacklinkEmailInput) {
  const { emails, subject, bodyPreview } = buildBacklinkEmailBatch(input)

  return {
    subject,
    bodyPreview,
    prospects: emails.map((email) => ({
      id: email.prospect.id,
      title: email.prospect.title,
      website: email.prospect.website,
      domain: email.prospect.domain,
      contactName: email.prospect.contactName,
      contactEmail: email.prospect.contactEmail,
      subject: email.subject,
      body: email.body,
      backlinkAngle: email.prospect.backlinkAngle,
    })),
  }
}

export function runSendBacklinkEmailAction(input: SendBacklinkEmailInput & {
  delivery?: DeliveryState
}) {
  const state = normalizeSeoGrowthState(input.seoGrowth)
  const { targets, subject, bodyPreview } = buildBacklinkEmailBatch(input)
  const now = new Date().toISOString()
  const prospectIds = targets.map((prospect) => prospect.id)

  if (targets.length === 0) {
    return {
      seoGrowth: state,
      info: 'No backlink prospects with contact emails were available to send.',
    }
  }

  const delivered = Boolean(input.delivery?.delivered)
  const configured = Boolean(input.delivery?.configured)

  const job = {
    id: `backlink-email-job-${Date.now()}`,
    status: delivered ? ('completed' as const) : ('queued' as const),
    prospectIds,
    subject,
    bodyPreview,
    createdAt: now,
    ...(delivered ? { completedAt: now } : {}),
  }

  const selectedIds = new Set(prospectIds)
  const next: SeoGrowthState = {
    ...state,
    backlinkProspects: state.backlinkProspects.map((prospect) =>
      selectedIds.has(prospect.id)
        ? {
            ...prospect,
            status: nextContactStatus(prospect.status),
            lastContactedAt: now,
          }
        : prospect,
    ),
    backlinkEmailJobs: [job, ...state.backlinkEmailJobs].slice(0, MAX_BACKLINK_EMAIL_JOBS),
    lastBacklinkEmailAt: now,
  }

  const queuedInfo = configured
    ? `Backlink email batch prepared for ${prospectIds.length} prospect${prospectIds.length === 1 ? '' : 's'}; delivery is awaiting provider confirmation.`
    : `Backlink email batch prepared for ${prospectIds.length} prospect${prospectIds.length === 1 ? '' : 's'}. Configure OUTREACH_EMAIL_WEBHOOK_URL to deliver automatically.`

  return {
    seoGrowth: next,
    info: delivered
      ? `Email delivery webhook accepted ${prospectIds.length} backlink prospect${prospectIds.length === 1 ? '' : 's'}.`
      : queuedInfo,
  }
}

function buildBacklinkEmailBatch(input: SendBacklinkEmailInput) {
  const state = normalizeSeoGrowthState(input.seoGrowth)
  const selected = new Set((input.prospectIds || []).filter(Boolean))
  const targets = (selected.size
    ? state.backlinkProspects.filter((prospect) => selected.has(prospect.id))
    : state.backlinkProspects
  )
    .filter((prospect) => prospect.contactEmail)
    .slice(0, 10)
  const first = targets[0]
  const fallbackEmail = first ? buildBacklinkEmailFromProspect(first) : null
  const emails = targets.map((prospect) => ({
    prospect,
    ...buildBacklinkEmailFromProspect(prospect),
  }))

  return {
    targets,
    emails,
    subject:
      first?.customizedEmailSubject ||
      fallbackEmail?.subject ||
      `Backlink outreach for ${targets.length} prospects`,
    bodyPreview:
      first?.customizedEmailBody?.slice(0, 220) ||
      fallbackEmail?.body.slice(0, 220) ||
      'Backlink outreach email prepared for delivery.',
  }
}

export function exportBacklinkProspectsCsv(
  seoGrowth: SeoGrowthState | null | undefined,
): string {
  const state = normalizeSeoGrowthState(seoGrowth)
  const headers = [
    'title',
    'website',
    'domain',
    'contact_name',
    'contact_email',
    'status',
    'estimated_traffic',
    'cost_to_list',
    'value_score',
    'relevance_score',
    'traffic_score',
    'authority_score',
    'contactability_score',
    'cost_score',
    'backlink_angle',
    'relevance_reason',
    'source',
  ]

  const rows = state.backlinkProspects.map((prospect) => [
    prospect.title,
    prospect.website,
    prospect.domain,
    prospect.contactName,
    prospect.contactEmail,
    prospect.status,
    prospect.estimatedTraffic ?? 'unknown',
    prospect.costToList ?? 'unknown',
    prospect.valueScore,
    prospect.relevanceScore,
    prospect.trafficScore,
    prospect.authorityScore,
    prospect.contactabilityScore,
    prospect.costScore,
    prospect.backlinkAngle,
    prospect.relevanceReason,
    prospect.source,
  ])

  return [headers, ...rows]
    .map((row) =>
      row
        .map(escapeCsvCell)
        .join(','),
    )
    .join('\n')
}

function buildWebsiteSeoChecks(brief: ExtractedBrief): WebsiteSeoCheck[] {
  return [
    {
      id: 'seo-keywords',
      label: 'Keyword coverage',
      status: brief.keywordResearch.clusters.length >= 3 ? 'pass' : 'warning',
      detail:
        brief.keywordResearch.clusters.length >= 3
          ? 'Multiple keyword clusters are available for planning.'
          : 'Add more clusters before scaling content production.',
    },
    {
      id: 'seo-proof',
      label: 'Proof signals',
      status: brief.proofPoints.length >= 2 ? 'pass' : 'warning',
      detail:
        brief.proofPoints.length >= 2
          ? 'Proof points can support stronger comparison and trust content.'
          : 'Add outcomes, customer quotes, or usage signals to improve trust.',
    },
    {
      id: 'seo-crawl',
      label: 'Crawl depth',
      status: brief.crawlPages.length >= 3 ? 'pass' : 'warning',
      detail:
        brief.crawlPages.length >= 3
          ? 'The brief includes multiple crawled pages.'
          : 'Consider adding product, pricing, docs, or customer pages to enrich the brief.',
    },
    {
      id: 'seo-llm',
      label: 'LLM answer readiness',
      status: brief.valueProps.length >= 2 && brief.targetUsers.length > 0 ? 'pass' : 'warning',
      detail: 'Clear audience and value statements help answer engines cite the product accurately.',
    },
  ]
}

function calculateSeoAnalysisScore(brief: ExtractedBrief, checks: WebsiteSeoCheck[]): number {
  const passed = checks.filter((check) => check.status === 'pass').length
  const clusterBonus = Math.min(18, brief.keywordResearch.clusters.length * 3)
  const proofBonus = Math.min(12, brief.proofPoints.length * 4)
  return clamp(Math.round(42 + passed * 8 + clusterBonus + proofBonus), 0, 100)
}

function buildSeoStrengths(brief: ExtractedBrief): string[] {
  return dedupe([
    brief.positioning ? `Clear positioning: ${brief.positioning}` : '',
    brief.icp ? `ICP is explicit enough to shape search intent: ${brief.icp}` : '',
    brief.keywordResearch.clusters[0]?.topic
      ? `Primary cluster available: ${brief.keywordResearch.clusters[0].topic}`
      : '',
    brief.valueProps[0] ? `Value-led content angle: ${brief.valueProps[0]}` : '',
  ]).filter(Boolean)
}

function buildSeoFixes(brief: ExtractedBrief): string[] {
  return [
    brief.keywordResearch.clusters.length < 4
      ? 'Expand keyword research to at least four clusters before publishing a full content calendar.'
      : 'Map each keyword cluster to one pillar post and one comparison or template post.',
    brief.proofPoints.length < 2
      ? 'Add proof points, examples, or metrics so posts can earn trust and LLM citations.'
      : 'Turn proof points into comparison tables, examples, and answer-first snippets.',
    'Create pages that answer pricing, alternatives, integrations, use cases, and implementation questions directly.',
  ]
}

function buildLlmReadinessNotes(brief: ExtractedBrief): string[] {
  return [
    `Use concise answer blocks that define what ${brief.productName} does, who it is for, and when to use it.`,
    'Add comparison tables with objective criteria, not only marketing claims.',
    'Include FAQ-style sections with direct answers, source-like wording, and examples.',
    'Keep entity names consistent across title, intro, schema-friendly headings, and CTA blocks.',
  ]
}

function buildBlogStrategyPosts(brief: ExtractedBrief): BlogStrategyPost[] {
  const clusters = getStrategyClusters(brief).slice(0, 6)
  const posts: BlogStrategyPost[] = []

  for (const [clusterIndex, cluster] of clusters.entries()) {
    const primaryKeyword = cluster.keywords[0] || cluster.topic
    const audience = brief.targetUsers[0] || 'teams'
    const angles = [
      {
        title: `${cluster.topic}: A practical guide for ${audience}`,
        tableIdeas: [
          'Problem vs. manual workflow vs. product-assisted workflow',
          'Use case, best-fit team, expected outcome',
        ],
      },
      {
        title: `Best ${cluster.topic.toLowerCase()} workflows for ${audience}`,
        tableIdeas: [
          'Workflow step, owner, input, output',
          'Tool category, selection criteria, tradeoffs',
        ],
      },
    ]

    for (const [angleIndex, angle] of angles.entries()) {
      const postIndex = clusterIndex * angles.length + angleIndex
      posts.push({
        id: `seo-blog-${cluster.id}-${angleIndex + 1}`,
        dayOffset: postIndex * 4,
        keywordClusterId: cluster.id,
        keywordTopic: cluster.topic,
        title: angle.title,
        intent: cluster.intent,
        targetKeywords: dedupe([primaryKeyword, ...cluster.keywords]).slice(0, 6),
        tableIdeas: angle.tableIdeas,
        outline: [
          `Direct answer: what ${cluster.topic.toLowerCase()} means for ${audience}`,
          `When this problem shows up: ${brief.painPoints[0] || 'common operational bottlenecks'}`,
          'Comparison table and decision criteria',
          `Implementation workflow using ${brief.productName}`,
          'FAQ and LLM-friendly summary',
        ],
        llmNotes: [
          'Open with a 2-3 sentence answer block.',
          'Use descriptive H2 headings that can stand alone in search snippets.',
          'Include at least one table and one short checklist.',
        ],
        cta: brief.cta,
      })
    }
  }

  return posts.slice(0, MAX_BLOG_POSTS)
}

function buildFreeToolSuggestions(brief: ExtractedBrief): FreeToolSuggestion[] {
  const domain = domainFromWebsite(brief.sourceUrl) || 'your site'
  return [
    {
      id: 'tool-search-console',
      category: 'Indexing',
      title: 'Google Search Console',
      url: 'https://search.google.com/search-console',
      workflow: `Verify ${domain}, inspect key pages, submit the sitemap, and review query impressions weekly.`,
    },
    {
      id: 'tool-pagespeed',
      category: 'Technical SEO',
      title: 'PageSpeed Insights',
      url: 'https://pagespeed.web.dev',
      workflow: 'Run the homepage and top landing pages, then prioritize Core Web Vitals and accessibility fixes.',
    },
    {
      id: 'tool-rich-results',
      category: 'Structured Data',
      title: 'Rich Results Test',
      url: 'https://search.google.com/test/rich-results',
      workflow: 'Validate FAQ, product, article, and breadcrumb markup before publishing important SEO pages.',
    },
    {
      id: 'tool-ahrefs-keyword',
      category: 'Keyword Ideas',
      title: 'Ahrefs Free Keyword Generator',
      url: 'https://ahrefs.com/keyword-generator',
      workflow: `Expand clusters around ${brief.keywordResearch.clusters[0]?.topic || brief.productName} and add long-tail questions.`,
    },
    {
      id: 'tool-bing-webmaster',
      category: 'LLM Visibility',
      title: 'Bing Webmaster Tools',
      url: 'https://www.bing.com/webmasters',
      workflow: 'Submit pages to Bing, monitor indexation, and cover answer-engine surfaces beyond Google.',
    },
  ]
}

function buildBacklinkQueries(brief: ExtractedBrief): string[] {
  const clusters = brief.keywordResearch.clusters.slice(0, 3).map((cluster) => cluster.topic)
  const audience = brief.targetUsers[0] || 'startups'

  return dedupe([
    `${brief.productName} alternatives directory`,
    `${audience} tools directory`,
    ...clusters.map((topic) => `${topic} write for us`),
    ...clusters.map((topic) => `${topic} tools directory`),
    `${brief.icp || audience} blog guest post`,
  ]).slice(0, 8)
}

function resolveBacklinkDiscoveryProvider(): BacklinkDiscoveryProvider {
  const provider = (
    process.env.LAUNCH_KIT_SEO_DISCOVERY_PROVIDER ||
    process.env.LAUNCH_KIT_DISCOVERY_PROVIDER ||
    'seeded'
  )
    .trim()
    .toLowerCase()

  if (provider === 'serpapi' && process.env.SERPAPI_API_KEY) {
    return createSerpApiBacklinkProvider(process.env.SERPAPI_API_KEY)
  }

  if (provider === 'serpapi') {
    return createSeededBacklinkProvider('SERPAPI_API_KEY missing, switched to built-in backlink seed')
  }

  return createSeededBacklinkProvider()
}

function createSeededBacklinkProvider(note?: string): BacklinkDiscoveryProvider {
  return {
    async discover(queries: string[]) {
      const queryText = queries.join(' ').toLowerCase()
      const entities = MOCK_BACKLINK_SITES.map((site, index) => {
        const tagScore = site.categories.reduce(
          (score, category) => score + (queryText.includes(category.toLowerCase()) ? 10 : 0),
          0,
        )

        return {
          ...site,
          source: 'seeded-backlink-discovery',
          relevanceScore: clamp(58 + tagScore - index, 35, 96),
        }
      }).sort((a, b) => b.relevanceScore - a.relevanceScore)

      return {
        entities,
        providerName: 'Seeded Backlink Discovery',
        note: note || 'Using local seeded provider (configure optional discovery env for live search)',
      }
    },
  }
}

function createSerpApiBacklinkProvider(apiKey: string): BacklinkDiscoveryProvider {
  return {
    async discover(queries: string[]) {
      const entities: BacklinkDiscoveryEntity[] = []
      const used = new Set<string>()

      for (const query of queries.slice(0, 4)) {
        const url = new URL('https://serpapi.com/search.json')
        url.searchParams.set('engine', 'google')
        url.searchParams.set('num', '6')
        url.searchParams.set('q', query)
        url.searchParams.set('api_key', apiKey)

        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(12000) })
          if (!response.ok) {
            continue
          }

          const json = (await response.json()) as {
            organic_results?: Array<{
              title?: string
              link?: string
              snippet?: string
            }>
          }

          for (const result of json.organic_results || []) {
            const website = normalizeWebsite(result.link || '')
            const domain = domainFromWebsite(website)
            if (!website || !domain || used.has(domain)) {
              continue
            }
            used.add(domain)

            entities.push({
              title: sanitizeTitle(result.title || domain),
              website,
              summary: result.snippet || `Discovered from query: ${query}`,
              source: 'serpapi',
              estimatedTraffic: null,
              costToList: null,
              contactName: 'Editorial Team',
              contactEmail: '',
              authorityScore: 58,
              relevanceScore: 64,
              backlinkAngle: `Relevant page discovered from query: ${query}`,
            })
          }
        } catch {
          continue
        }
      }

      if (entities.length === 0) {
        return createSeededBacklinkProvider('SerpAPI returned no backlink prospects, switched to local seed').discover(
          queries,
        )
      }

      return {
        entities: entities.slice(0, 24),
        providerName: 'SerpAPI Backlink Discovery',
      }
    },
  }
}

function entityToBacklinkProspect(
  entity: BacklinkDiscoveryEntity,
  brief: ExtractedBrief,
  index: number,
  now: string,
): BacklinkProspect {
  const website = normalizeWebsite(entity.website)
  const domain = domainFromWebsite(website)
  const trafficScore = scoreTraffic(entity.estimatedTraffic)
  const costScore = scoreCost(entity.costToList)
  const contactabilityScore = scoreContactability(entity)
  const relevanceScore = clamp(entity.relevanceScore, 0, 100)
  const authorityScore = clamp(entity.authorityScore, 0, 100)
  const valueScore = calculateBacklinkValueScore({
    relevanceScore,
    trafficScore,
    authorityScore,
    contactabilityScore,
    costScore,
  })
  const prospect: BacklinkProspect = {
    id: `backlink-${slugify(domain || entity.title)}-${Date.now()}-${index + 1}`,
    website,
    domain,
    title: entity.title,
    contactName: entity.contactName,
    contactEmail: entity.contactEmail,
    scrapedSummary: entity.summary,
    relevanceReason: `${entity.title} matches ${brief.keywordResearch.clusters[0]?.topic || brief.icp || brief.productName} and can support a relevant backlink context.`,
    backlinkAngle: entity.backlinkAngle,
    costToList: entity.costToList,
    estimatedTraffic: entity.estimatedTraffic,
    relevanceScore,
    trafficScore,
    authorityScore,
    contactabilityScore,
    costScore,
    valueScore,
    status: 'new',
    listIds: [],
    customizedEmailSubject: '',
    customizedEmailBody: '',
    source: entity.source,
    discoveredAt: now,
    lastContactedAt: '',
  }
  const email = buildBacklinkEmail(brief, prospect)

  return {
    ...prospect,
    customizedEmailSubject: email.subject,
    customizedEmailBody: email.body,
  }
}

function calculateBacklinkValueScore(input: {
  relevanceScore: number
  trafficScore: number
  authorityScore: number
  contactabilityScore: number
  costScore: number
}): number {
  return Math.round(
    0.35 * input.relevanceScore +
      0.25 * input.trafficScore +
      0.2 * input.authorityScore +
      0.1 * input.contactabilityScore +
      0.1 * input.costScore,
  )
}

function ensureDefaultBacklinkLists(
  lists: SeoGrowthState['prospectLists'],
  prospects: BacklinkProspect[],
): SeoGrowthState['prospectLists'] {
  if (lists.length > 0) {
    return lists
  }

  const now = new Date().toISOString()
  const highValueIds = prospects
    .filter((prospect) => prospect.valueScore >= 75)
    .map((prospect) => prospect.id)
  const freeIds = prospects
    .filter((prospect) => prospect.costToList === 0)
    .map((prospect) => prospect.id)
  const paidIds = prospects
    .filter((prospect) => typeof prospect.costToList === 'number' && prospect.costToList > 0)
    .map((prospect) => prospect.id)

  return [
    {
      id: 'backlink-list-high-value',
      name: 'High value outreach',
      description: 'Best blend of relevance, traffic, authority, contactability, and cost.',
      prospectIds: highValueIds,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'backlink-list-free',
      name: 'Free listing opportunities',
      description: 'Prospects with no known listing cost.',
      prospectIds: freeIds,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'backlink-list-paid',
      name: 'Paid listing review',
      description: 'Prospects where cost should be reviewed against estimated value.',
      prospectIds: paidIds,
      createdAt: now,
      updatedAt: now,
    },
  ]
}

function buildBacklinkEmail(brief: ExtractedBrief, prospect: BacklinkProspect) {
  const firstName = prospect.contactName.split(/\s+/)[0] || 'there'
  const subject = `${brief.productName} for ${prospect.title}`
  const body = [
    `Hi ${firstName},`,
    '',
    `I came across ${prospect.title} while researching ${brief.keywordResearch.clusters[0]?.topic || brief.icp || 'relevant software resources'}. ${prospect.scrapedSummary}`,
    '',
    `${brief.productName} ${brief.positioning.toLowerCase()}. The most relevant angle for your readers is: ${prospect.backlinkAngle}.`,
    '',
    `If useful, I can send a concise listing blurb, screenshots, or a practical example tailored for ${prospect.domain}.`,
    '',
    brief.cta,
  ].join('\n')

  return { subject, body }
}

function buildBacklinkEmailFromProspect(prospect: BacklinkProspect) {
  return {
    subject: prospect.customizedEmailSubject || `Resource idea for ${prospect.title}`,
    body:
      prospect.customizedEmailBody ||
      `Hi ${prospect.contactName || 'there'},\n\nI found ${prospect.title} and thought this resource angle could be relevant: ${prospect.backlinkAngle}.`,
  }
}

function getStrategyClusters(brief: ExtractedBrief): KeywordCluster[] {
  if (brief.keywordResearch.clusters.length > 0) {
    return brief.keywordResearch.clusters
  }

  return [
    {
      id: 'cluster-seo-general',
      topic: `${brief.productName} use cases`,
      intent: 'informational',
      priority: 'high',
      keywords: [brief.productName.toLowerCase(), `${brief.productName.toLowerCase()} examples`],
      contentAngles: ['Use case guide', 'Workflow comparison'],
    },
  ]
}

function nextContactStatus(status: BacklinkProspectStatus): BacklinkProspectStatus {
  if (status === 'new') {
    return 'first_contact'
  }

  if (status === 'first_contact') {
    return 'second_contact'
  }

  return status
}

function normalizeBacklinkStatus(status: string | undefined): BacklinkProspectStatus {
  return BACKLINK_STATUSES.includes(status as BacklinkProspectStatus)
    ? (status as BacklinkProspectStatus)
    : 'new'
}

function scoreTraffic(traffic: number | null): number {
  if (typeof traffic !== 'number' || !Number.isFinite(traffic)) {
    return 50
  }

  return clamp(Math.round(Math.log10(Math.max(traffic, 10)) * 18), 10, 100)
}

function scoreCost(cost: number | null): number {
  if (typeof cost !== 'number' || !Number.isFinite(cost)) {
    return 50
  }

  if (cost <= 0) {
    return 100
  }

  return clamp(Math.round(100 - cost / 12), 0, 100)
}

function scoreContactability(entity: BacklinkDiscoveryEntity): number {
  if (entity.contactEmail) {
    return 90
  }

  if (entity.contactName) {
    return 65
  }

  return 45
}

function normalizeWebsite(value: string): string {
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) {
      return ''
    }
    return `${url.protocol}//${url.hostname}${url.pathname === '/' ? '' : url.pathname}`
  } catch {
    return ''
  }
}

function domainFromWebsite(website: string): string {
  try {
    const url = new URL(website)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function sanitizeTitle(value: string): string {
  const trimmed = value.trim()
  const first = trimmed.split(/[|:]/)[0]?.trim()
  return first || trimmed || 'Backlink Prospect'
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item'
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
