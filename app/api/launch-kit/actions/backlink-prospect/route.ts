import {
  getJsonObjectField,
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readTrustedJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { normalizeBrief, normalizeSeoGrowthState } from '@/lib/launch-kit/normalizers'
import { runBacklinkProspectAction } from '@/lib/launch-kit/seo'

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
      action: 'backlink_prospect',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const result = await runBacklinkProspectAction({
      brief: normalizeBrief(briefInput),
      seoGrowth: normalizeSeoGrowthState(getJsonObjectField(body, 'seoGrowth')),
    })
    await recordLaunchApiUsage(access, 'backlink_prospect')

    return privateJsonResponse(result)
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Backlink prospect action failed.',
      'backlink_prospect_action_failed',
    )
  }
}
