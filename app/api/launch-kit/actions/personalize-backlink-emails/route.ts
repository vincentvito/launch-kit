import {
  getJsonObjectField,
  getJsonStringArrayField,
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readTrustedJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { normalizeBrief, normalizeSeoGrowthState } from '@/lib/launch-kit/normalizers'
import { runPersonalizeBacklinkEmailsAction } from '@/lib/launch-kit/seo'

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
      action: 'personalize_backlink_emails',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const result = runPersonalizeBacklinkEmailsAction({
      brief: normalizeBrief(briefInput),
      seoGrowth: normalizeSeoGrowthState(getJsonObjectField(body, 'seoGrowth')),
      prospectIds: getJsonStringArrayField(body, 'prospectIds', { maxLength: 128 }),
    })
    await recordLaunchApiUsage(access, 'personalize_backlink_emails')

    return privateJsonResponse(result)
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Personalize backlink emails action failed.',
      'personalize_backlink_emails_action_failed',
    )
  }
}
