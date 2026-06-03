import { runProspectAction } from '@/lib/launch-kit/prospecting'
import {
  getJsonObjectField,
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readTrustedJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { normalizeBrief } from '@/lib/launch-kit/normalizers'

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
      action: 'prospect',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const brief = normalizeBrief(briefInput)
    const result = await runProspectAction({
      brief,
      prospecting: getJsonObjectField(body, 'prospecting') || undefined,
    })
    await recordLaunchApiUsage(access, 'prospect', {
      productName: brief.productName,
    })

    return privateJsonResponse(result)
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Prospecting action failed.',
      'prospecting_action_failed',
    )
  }
}
