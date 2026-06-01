import {
  generateLaunchKit,
  parseChannelCardTarget,
  parseSelectedBlockIds,
  parseSelectedChannelPackIds,
  parseSelectedGrowthBlockIds,
} from '@/lib/launch-kit/generator'
import { normalizeBrief } from '@/lib/launch-kit/normalizers'
import {
  isFreeChannelCard,
  isPremiumChannelPack,
  isPremiumGrowthBlock,
  isPremiumPlatformBlock,
} from '@/lib/launch-kit/plans'
import {
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { completeLaunchJob, createLaunchJob } from '@/lib/launch-kit/jobs'
import type { ExtractedBrief, LaunchKit } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let jobId: string | undefined

  try {
    const body = await readJsonBody<{
      brief?: ExtractedBrief
      selectedBlocks?: unknown
      selectedChannelPackIds?: unknown
      channelCardTarget?: unknown
      selectedGrowthBlocks?: unknown
      includeMediaKit?: boolean
      includeGrowthAssets?: boolean
      existingKit?: LaunchKit | null
    }>(request, { maxBytes: 2 * 1024 * 1024 })

    if (!body.brief) {
      return privateJsonResponse({ error: 'Brief is required.' }, { status: 400 })
    }

    const selectedBlocks =
      body.selectedBlocks === undefined ? undefined : parseSelectedBlockIds(body.selectedBlocks)
    const selectedChannelPackIds =
      body.selectedChannelPackIds === undefined
        ? undefined
        : parseSelectedChannelPackIds(body.selectedChannelPackIds)
    const channelCardTarget = parseChannelCardTarget(body.channelCardTarget)
    const selectedGrowthBlocks =
      body.selectedGrowthBlocks === undefined
        ? undefined
        : parseSelectedGrowthBlockIds(body.selectedGrowthBlocks)
    const wantsPremium =
      (selectedBlocks || []).some(isPremiumPlatformBlock) ||
      (selectedChannelPackIds || []).some(isPremiumChannelPack) ||
      (selectedGrowthBlocks || []).some(isPremiumGrowthBlock) ||
      Boolean(
        channelCardTarget &&
          (isPremiumChannelPack(channelCardTarget.channelId) ||
            !isFreeChannelCard(channelCardTarget.channelId, channelCardTarget.cardId)),
      )
    const access = await requireLaunchApiAccess(request, {
      action: 'generate',
      feature: wantsPremium ? 'premium' : 'free',
      allowAnonymous: true,
      rateLimitAction: wantsPremium ? 'generate_premium' : 'generate_free',
    })

    const brief = normalizeBrief(body.brief)
    const job = await createLaunchJob({
      userId: access.session?.user.id,
      subjectKey: access.subjectKey,
      action: wantsPremium ? 'generate_premium' : 'generate_free',
      payload: {
        sourceUrl: brief.sourceUrl,
        productName: brief.productName,
        selectedBlocks,
        selectedChannelPackIds,
        channelCardTarget,
        selectedGrowthBlocks,
      },
    })
    jobId = job.id
    const launchKit = await generateLaunchKit({
      brief,
      selectedBlocks,
      selectedChannelPackIds,
      channelCardTarget,
      selectedGrowthBlocks,
      includeMediaKit: typeof body.includeMediaKit === 'boolean' ? body.includeMediaKit : true,
      includeGrowthAssets:
        typeof body.includeGrowthAssets === 'boolean' ? body.includeGrowthAssets : true,
      existingKit: body.existingKit ?? null,
    })
    await recordLaunchApiUsage(access, wantsPremium ? 'generate_premium' : 'generate_free', {
      productName: brief.productName,
      sourceUrl: brief.sourceUrl,
    })
    await completeLaunchJob({
      jobId,
      result: {
        productName: brief.productName,
        language: launchKit.language,
      },
    })

    return privateJsonResponse({ launchKit, jobId })
  } catch (error) {
    if (jobId) {
      await completeLaunchJob({ jobId, error }).catch(() => undefined)
    }

    return launchApiRouteErrorResponse(
      error,
      'Failed to generate launch kit.',
      'launch_kit_generate_failed',
    )
  }
}
