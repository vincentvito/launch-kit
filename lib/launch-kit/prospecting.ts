import {
  type ExtractedBrief,
  type FollowUpSequence,
  type GrowthAssets,
  type LaunchKit,
  type PersonalizedOutreach,
  type ProspectActionRun,
  type ProspectActionStatus,
  type ProspectActionType,
  type ProspectLead,
  type ProspectLeadTier,
  type ProspectingState,
} from '@/lib/launch-kit/types'
import { createEmptyProspectingState } from '@/lib/launch-kit/normalizers'
import { dedupe } from '@/lib/launch-kit/utils'

type DiscoveryEntity = {
  company: string
  website: string
  roleHint: string
  reason: string
  source: string
  score: number
}

type DiscoveryProviderResult = {
  entities: DiscoveryEntity[]
  providerName: string
  note?: string
}

type DiscoveryProvider = {
  discover: (queries: string[]) => Promise<DiscoveryProviderResult>
}

const MAX_LEADS = 60
const MAX_ACTION_RUNS = 80
const MAX_PERSONALIZED = 120
const MAX_EMAIL_JOBS = 80

const MOCK_COMPANIES = [
  {
    company: 'Plausible Analytics',
    website: 'https://plausible.io',
    categories: ['indie hackers', 'saas', 'startup founders', 'marketing teams'],
    roleHint: 'Founder',
  },
  {
    company: 'Lemon Squeezy',
    website: 'https://www.lemonsqueezy.com',
    categories: ['creators', 'digital products', 'small startup teams'],
    roleHint: 'Growth Lead',
  },
  {
    company: 'PostHog',
    website: 'https://posthog.com',
    categories: ['product teams', 'developers', 'saas'],
    roleHint: 'Product Marketing Manager',
  },
  {
    company: 'Cal.com',
    website: 'https://cal.com',
    categories: ['startup teams', 'developers', 'open source'],
    roleHint: 'Community Lead',
  },
  {
    company: 'Tally',
    website: 'https://tally.so',
    categories: ['creators', 'indie hackers', 'small teams'],
    roleHint: 'Founder',
  },
  {
    company: 'Rows',
    website: 'https://rows.com',
    categories: ['marketing teams', 'startup teams', 'operations'],
    roleHint: 'Growth Manager',
  },
  {
    company: 'Ahrefs',
    website: 'https://ahrefs.com',
    categories: ['seo', 'marketing teams', 'agencies'],
    roleHint: 'Content Lead',
  },
  {
    company: 'ConvertKit',
    website: 'https://convertkit.com',
    categories: ['creators', 'email marketing', 'small businesses'],
    roleHint: 'Lifecycle Marketer',
  },
  {
    company: 'Beehiiv',
    website: 'https://www.beehiiv.com',
    categories: ['newsletter creators', 'media', 'growth'],
    roleHint: 'Growth Lead',
  },
  {
    company: 'Canny',
    website: 'https://canny.io',
    categories: ['product teams', 'startup teams', 'saas'],
    roleHint: 'Head of Product',
  },
  {
    company: 'Linear',
    website: 'https://linear.app',
    categories: ['product teams', 'developers', 'startup teams'],
    roleHint: 'Product Operations',
  },
  {
    company: 'Framer',
    website: 'https://framer.com',
    categories: ['creators', 'designers', 'agencies'],
    roleHint: 'Product Marketer',
  },
]

const FIRST_NAMES = [
  'Alex',
  'Sam',
  'Jordan',
  'Taylor',
  'Casey',
  'Avery',
  'Morgan',
  'Riley',
  'Jamie',
  'Drew',
]

const LAST_NAMES = [
  'Chen',
  'Patel',
  'Garcia',
  'Kim',
  'Khan',
  'Nguyen',
  'Rossi',
  'Walker',
  'Dubois',
  'Singh',
]

const ACTION_LABELS: Record<ProspectActionType, string> = {
  prospect: 'Scrape potential customers',
  build_email_list: 'Build lead email list',
  personalize_outreach: 'Generate personalized outreach',
  send_outreach_email: 'Send outreach email (stub)',
  score_segment: 'Score and segment leads',
  export_leads: 'Export lead list CSV',
  followup_sequences: 'Create follow-up sequence drafts',
}

