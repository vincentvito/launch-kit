import {
  getJsonObjectField,
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readTrustedJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { normalizeBrief, normalizeKit } from '@/lib/launch-kit/normalizers'
import { runFollowUpSequenceAction } from '@/lib/launch-kit/prospecting'

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
      action: 'followup_sequences',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const result = runFollowUpSequenceAction({
      brief,
      launchKit,
    })
    await recordLaunchApiUsage(access, 'followup_sequences')

    return privateJsonResponse(result)
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Follow-up sequence action failed.',
      'followup_sequence_action_failed',
    )
  }
}
