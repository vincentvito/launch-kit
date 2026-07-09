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

export const CHANNEL_PACK_IDS = [
  'x',
  'linkedin',
  'threads',
  'reddit',
  'indie_hackers',
  'instagram',
  'tiktok',
  'youtube_shorts',
] as const

export type ChannelPackId = (typeof CHANNEL_PACK_IDS)[number]
export type ChannelCardStage = 'pre_launch' | 'launch_day' | 'follow_up' | 'evergreen'

export type ChannelCard = {
  id: string
  title: string
  body: string
  cta: string
  proofPoint: string
  stage: ChannelCardStage
  format: string
  socialContractNote: string
  qualityChecks: string[]
}

export type ChannelPack = {
  id: ChannelPackId
  label: string
  notes: string
  cards: ChannelCard[]
  redditRecommendations?: RedditRecommendations
}

export type ChannelCardTarget = {
  channelId: ChannelPackId
  cardId: string
}

export type SubredditRecommendation = {
  name: string
  url: string
  reason: string
  postingGuidance: string
}

export type RedditRecommendations = {
  engagementSubreddits: SubredditRecommendation[]
  selfPromotionSubreddits: SubredditRecommendation[]
}

export type ProductHuntLaunchContent = {
  tagline: string
  description: string
  tags: string[]
  firstComment: string
}

export type HackerNewsLaunchContent = {
  showHnTitle: string
  postBody: string
  feedbackAsk: string
  discussionSeed: string
}

export type RedditLaunchContent = {
  postTitle: string
  postBody: string
  builderDisclosure: string
  discussionQuestion: string
  linkPolicyNote: string
}

export type IndieHackersLaunchContent = {
  postTitle: string
  founderStory: string
  lesson: string
  proofOrMetric: string
  nextExperiment: string
  feedbackAsk: string
}

export type LinkedInLaunchContent = {
  hook: string
  postBody: string
  proofPoint: string
  closingCta: string
}

export type TikTokLaunchContent = {
  hook: string
  spokenScript: string
  visualBeats: string[]
  onScreenText: string[]
  closeCta: string
}

export type YouTubeShortsLaunchContent = {
  title: string
  hook: string
  spokenScript: string
  visualBeats: string[]
  retentionCue: string
  closeCta: string
}

export type EmailAnnouncementLaunchContent = {
  subject: string
  previewText: string
  greeting: string
  opening: string
  body: string
  ctaText: string
  signoff: string
}