export async function runProspectAction(input: {
  brief: ExtractedBrief
  prospecting: ProspectingState | null | undefined
}) {
  const state = normalizeProspecting(input.prospecting)
  const queries = buildProspectQueries(input.brief)
  const provider = resolveDiscoveryProvider()
  const discovery = await provider.discover(queries)

  const existing = state.leads
  const leads = [...existing]
  const seen = new Set(existing.map((lead) => lead.website || lead.company).filter(Boolean))

  for (const [index, entity] of discovery.entities.entries()) {
    const dedupeKey = entity.website || entity.company
    if (!dedupeKey || seen.has(dedupeKey)) {
      continue
    }
    seen.add(dedupeKey)

    const syntheticName = buildSyntheticName(entity.company, index)
    const score = clamp(entity.score, 35, 92)
    leads.push({
      id: `lead-${slugify(entity.company)}-${Date.now()}-${index + 1}`,
      name: syntheticName,
      role: entity.roleHint || 'Founder',
      company: entity.company,
      website: entity.website,
      email: '',
      linkedinUrl: '',
      xUrl: '',
      reason: entity.reason,
      source: entity.source,
      score,
      tier: scoreToTier(score),
    })
  }

  const next = {
    ...state,
    queryHints: queries,
    leads: leads.slice(0, MAX_LEADS),
    lastScrapeAt: new Date().toISOString(),
  }

  const summary = discovery.note
    ? `${discovery.providerName}: ${discovery.note} (${next.leads.length} leads available)`
    : `${discovery.providerName}: ${next.leads.length} leads available`

  next.actionRuns = pushActionRun(next.actionRuns, {
    type: 'prospect',
    status: 'completed',
    summary,
  })

  return {
    prospecting: next,
    info: summary,
  }
}

export function runBuildEmailListAction(input: {
  prospecting: ProspectingState | null | undefined
}) {
  const state = normalizeProspecting(input.prospecting)
  const now = new Date().toISOString()
  const usedEmails = new Set<string>()
  const leads = state.leads.map((lead, index) => {
    const next = { ...lead }
    if (!next.email) {
      const inferred = inferLeadEmail(next, index)
      next.email = inferred
    }

    if (next.email && usedEmails.has(next.email.toLowerCase())) {
      next.email = ''
      next.score = clamp(next.score - 8, 10, 100)
    }

    if (next.email) {
      usedEmails.add(next.email.toLowerCase())
      next.score = clamp(next.score + 8, 10, 100)
    }

    if (!next.linkedinUrl) {
      next.linkedinUrl = inferLinkedInUrl(next)
    }

    next.tier = scoreToTier(next.score)
    return next
  })

  const next = {
    ...state,
    leads,
    lastEmailBuildAt: now,
  }

  const withEmail = leads.filter((lead) => Boolean(lead.email)).length
  next.actionRuns = pushActionRun(next.actionRuns, {
    type: 'build_email_list',
    status: 'completed',
    summary: `Built/updated email hints for ${withEmail} leads`,
  })

  return {
    prospecting: next,
    info: `Email list updated (${withEmail} leads with email hints)`,
  }
}

export function runImportEmailListAction(input: {
  prospecting: ProspectingState | null | undefined
  rawContacts: string
}) {
  const state = normalizeProspecting(input.prospecting)
  const imported = parseImportedContacts(input.rawContacts)
  const existingEmails = new Set(state.leads.map((lead) => lead.email.toLowerCase()).filter(Boolean))
  const existingKeys = new Set(state.leads.map((lead) => `${lead.company}|${lead.website}`.toLowerCase()))
  const leads = [...state.leads]

  for (const [index, lead] of imported.entries()) {
    const emailKey = lead.email.toLowerCase()
    const identityKey = `${lead.company}|${lead.website}`.toLowerCase()
    if (existingEmails.has(emailKey) || existingKeys.has(identityKey)) {
      continue
    }
    existingEmails.add(emailKey)
    existingKeys.add(identityKey)
    leads.push({
      ...lead,
      id: `lead-import-${slugify(lead.email)}-${Date.now()}-${index + 1}`,
    })
  }

  const importedCount = leads.length - state.leads.length
  const next = {
    ...state,
    leads: leads.slice(0, MAX_LEADS),
    lastEmailBuildAt: new Date().toISOString(),
  }

  next.actionRuns = pushActionRun(next.actionRuns, {
    type: 'build_email_list',
    status: 'completed',
    summary: `Imported ${importedCount} contact${importedCount === 1 ? '' : 's'} into the email list`,
  })

  return {
    prospecting: next,
    info: `Imported ${importedCount} contact${importedCount === 1 ? '' : 's'}`,
  }
}

