import {
  getJsonObjectField,
  getJsonStringArrayField,
  getJsonStringField,
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readTrustedJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { normalizeSeoGrowthState } from '@/lib/launch-kit/normalizers'
import { runAddBacklinkProspectsToListAction } from '@/lib/launch-kit/seo'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await readTrustedJsonBody(request)

    const access = await requireLaunchApiAccess(request, {
      action: 'add_backlink_prospects_to_list',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const result = runAddBacklinkProspectsToListAction({
      seoGrowth: normalizeSeoGrowthState(getJsonObjectField(body, 'seoGrowth')),
      prospectIds: getJsonStringArrayField(body, 'prospectIds', { maxLength: 128 }),
      listName: getJsonStringField(body, 'listName', { maxLength: 120 }),
    })
    await recordLaunchApiUsage(access, 'add_backlink_prospects_to_list')

    return privateJsonResponse(result)
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Backlink list action failed.',
      'backlink_list_action_failed',
    )
  }
}
