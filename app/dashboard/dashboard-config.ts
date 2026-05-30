import {
  type BacklinkProspectStatus,
  type ChannelCardTarget,
  type ChannelPackId,
  type GrowthBlockId,
  type LaunchAssetKind,
  type LaunchProjectSnapshot,
  type PlatformBlockId,
  type ProjectSummary,
} from '@/lib/launch-kit/types'
import { isPremiumAssetKind as isPremiumLaunchAssetKind } from '@/lib/launch-kit/plans'

export const GUEST_PROJECTS_KEY = 'launch-kit-guest-projects-v1'

export type TrafficChannelGroupId =
  | 'launch_platforms'
  | 'marketplaces'
  | 'social_community'
  | 'seo_ai_search'
  | 'outbound'
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
  | 'email_announcement'
  | 'linkedin_outreach'
  | 'x_outreach'
  | 'cold_email_outreach'
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
    channels: ['product_hunt', 'hacker_news', 'reddit', 'x', 'linkedin', 'indie_hackers', 'email_announcement', 'media_kit'],
  },
  {
    id: 'social_community',
    channels: ['threads', 'instagram', 'tiktok', 'youtube_shorts'],
  },
  {
    id: 'outbound',
    channels: ['linkedin_outreach', 'x_outreach', 'cold_email_outreach'],
  },
  {
    id: 'seo_ai_search',
    channels: ['website_seo', 'keyword_research', 'blog_cadence', 'geo_llm_visibility', 'comparison_alternatives'],
  },
  {
    id: 'email',
    channels: ['email_scrape_contacts', 'email_import_list'],
  },
  {
    id: 'authority_backlinks',
    channels: ['backlink_building', 'guest_posts', 'partner_pages', 'directory_outreach'],
  },
]

export const DEFAULT_OPEN_TRAFFIC_GROUPS: Record<TrafficChannelGroupId, boolean> = {
  launch_platforms: true,
  marketplaces: true,
  social_community: true,
  outbound: true,
  seo_ai_search: true,
  email: true,
  authority_backlinks: true,
  press_partnerships: true,
}

export const ASSET_NAV_ITEMS: LaunchAssetKind[] = ['screenshots', 'image_ads', 'video_ads', 'text_ads']

export const PREMIUM_TRAFFIC_CHANNEL_IDS: TrafficChannelId[] = [
  'threads',
  'instagram',
  'tiktok',
  'youtube_shorts',
  'linkedin_outreach',
  'x_outreach',
  'cold_email_outreach',
  'website_seo',
  'keyword_research',
  'blog_cadence',
  'geo_llm_visibility',
  'comparison_alternatives',
  'email_scrape_contacts',
  'email_import_list',
  'backlink_building',
  'guest_posts',
  'partner_pages',
  'directory_outreach',
]

export const DEFERRED_TRAFFIC_CHANNEL_IDS: TrafficChannelId[] = [
  'trustmrr',
  'acquire_com',
  'flippa',
  'launch_directories',
  'email_automation',
  'pr_pitch',
  'podcast_pitch',
  'newsletter_partnerships',
]

export function isPremiumTrafficChannel(channelId: TrafficChannelId): boolean {
  return PREMIUM_TRAFFIC_CHANNEL_IDS.includes(channelId)
}

export function isDeferredTrafficChannel(channelId: TrafficChannelId): boolean {
  return DEFERRED_TRAFFIC_CHANNEL_IDS.includes(channelId)
}

export function isPremiumAssetKind(assetKind: LaunchAssetKind): boolean {
  return isPremiumLaunchAssetKind(assetKind)
}

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
  selectedChannelPackIds?: ChannelPackId[]
  channelCardTarget?: ChannelCardTarget | null
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