export function runScoreSegmentAction(input: {
  prospecting: ProspectingState | null | undefined
}) {
  const state = normalizeProspecting(input.prospecting)

  const leads = state.leads.map((lead) => {
    let score = lead.score
    if (lead.email) {
      score += 10
    }
    if (lead.linkedinUrl || lead.xUrl) {
      score += 8
    }
    if (lead.reason.length > 40) {
      score += 4
    }
    if (lead.role.toLowerCase().includes('founder') || lead.role.toLowerCase().includes('head')) {
      score += 6
    }

    const bounded = clamp(score, 12, 98)
    return {
      ...lead,
      score: bounded,
      tier: scoreToTier(bounded),
    }
  })

  const hot = leads.filter((lead) => lead.tier === 'hot').length
  const warm = leads.filter((lead) => lead.tier === 'warm').length
  const cold = leads.filter((lead) => lead.tier === 'cold').length

  const next = {
    ...state,
    leads,
  }

  next.actionRuns = pushActionRun(next.actionRuns, {
    type: 'score_segment',
    status: 'completed',
    summary: `Segmented leads: ${hot} hot, ${warm} warm, ${cold} cold`,
  })

  return {
    prospecting: next,
    info: `Lead scoring complete (${hot} hot / ${warm} warm / ${cold} cold)`,
  }
}

export function runPersonalizeOutreachAction(input: {
  brief: ExtractedBrief
  launchKit: LaunchKit
  selectedLeadIds?: string[]
}) {
  const state = normalizeProspecting(input.launchKit.prospecting)
  const selectedSet = new Set(input.selectedLeadIds || [])
  const targetLeads = selectedSet.size
    ? state.leads.filter((lead) => selectedSet.has(lead.id))
    : state.leads.slice(0, 20)

  const linkedinTemplate = input.launchKit.growthAssets.linkedinOutreach.variants[0]?.message || ''
  const xTemplate = input.launchKit.growthAssets.xOutreach.variants[0]?.message || ''
  const emailSubjectTemplate =
    input.launchKit.growthAssets.emailOutreach.variants[0]?.subject ||
    `Quick idea for ${input.brief.productName}`
  const emailBodyTemplate = input.launchKit.growthAssets.emailOutreach.variants[0]?.message || ''

  const items: PersonalizedOutreach[] = targetLeads.map((lead, index) => {
    const vars = {
      firstName: lead.name.split(' ')[0] || lead.name,
      company: lead.company,
      role: lead.role,
      category: input.brief.targetUsers[0] || 'SaaS',
      productName: input.brief.productName,
    }

    return {
      id: `outreach-${lead.id}-${index + 1}`,
      leadId: lead.id,
      leadName: lead.name,
      company: lead.company,
      linkedinMessage: applyTemplate(linkedinTemplate, vars),
      xMessage: applyTemplate(xTemplate, vars),
      emailSubject: applyTemplate(emailSubjectTemplate, vars),
      emailBody: applyTemplate(emailBodyTemplate, vars),
      createdAt: new Date().toISOString(),
    }
  })

  const personalized = dedupePersonalized([...items, ...state.personalizedOutreach]).slice(
    0,
    MAX_PERSONALIZED,
  )
  const next = {
    ...state,
    personalizedOutreach: personalized,
  }
  next.actionRuns = pushActionRun(next.actionRuns, {
    type: 'personalize_outreach',
    status: 'completed',
    summary: `Generated personalized outreach for ${items.length} leads`,
  })

  return {
    prospecting: next,
    info: `Personalized outreach ready for ${items.length} leads`,
  }
}

export function runFollowUpSequenceAction(input: {
  brief: ExtractedBrief
  launchKit: LaunchKit
}) {
  const state = normalizeProspecting(input.launchKit.prospecting)
  const nextGrowth: GrowthAssets = {
    ...input.launchKit.growthAssets,
    followUpSequences: buildFollowUpSequences(input.brief),
  }

  const nextProspecting = {
    ...state,
    actionRuns: pushActionRun(state.actionRuns, {
      type: 'followup_sequences',
      status: 'completed',
      summary: 'Generated follow-up sequence drafts (Day 0 / Day 3 / Day 7)',
    }),
  }

  return {
    growthAssets: nextGrowth,
    prospecting: nextProspecting,
    info: 'Follow-up sequence drafts generated',
  }
}

