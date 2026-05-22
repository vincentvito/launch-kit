export const PLATFORM_IDS = [
  'product_hunt',
  'hacker_news',
  'reddit',
  'indie_hackers',
  'linkedin',
  'tiktok',
  'youtube_shorts',
  'email_announcement',
] as const

export type PlatformBlockId = (typeof PLATFORM_IDS)[number]

export const GROWTH_BLOCK_IDS = [
  'linkedin_outreach',
  'x_outreach',
  'cold_email_outreach',
  'seo_posts',
] as const

export type GrowthBlockId = (typeof GROWTH_BLOCK_IDS)[number]

export type PlatformBlock = {
  id: PlatformBlockId
  label: string
  title: string
  body: string
  cta: string
  notes: string
}

export type KeywordIntent = 'informational' | 'commercial' | 'transactional' | 'navigational'
export type KeywordPriority = 'high' | 'medium' | 'low'

export type KeywordCluster = {
  id: string
  topic: string
  intent: KeywordIntent
  priority: KeywordPriority
  keywords: string[]
  contentAngles: string[]
}

export type KeywordResearch = {
  generatedAt: string
  clusters: KeywordCluster[]
  notes: string
}

export type MediaKitContact = {
  founderName: string
  founderBio: string
  companyName: string
  companyBio: string
  website: string
  email: string
  contactPhone: string
  socialX: string
  socialLinkedIn: string
}

export type MediaKit = {
  founderCompanyBio: string
  productOneLiner: string
  boilerplate: string
  pressRelease: string
  keyVisualsChecklist: string[]
  screenshotsAndLogos: string
  contactDetails: string
}

export type ExtractedBrief = {
  sourceUrl: string
  productName: string
  positioning: string
  targetUsers: string[]
  icp: string
  painPoints: string[]
  valueProps: string[]
  keyClaims: string[]
  proofPoints: string[]
  cta: string
  language: string
  sourceHighlights: string[]
  detectedImageUrls: string[]
  crawlPages: string[]
  keywordResearch: KeywordResearch
}

export type OutreachVariant = {
  id: string
  title: string
  subject?: string
  message: string
  cta: string
}

export type OutreachPack = {
  channel: 'linkedin' | 'x' | 'email'
  notes: string
  variants: OutreachVariant[]
  personalizationTemplate: string
}

export type SeoPostPack = {
  id: string
  keywordClusterId: string
  keywordTopic: string
  title: string
  metaDescription: string
  outline: string[]
  draft: string
  cta: string
}

export type FollowUpSequence = {
  day: string
  message: string
}

export type GrowthAssets = {
  generatedAt: string
  linkedinOutreach: OutreachPack
  xOutreach: OutreachPack
  emailOutreach: OutreachPack
  seoPostPacks: SeoPostPack[]
  followUpSequences: FollowUpSequence[]
}

export type ProspectLeadTier = 'hot' | 'warm' | 'cold'

export type ProspectLead = {
  id: string
  name: string
  role: string
  company: string
  website: string
  email: string
  linkedinUrl: string
  xUrl: string
  reason: string
  source: string
  score: number
  tier: ProspectLeadTier
}

export type ProspectActionType =
  | 'prospect'
  | 'build_email_list'
  | 'personalize_outreach'
  | 'send_outreach_email'
  | 'score_segment'
  | 'export_leads'
  | 'followup_sequences'

export type ProspectActionStatus =
  | 'pending_approval'
  | 'approved'
  | 'running'
  | 'completed'
  | 'failed'

export type ProspectActionRun = {
  id: string
  type: ProspectActionType
  status: ProspectActionStatus
  summary: string
  createdAt: string
  updatedAt: string
  error?: string
}

export type OutreachEmailJob = {
  id: string
  status: 'queued' | 'completed'
  leadIds: string[]
  subject: string
  bodyPreview: string
  createdAt: string
  completedAt?: string
}

export type PersonalizedOutreach = {
  id: string
  leadId: string
  leadName: string
  company: string
  linkedinMessage: string
  xMessage: string
  emailSubject: string
  emailBody: string
  createdAt: string
}

export type ProspectingState = {
  queryHints: string[]
  leads: ProspectLead[]
  personalizedOutreach: PersonalizedOutreach[]
  actionRuns: ProspectActionRun[]
  emailJobs: OutreachEmailJob[]
  lastScrapeAt: string
  lastEmailBuildAt: string
}

export type LaunchKit = {
  generatedAt: string
  language: string
  platformBlocks: Record<PlatformBlockId, PlatformBlock>
  mediaKit: MediaKit
  growthAssets: GrowthAssets
  prospecting: ProspectingState
}

export type LaunchProjectSnapshot = {
  id: string
  name: string
  sourceUrl: string
  language: string
  brief: ExtractedBrief
  kit: LaunchKit
  createdAt: string
  updatedAt: string
}

export type ProjectSummary = {
  id: string
  name: string
  sourceUrl: string
  language: string
  updatedAt: string
}

export const PLATFORM_LABELS: Record<PlatformBlockId, string> = {
  product_hunt: 'Product Hunt',
  hacker_news: 'Hacker News (Show HN)',
  reddit: 'Reddit',
  indie_hackers: 'Indie Hackers',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok Script',
  youtube_shorts: 'YouTube Shorts Script',
  email_announcement: 'Email Announcement',
}

export const GROWTH_BLOCK_LABELS: Record<GrowthBlockId, string> = {
  linkedin_outreach: 'LinkedIn Cold Outreach',
  x_outreach: 'X Cold Outreach',
  cold_email_outreach: 'Cold Outreach Email',
  seo_posts: 'SEO Blog Post Packs',
}
