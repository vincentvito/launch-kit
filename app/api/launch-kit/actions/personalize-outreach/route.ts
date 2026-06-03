import {
  getJsonObjectField,
  getJsonStringArrayField,
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readTrustedJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { normalizeBrief, normalizeKit } from '@/lib/launch-kit/normalizers'
import { runPersonalizeOutreachAction } from '@/lib/launch-kit/prospecting'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await readTrustedJsonBody(request)
    const briefInput = getJsonObjectField(body, 'brief')
    const launchKitInput = getJsonObjectField(body, 'launchKit')

    if (!briefInput || !launchKitInput) {
      return privateJsonResponse({ error: 'brief and launchKit are required.' }, { status: 400 })
    }

    const brief = normalizeBrief(briefInput)
    const launchKit = normalizeKit(launchKitInput, brief.language || 'en')

    const access = await requireLaunchApiAccess(request, {
      action: 'personalize_outreach',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const result = runPersonalizeOutreachAction({
      brief,
      launchKit,
      selectedLeadIds: getJsonStringArrayField(body, 'selectedLeadIds', { maxLength: 128 }),
    })
    await recordLaunchApiUsage(access, 'personalize_outreach')

    return privateJsonResponse(result)
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Personalize outreach action failed.',
      'personalize_outreach_action_failed',
    )
  }
}
