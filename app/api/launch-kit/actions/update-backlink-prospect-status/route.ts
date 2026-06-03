import {
  getJsonObjectField,
  getJsonStringField,
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readTrustedJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { normalizeSeoGrowthState } from '@/lib/launch-kit/normalizers'
import { runUpdateBacklinkProspectStatusAction } from '@/lib/launch-kit/seo'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await readTrustedJsonBody(request)

    const access = await requireLaunchApiAccess(request, {
      action: 'update_backlink_prospect_status',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const result = runUpdateBacklinkProspectStatusAction({
      seoGrowth: normalizeSeoGrowthState(getJsonObjectField(body, 'seoGrowth')),
      prospectId: getJsonStringField(body, 'prospectId', { maxLength: 128 }),
      status: getJsonStringField(body, 'status', { maxLength: 40 }),
    })
    await recordLaunchApiUsage(access, 'update_backlink_prospect_status')

    return privateJsonResponse(result)
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Backlink status action failed.',
      'backlink_status_action_failed',
    )
  }
}
