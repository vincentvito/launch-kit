import {
  type BacklinkProspectStatus,
  type GrowthBlockId,
  type LaunchAssetKind,
  type LaunchProjectSnapshot,
  type PlatformBlockId,
  type ProjectSummary,
} from '@/lib/launch-kit/types'

export const GUEST_PROJECTS_KEY = 'launch-kit-guest-projects-v1'

export type TrafficChannelGroupId =
  | 'launch_platforms'
  | 'marketplaces'
  | 'social_community'
  | 'seo_ai_search'
  | 'email'
  | 'authority_backlinks'
  | 'press_partnerships'

export type TrafficChannelId =
  | 'product_hunt'
  | 'hacker_news'
  | 'indie_hackers'
  | 'launch_directories'
  | 'trustmrr'
  | 'acquire_com'
  | 'flippa'
  | 'x'
  | 'linkedin'
  | 'threads'
  | 'reddit'
  | 'instagram'
  | 'tiktok'
  | 'youtube_shorts'
  | 'website_seo'
  | 'keyword_research'
  | 'blog_cadence'
  | 'geo_llm_visibility'
  | 'comparison_alternatives'
  | 'email_scrape_contacts'
  | 'email_import_list'
  | 'email_automation'
  | 'backlink_building'
  | 'guest_posts'
  | 'partner_pages'
  | 'directory_outreach'
  | 'media_kit'
  | 'pr_pitch'
  | 'podcast_pitch'
  | 'newsletter_partnerships'

export type TrafficChannelGroup = {
  id: TrafficChannelGroupId
  channels: TrafficChannelId[]
}

export type ResultBrowserSection = 'channels' | 'assets'

export const TRAFFIC_CHANNEL_GROUPS: TrafficChannelGroup[] = [
  {
    id: 'launch_platforms',
    channels: ['product_hunt', 'hacker_news', 'indie_hackers', 'launch_directories'],
  },
  {
    id: 'marketplaces',
    channels: ['trustmrr', 'acquire_com', 'flippa'],
  },
  {
    id: 'social_community',
    channels: ['x', 'linkedin', 'threads', 'reddit', 'instagram', 'tiktok', 'youtube_shorts'],
  },
  {
    id: 'seo_ai_search',
    channels: ['website_seo', 'keyword_research', 'blog_cadence', 'geo_llm_visibility', 'comparison_alternatives'],
  },
  {
    id: 'email',
    channels: ['email_scrape_contacts', 'email_import_list', 'email_automation'],
  },
  {
    id: 'authority_backlinks',
    channels: ['backlink_building', 'guest_posts', 'partner_pages', 'directory_outreach'],
  },
  {
    id: 'press_partnerships',
    channels: ['media_kit', 'pr_pitch', 'podcast_pitch', 'newsletter_partnerships'],
  },
]

export const DEFAULT_OPEN_TRAFFIC_GROUPS: Record<TrafficChannelGroupId, boolean> = {
  launch_platforms: true,
  marketplaces: true,
  social_community: true,
  seo_ai_search: true,
  email: true,
  authority_backlinks: true,
  press_partnerships: true,
}

export const ASSET_NAV_ITEMS: LaunchAssetKind[] = ['screenshots', 'image_ads', 'video_ads', 'text_ads']

export const MARKETPLACE_CHANNEL_URLS: Partial<Record<TrafficChannelId, string>> = {
  trustmrr: 'https://trustmrr.com/',
  acquire_com: 'https://acquire.com/',
  flippa: 'https://flippa.com/',
}

export type SavedProjectItem = ProjectSummary & {
  storage: 'server' | 'guest'
  snapshot?: LaunchProjectSnapshot
}

export type DashboardStep = 1 | 2 | 3
export type OnboardingCardIndex = 0 | 1 | 2
export type StepStatus = 'locked' | 'active' | 'complete'
export type GenerateContentInput = {
  selectedBlocks?: PlatformBlockId[]
  selectedGrowthBlocks?: GrowthBlockId[]
  includeMediaKit?: boolean
  includeGrowthAssets?: boolean
}

export const BACKLINK_STATUS_OPTIONS: BacklinkProspectStatus[] = [
  'new',
  'first_contact',
  'second_contact',
  'in_negotiation',
  'closed',
  'rejected',
]