export function runSendOutreachEmailStubAction(input: {
  launchKit: LaunchKit
  selectedLeadIds?: string[]
  subject?: string
  body?: string
}) {
  const state = normalizeProspecting(input.launchKit.prospecting)
  const selectedSet = new Set(input.selectedLeadIds || [])
  const selected = selectedSet.size
    ? state.leads.filter((lead) => selectedSet.has(lead.id))
    : state.leads.filter((lead) => lead.email).slice(0, 10)

  const leadsWithEmail = selected.filter((lead) => Boolean(lead.email))
  const fallbackSubject =
    input.launchKit.growthAssets.emailOutreach.variants[0]?.subject || 'Quick launch workflow idea'
  const fallbackBody =
    input.launchKit.growthAssets.emailOutreach.variants[0]?.message ||
    'Sharing a short launch workflow concept that may help your next release.'

  const subject = input.subject?.trim() || fallbackSubject
  const body = input.body?.trim() || fallbackBody

  const jobId = `email-job-${Date.now()}`
  const job = {
    id: jobId,
    status: 'completed' as const,
    leadIds: leadsWithEmail.map((lead) => lead.id),
    subject,
    bodyPreview: body.slice(0, 220),
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  }

  const next = {
    ...state,
    emailJobs: [job, ...state.emailJobs].slice(0, MAX_EMAIL_JOBS),
  }

  next.actionRuns = pushActionRun(next.actionRuns, {
    type: 'send_outreach_email',
    status: 'completed',
    summary: `Stub queued and completed for ${leadsWithEmail.length} leads`,
  })

  return {
    prospecting: next,
    info: `Email send stub completed (${leadsWithEmail.length} leads, no real delivery)`,
  }
}

export function exportLeadsCsv(prospecting: ProspectingState | null | undefined): string {
  const state = normalizeProspecting(prospecting)
  const headers = [
    'name',
    'role',
    'company',
    'website',
    'email',
    'linkedin_url',
    'x_url',
    'score',
    'tier',
    'reason',
    'source',
  ]

  const rows = state.leads.map((lead) => [
    lead.name,
    lead.role,
    lead.company,
    lead.website,
    lead.email,
    lead.linkedinUrl,
    lead.xUrl,
    String(lead.score),
    lead.tier,
    lead.reason,
    lead.source,
  ])

  return [headers, ...rows]
    .map((row) =>
      row
        .map((value) => `"${String(value || '').replaceAll('"', '""')}"`)
        .join(','),
    )
    .join('\n')
}

export function withActionPending(
  prospecting: ProspectingState | null | undefined,
  type: ProspectActionType,
  summary: string,
) {
  const state = normalizeProspecting(prospecting)
  return {
    ...state,
    actionRuns: pushActionRun(state.actionRuns, {
      type,
      status: 'pending_approval',
      summary,
    }),
  }
}

export function actionLabel(type: ProspectActionType): string {
  return ACTION_LABELS[type]
}

function normalizeProspecting(
  prospecting: ProspectingState | null | undefined,
): ProspectingState {
  const fallback = createEmptyProspectingState()
  return {
    ...fallback,
    ...(prospecting || {}),
    queryHints: Array.isArray(prospecting?.queryHints) ? prospecting.queryHints : [],
    leads: Array.isArray(prospecting?.leads) ? prospecting.leads : [],
    personalizedOutreach: Array.isArray(prospecting?.personalizedOutreach)
      ? prospecting.personalizedOutreach
      : [],
    actionRuns: Array.isArray(prospecting?.actionRuns) ? prospecting.actionRuns : [],
    emailJobs: Array.isArray(prospecting?.emailJobs) ? prospecting.emailJobs : [],
  }
}

function buildProspectQueries(brief: ExtractedBrief): string[] {
  const users = brief.targetUsers.slice(0, 2)
  const pains = brief.painPoints.slice(0, 2).map((pain) => pain.toLowerCase())
  const values = brief.valueProps.slice(0, 2).map((value) => value.toLowerCase())
  const clusters = brief.keywordResearch.clusters.slice(0, 3).map((cluster) => cluster.topic)

  return dedupe([
    `${brief.productName} alternatives for ${users[0] || 'founders'}`,
    `companies needing ${pains[0] || 'launch copy automation'}`,
    `teams that care about ${values[0] || 'faster launch workflows'}`,
    ...clusters.map((topic) => `${topic} software companies`),
  ]).slice(0, 8)
}

