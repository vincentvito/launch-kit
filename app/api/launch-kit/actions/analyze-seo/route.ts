import {
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { normalizeBrief, normalizeSeoGrowthState } from '@/lib/launch-kit/normalizers'
import { runWebsiteSeoAnalysisAction } from '@/lib/launch-kit/seo'
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
      action: 'analyze_seo',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const result = runWebsiteSeoAnalysisAction({
      brief: normalizeBrief(body.brief),
      seoGrowth: normalizeSeoGrowthState(body.seoGrowth),
    })
    await recordLaunchApiUsage(access, 'analyze_seo')

    return privateJsonResponse(result)
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'SEO analysis action failed.',
      'seo_analysis_action_failed',
    )
  }
}
