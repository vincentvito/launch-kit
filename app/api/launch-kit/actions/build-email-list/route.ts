import {
  getJsonObjectField,
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readTrustedJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { runBuildEmailListAction } from '@/lib/launch-kit/prospecting'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await readTrustedJsonBody(request)

    const access = await requireLaunchApiAccess(request, {
      action: 'build_email_list',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const result = runBuildEmailListAction({
      prospecting: getJsonObjectField(body, 'prospecting') || undefined,
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