export type PlatformBlock = {
  id: PlatformBlockId
  label: string
  title: string
  body: string
  cta: string
  notes: string
  productHunt?: ProductHuntLaunchContent
  hackerNews?: HackerNewsLaunchContent
  reddit?: RedditLaunchContent
  indieHackers?: IndieHackersLaunchContent
  linkedin?: LinkedInLaunchContent
  tiktok?: TikTokLaunchContent
  youtubeShorts?: YouTubeShortsLaunchContent
  emailAnnouncement?: EmailAnnouncementLaunchContent
  redditRecommendations?: RedditRecommendations
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
  voiceGuide: string
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

export type LaunchAssetKind = 'screenshots' | 'image_ads' | 'video_ads' | 'text_ads'
export type LaunchAssetMediaType = 'image' | 'video' | 'text'
export type LaunchAssetFormat = '16:9' | '9:16' | '1:1' | '4:5' | '1.91:1' | 'text'
export type GeneratedLaunchAssetStatus = 'succeeded' | 'failed'

export type LaunchAssetTemplate = {
  id: string
  kind: LaunchAssetKind
  mediaType: LaunchAssetMediaType
  title: string
  description: string
  angle: string
  formats: LaunchAssetFormat[]
  recommendedFormats: LaunchAssetFormat[]
  durationSeconds?: number
}

export type GeneratedLaunchAsset = {
  id: string
  templateId: string
  kind: LaunchAssetKind
  mediaType: LaunchAssetMediaType
  format: LaunchAssetFormat
  status: GeneratedLaunchAssetStatus
  title: string
  prompt: string
  outputUrl: string
  outputText: string
  replicatePredictionId: string
  error: string
  createdAt: string
  updatedAt: string
}

export type AssetLibrary = {
  templates: LaunchAssetTemplate[]
  generatedAssets: GeneratedLaunchAsset[]
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

export type SeoCheckStatus = 'pass' | 'warning' | 'fail'

export type WebsiteSeoCheck = {
  id: string
  label: string
  status: SeoCheckStatus
  detail: string
}

export type WebsiteSeoAnalysis = {
  generatedAt: string
  score: number
  summary: string
  strengths: string[]
  fixes: string[]
  checks: WebsiteSeoCheck[]
  llmReadinessNotes: string[]
}

export type BlogStrategyPost = {
  id: string
  dayOffset: number
  keywordClusterId: string
  keywordTopic: string
  title: string
  intent: KeywordIntent
  targetKeywords: string[]
  tableIdeas: string[]
  outline: string[]
  llmNotes: string[]
  cta: string
}

export type FreeToolSuggestion = {
  id: string
  category: string
  title: string
  url: string
  workflow: string
}

export type BacklinkProspectStatus =
  | 'new'
  | 'first_contact'
  | 'second_contact'
  | 'in_negotiation'
  | 'closed'
  | 'rejected'

export type BacklinkProspect = {
  id: string
  website: string
  domain: string
  title: string
  contactName: string
  contactEmail: string
  scrapedSummary: string
  relevanceReason: string
  backlinkAngle: string
  costToList: number | null
  estimatedTraffic: number | null
  relevanceScore: number
  trafficScore: number
  authorityScore: number
  contactabilityScore: number
  costScore: number
  valueScore: number
  status: BacklinkProspectStatus
  listIds: string[]
  customizedEmailSubject: string
  customizedEmailBody: string
  source: string
  discoveredAt: string
  lastContactedAt: string
}

export type BacklinkProspectList = {
  id: string
  name: string
  description: string
  prospectIds: string[]
  createdAt: string
  updatedAt: string
}

export type BacklinkEmailJob = {
  id: string
  status: 'queued' | 'completed'
  prospectIds: string[]
  subject: string
  bodyPreview: string
  createdAt: string
  completedAt?: string
}

export type SeoGrowthState = {
  websiteAnalysis: WebsiteSeoAnalysis | null
  blogStrategy: BlogStrategyPost[]
  freeTools: FreeToolSuggestion[]
  backlinkProspects: BacklinkProspect[]
  prospectLists: BacklinkProspectList[]
  backlinkEmailJobs: BacklinkEmailJob[]
  lastAnalyzedAt: string
  lastBlogStrategyAt: string
  lastBacklinkScrapeAt: string
  lastBacklinkEmailAt: string
}

export type LaunchKit = {
  generatedAt: string
  language: string
  platformBlocks: Record<PlatformBlockId, PlatformBlock>
  channelPacks: Record<ChannelPackId, ChannelPack>
  mediaKit: MediaKit
  assetLibrary: AssetLibrary
  growthAssets: GrowthAssets
  prospecting: ProspectingState
  seoGrowth: SeoGrowthState
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

export const CHANNEL_PACK_LABELS: Record<ChannelPackId, string> = {
  x: 'X',
  linkedin: 'LinkedIn',
  threads: 'Threads',
  reddit: 'Reddit',
  indie_hackers: 'Indie Hackers',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube_shorts: 'YouTube Shorts',
}

export const DEFAULT_LAUNCH_ASSET_TEMPLATES: LaunchAssetTemplate[] = [
  {
    id: 'screenshot_product_showcase',
    kind: 'screenshots',
    mediaType: 'image',
    title: 'Product Showcase Screenshot',
    description: 'A polished website screenshot on a gradient launch background.',
    angle: 'Turn the live product page into a premium launch visual with a short editorial title.',
    formats: ['16:9', '9:16'],
    recommendedFormats: ['16:9', '9:16'],
  },
  {
    id: 'image_ad_problem_solution',
    kind: 'image_ads',
    mediaType: 'image',
    title: 'Problem / Solution',
    description: 'A direct ad creative that contrasts pain with the promised outcome.',
    angle: 'Show the audience problem clearly, then introduce the product as the clean solution.',
    formats: ['1:1', '4:5', '9:16', '1.91:1', '16:9'],
    recommendedFormats: ['1:1', '4:5', '9:16'],
  },
  {
    id: 'image_ad_social_proof',
    kind: 'image_ads',
    mediaType: 'image',
    title: 'Social Proof',
    description: 'A credibility-first ad using proof points and trust cues.',
    angle: 'Make the strongest available proof feel specific, credible, and easy to scan.',
    formats: ['1:1', '4:5', '9:16', '1.91:1', '16:9'],
    recommendedFormats: ['1:1', '4:5', '1.91:1'],
  },
  {
    id: 'image_ad_feature_benefit',
    kind: 'image_ads',
    mediaType: 'image',
    title: 'Feature to Benefit',
    description: 'A product-led ad that translates a core feature into a user outcome.',
    angle: 'Visualize one product capability and the practical benefit it creates.',
    formats: ['1:1', '4:5', '9:16', '1.91:1', '16:9'],
    recommendedFormats: ['1:1', '16:9', '9:16'],
  },
  {
    id: 'image_ad_before_after',
    kind: 'image_ads',
    mediaType: 'image',
    title: 'Before / After',
    description: 'A transformation ad for showing what changes after adoption.',
    angle: 'Contrast the old workflow with the improved state after using the product.',
    formats: ['1:1', '4:5', '9:16', '1.91:1', '16:9'],
    recommendedFormats: ['4:5', '9:16', '16:9'],
  },
  {
    id: 'image_ad_offer_cta',
    kind: 'image_ads',
    mediaType: 'image',
    title: 'Offer CTA',
    description: 'A conversion-focused ad centered on a clear next step.',
    angle: 'Make the call to action feel low-friction, useful, and connected to the product promise.',
    formats: ['1:1', '4:5', '9:16', '1.91:1', '16:9'],
    recommendedFormats: ['1.91:1', '1:1', '9:16'],
  },
  {
    id: 'video_ad_hook_problem_fix',
    kind: 'video_ads',
    mediaType: 'video',
    title: 'Hook / Problem / Fix',
    description: 'A short-form video ad with an immediate hook and clear resolution.',
    angle: 'Open on a familiar problem, show the friction, then reveal the product fix.',
    formats: ['16:9', '9:16'],
    recommendedFormats: ['9:16', '16:9'],
    durationSeconds: 8,
  },
  {
    id: 'video_ad_product_walkthrough',
    kind: 'video_ads',
    mediaType: 'video',
    title: 'Product Walkthrough',
    description: 'A quick product-motion ad for showing the core workflow.',
    angle: 'Move through the product experience as a concise visual story with one outcome.',
    formats: ['16:9', '9:16'],
    recommendedFormats: ['16:9', '9:16'],
    durationSeconds: 8,
  },
  {
    id: 'video_ad_founder_story',
    kind: 'video_ads',
    mediaType: 'video',
    title: 'Founder Story',
    description: 'A founder-led narrative ad about why the product exists.',
    angle: 'Frame the product as the answer to a lived customer or founder pain.',
    formats: ['16:9', '9:16'],
    recommendedFormats: ['9:16'],
    durationSeconds: 8,
  },
  {
    id: 'video_ad_social_proof',
    kind: 'video_ads',
    mediaType: 'video',
    title: 'Proof Montage',
    description: 'A credibility montage built around proof, outcomes, and trust.',
    angle: 'Sequence proof cues, user outcomes, and a calm CTA without hype.',
    formats: ['16:9', '9:16'],
    recommendedFormats: ['16:9', '9:16'],
    durationSeconds: 8,
  },
  {
    id: 'video_ad_objection_handler',
    kind: 'video_ads',
    mediaType: 'video',
    title: 'Objection Handler',
    description: 'A concise video ad that answers the audience’s first hesitation.',
    angle: 'Acknowledge the likely objection, then show why the product makes the next step easier.',
    formats: ['16:9', '9:16'],
    recommendedFormats: ['9:16'],
    durationSeconds: 8,
  },
  {
    id: 'text_ad_x_short',
    kind: 'text_ads',
    mediaType: 'text',
    title: 'X Short Post',
    description: 'A compact X ad with one punchy idea and CTA.',
    angle: 'Write a short paid-style X post that creates curiosity without sounding clickbait.',
    formats: ['text'],
    recommendedFormats: ['text'],
  },
  {
    id: 'text_ad_x_thread',
    kind: 'text_ads',
    mediaType: 'text',
    title: 'X Thread',
    description: 'A short X thread that builds from problem to product.',
    angle: 'Write a concise X thread with a strong opener, clear stakes, and a soft CTA.',
    formats: ['text'],
    recommendedFormats: ['text'],
  },
  {
    id: 'text_ad_threads_post',
    kind: 'text_ads',
    mediaType: 'text',
    title: 'Threads Post',
    description: 'A conversational Threads ad with native, casual pacing.',
    angle: 'Write a conversational Threads post that feels human, useful, and easy to reply to.',
    formats: ['text'],
    recommendedFormats: ['text'],
  },
  {
    id: 'text_ad_threads_thread',
    kind: 'text_ads',
    mediaType: 'text',
    title: 'Threads Thread',
    description: 'A compact Threads sequence for story-led promotion.',
    angle: 'Write a short Threads sequence that moves from relatable pain to practical next step.',
    formats: ['text'],
    recommendedFormats: ['text'],
  },
]
