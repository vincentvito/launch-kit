import {
  getJsonObjectField,
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readTrustedJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { normalizeBrief, normalizeSeoGrowthState } from '@/lib/launch-kit/normalizers'
import { runWebsiteSeoAnalysisAction } from '@/lib/launch-kit/seo'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await readTrustedJsonBody(request)
    const briefInput = getJsonObjectField(body, 'brief')

    if (!briefInput) {
      return privateJsonResponse({ error: 'Brief is required.' }, { status: 400 })
    }

    const access = await requireLaunchApiAccess(request, {
      action: 'analyze_seo',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const result = runWebsiteSeoAnalysisAction({
      brief: normalizeBrief(briefInput),
      seoGrowth: normalizeSeoGrowthState(getJsonObjectField(body, 'seoGrowth')),
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
