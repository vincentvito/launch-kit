import {
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { runBuildEmailListAction } from '@/lib/launch-kit/prospecting'
import type { ProspectingState } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{
      prospecting?: ProspectingState
    }>(request)

    const access = await requireLaunchApiAccess(request, {
      action: 'build_email_list',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const result = runBuildEmailListAction({
      prospecting: body.prospecting,
    })
    await recordLaunchApiUsage(access, 'build_email_list')

    return privateJsonResponse(result)
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Build email list action failed.',
      'build_email_list_action_failed',
    )
  }
}
