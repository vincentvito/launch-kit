import {
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { runScoreSegmentAction } from '@/lib/launch-kit/prospecting'
import type { ProspectingState } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{
      prospecting?: ProspectingState
    }>(request)

    const access = await requireLaunchApiAccess(request, {
      action: 'score_segment',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const result = runScoreSegmentAction({
      prospecting: body.prospecting,
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