function resolveDiscoveryProvider(): DiscoveryProvider {
  const provider = (process.env.LAUNCH_KIT_DISCOVERY_PROVIDER || 'mock').trim().toLowerCase()
  if (provider === 'serpapi') {
    const key = process.env.SERPAPI_API_KEY
    if (key) {
      return createSerpApiProvider(key)
    }
    return createMockProvider('SERPAPI_API_KEY missing, switched to built-in discovery seed')
  }

  return createMockProvider()
}

function createMockProvider(note?: string): DiscoveryProvider {
  return {
    async discover(queries: string[]) {
      const joined = queries.join(' ').toLowerCase()
      const ranked = MOCK_COMPANIES.map((company) => {
        const tagScore = company.categories.reduce((score, category) => {
          if (joined.includes(category.toLowerCase())) {
            return score + 12
          }
          return score
        }, 0)

        return {
          ...company,
          score: 52 + tagScore,
        }
      }).sort((a, b) => b.score - a.score)

      const entities = ranked.slice(0, 18).map((company, index) => ({
        company: company.company,
        website: company.website,
        roleHint: company.roleHint,
        reason: `Matches ICP tags: ${company.categories.slice(0, 2).join(', ')}`,
        source: 'mock-seed',
        score: clamp(company.score - index, 38, 90),
      }))

      return {
        entities,
        providerName: 'Mock Discovery',
        note: note || 'Using local seeded provider (configure discovery provider env for live search)',
      }
    },
  }
}

function createSerpApiProvider(apiKey: string): DiscoveryProvider {
  return {
    async discover(queries: string[]) {
      const entities: DiscoveryEntity[] = []
      const used = new Set<string>()

      for (const query of queries.slice(0, 4)) {
        const url = new URL('https://serpapi.com/search.json')
        url.searchParams.set('engine', 'google')
        url.searchParams.set('num', '5')
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
            }>
          }

          for (const result of json.organic_results || []) {
            const link = result.link?.trim()
            if (!link) {
              continue
            }

            const website = normalizeWebsite(link)
            if (!website || used.has(website)) {
              continue
            }
            used.add(website)

            const company = sanitizeCompanyName(result.title || website)
            entities.push({
              company,
              website,
              roleHint: 'Founder',
              reason: `Discovered from query: ${query}`,
              source: 'serpapi',
              score: 64,
            })
          }
        } catch {
          continue
        }
      }

      if (entities.length === 0) {
        return createMockProvider('SerpAPI returned no entities, switched to local seed').discover(
          queries,
        )
      }

      return {
        entities: entities.slice(0, 24),
        providerName: 'SerpAPI Discovery',
      }
    },
  }
}

function buildFollowUpSequences(brief: ExtractedBrief): FollowUpSequence[] {
  const valueProp = brief.valueProps[0] || brief.positioning
  const proof = brief.proofPoints[0] || 'Proof to add before sending: a sourced metric, customer example, testimonial, or concrete product evidence.'

  return [
    {
      day: 'Day 0',
      message: `Hi {{firstName}}, sharing a quick idea for {{company}}: ${brief.productName} helps with ${valueProp.toLowerCase()}. ${brief.cta}`,
    },
    {
      day: 'Day 3',
      message: `Quick follow-up, {{firstName}} - one useful signal: ${proof}. Happy to send a tailored sample for {{company}}.`,
    },
    {
      day: 'Day 7',
      message:
        'Last note from me. If launch messaging is still a bottleneck, I can send a concise workflow with examples specific to your channels.',
    },
  ]
}

function buildSyntheticName(company: string, index: number): string {
  const seed = Math.abs(hashString(company)) + index
  const first = FIRST_NAMES[seed % FIRST_NAMES.length]
  const last = LAST_NAMES[seed % LAST_NAMES.length]
  return `${first} ${last}`
}

