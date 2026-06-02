import {
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { normalizeBrief, normalizeSeoGrowthState } from '@/lib/launch-kit/normalizers'
import { runBlogStrategyAction } from '@/lib/launch-kit/seo'
import type { ExtractedBrief, SeoGrowthState } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{
      brief?: Partial<ExtractedBrief>
      seoGrowth?: Partial<SeoGrowthState>
    }>(request)

    if (!body.brief) {
      return privateJsonResponse({ error: 'Brief is required.' }, { status: 400 })
    }

    const access = await requireLaunchApiAccess(request, {
      action: 'blog_strategy',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const result = runBlogStrategyAction({
      brief: normalizeBrief(body.brief),
      seoGrowth: normalizeSeoGrowthState(body.seoGrowth),
    })
    await recordLaunchApiUsage(access, 'blog_strategy')

    return privateJsonResponse(result)
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Blog strategy action failed.',
      'blog_strategy_action_failed',
    )
  }
}
