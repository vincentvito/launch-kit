import {
  getJsonObjectField,
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readTrustedJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { runScoreSegmentAction } from '@/lib/launch-kit/prospecting'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await readTrustedJsonBody(request)

    const access = await requireLaunchApiAccess(request, {
      action: 'score_segment',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const result = runScoreSegmentAction({
      prospecting: getJsonObjectField(body, 'prospecting') || undefined,
    })
    await recordLaunchApiUsage(access, 'score_segment')

    return privateJsonResponse(result)
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Score and segment action failed.',
      'score_segment_action_failed',
    )
  }
}