function inferLeadEmail(lead: ProspectLead, index: number): string {
  const domain = domainFromWebsite(lead.website)
  if (!domain) {
    return ''
  }

  const names = lead.name.split(/\s+/).map((value) => value.toLowerCase())
  const first = names[0] || 'team'
  const last = names[1] || ''

  const pattern = index % 3
  if (pattern === 0 && last) {
    return `${first}.${last}@${domain}`
  }
  if (pattern === 1 && last) {
    return `${first[0]}${last}@${domain}`
  }
  return `${first}@${domain}`
}

function inferLinkedInUrl(lead: ProspectLead): string {
  const slug = slugify(lead.name)
  return slug ? `https://www.linkedin.com/in/${slug}` : ''
}

function pushActionRun(
  runs: ProspectActionRun[],
  input: {
    type: ProspectActionType
    status: ProspectActionStatus
    summary: string
    error?: string
  },
) {
  const now = new Date().toISOString()
  const nextRun: ProspectActionRun = {
    id: `run-${input.type}-${Date.now()}`,
    type: input.type,
    status: input.status,
    summary: input.summary,
    createdAt: now,
    updatedAt: now,
    error: input.error,
  }

  return [nextRun, ...runs].slice(0, MAX_ACTION_RUNS)
}

function applyTemplate(
  template: string,
  values: Record<string, string>,
): string {
  let output = template
  for (const [key, value] of Object.entries(values)) {
    output = output.replaceAll(`{{${key}}}`, value)
  }

  output = output.replaceAll(/\{\{[^}]+\}\}/g, '')
  return output.trim()
}

function dedupePersonalized(items: PersonalizedOutreach[]): PersonalizedOutreach[] {
  const seen = new Set<string>()
  const output: PersonalizedOutreach[] = []

  for (const item of items) {
    const key = `${item.leadId}:${item.emailSubject}:${item.emailBody}`
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    output.push(item)
  }

  return output
}

function scoreToTier(score: number): ProspectLeadTier {
  if (score >= 75) {
    return 'hot'
  }

  if (score >= 55) {
    return 'warm'
  }

  return 'cold'
}

function normalizeWebsite(value: string): string {
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) {
      return ''
    }
    return `${url.protocol}//${url.hostname}`
  } catch {
    return ''
  }
}

function sanitizeCompanyName(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'Unknown Company'
  }

  const first = trimmed.split(/[|:\-]/)[0]?.trim()
  return first || trimmed
}

function domainFromWebsite(website: string): string {
  try {
    const url = new URL(website)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function parseImportedContacts(rawContacts: string): ProspectLead[] {
  return rawContacts
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row, index) => parseImportedContactRow(row, index))
    .filter((lead): lead is ProspectLead => Boolean(lead))
}

function parseImportedContactRow(row: string, index: number): ProspectLead | null {
  const email = row.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || ''
  if (!email) {
    return null
  }

  const websiteMatch = row.match(/https?:\/\/[^\s,]+/i)?.[0] || ''
  const cleanPieces = row
    .replace(/[<>]/g, ' ')
    .split(',')
    .map((piece) => piece.trim())
    .filter(Boolean)
    .filter((piece) => piece !== email && piece !== websiteMatch)
  const domain = email.split('@')[1] || ''
  const inferredCompany = domain ? domain.split('.')[0] : ''
  const name = cleanPieces[0] && !cleanPieces[0].includes('@') ? cleanPieces[0] : humanizeNameFromEmail(email)
  const role = cleanPieces[1] && !cleanPieces[1].includes('@') ? cleanPieces[1] : 'Contact'
  const company = cleanPieces[2] || humanizeCompany(inferredCompany) || `Imported Contact ${index + 1}`
  const website = websiteMatch || (domain ? `https://${domain}` : '')

  return {
    id: '',
    name,
    role,
    company,
    website,
    email,
    linkedinUrl: '',
    xUrl: '',
    reason: 'Imported from email list.',
    source: 'imported-email-list',
    score: 72,
    tier: 'warm',
  }
}

function humanizeNameFromEmail(email: string): string {
  const local = email.split('@')[0] || 'Imported contact'
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map(capitalize)
    .join(' ')
}

function humanizeCompany(value: string): string {
  return value
    .split(/[._-]+/)
    .filter(Boolean)
    .map(capitalize)
    .join(' ')
}

function capitalize(value: string): string {
  return value ? `${value[0].toUpperCase()}${value.slice(1).toLowerCase()}` : ''
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return hash
}
