import {
  type ChannelPackId,
  type GrowthBlockId,
  type LaunchAssetKind,
  type PlatformBlockId,
} from '@/lib/launch-kit/types'

export const FREE_PLATFORM_BLOCK_IDS: readonly PlatformBlockId[] = [
  'product_hunt',
  'hacker_news',
  'email_announcement',
] as const

export const FREE_CHANNEL_PACK_IDS: readonly ChannelPackId[] = [
  'x',
  'reddit',
  'linkedin',
  'indie_hackers',
] as const

export const FREE_CHANNEL_CARD_IDS: Partial<Record<ChannelPackId, readonly string[]>> = {
  x: ['x-launch-post', 'x-short-thread'],
  reddit: ['reddit-cautious-discussion', 'reddit-self-promo-launch'],
  linkedin: ['linkedin-founder-launch'],
  indie_hackers: ['indie-hackers-founder-launch'],
}

export const PREMIUM_PLATFORM_BLOCK_IDS: readonly PlatformBlockId[] = [
  'tiktok',
  'youtube_shorts',
] as const

export const PREMIUM_CHANNEL_PACK_IDS: readonly ChannelPackId[] = [
  'threads',
  'instagram',
  'tiktok',
  'youtube_shorts',
] as const

export const PREMIUM_GROWTH_BLOCK_IDS: readonly GrowthBlockId[] = [
  'linkedin_outreach',
  'x_outreach',
  'cold_email_outreach',
  'seo_posts',
] as const

export const PREMIUM_ASSET_KINDS: readonly LaunchAssetKind[] = [
  'screenshots',
  'image_ads',
  'video_ads',
  'text_ads',
] as const

export function isFreeChannelCard(channelId: ChannelPackId, cardId: string): boolean {
  const freeCards = FREE_CHANNEL_CARD_IDS[channelId]
  return !freeCards || freeCards.includes(cardId)
}

export function isPremiumChannelPack(channelId: ChannelPackId): boolean {
  return PREMIUM_CHANNEL_PACK_IDS.includes(channelId)
}

export function isPremiumPlatformBlock(blockId: PlatformBlockId): boolean {
  return PREMIUM_PLATFORM_BLOCK_IDS.includes(blockId)
}

export function isPremiumGrowthBlock(blockId: GrowthBlockId): boolean {
  return PREMIUM_GROWTH_BLOCK_IDS.includes(blockId)
}

export function isPremiumAssetKind(kind: LaunchAssetKind): boolean {
  return PREMIUM_ASSET_KINDS.includes(kind)
}
