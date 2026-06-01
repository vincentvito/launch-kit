import { createBillingPortalSession } from '@/lib/billing'
import {
  launchApiRouteErrorResponse,
  privateJsonResponse,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const access = await requireLaunchApiAccess(request, {
      action: 'billing_portal',
      feature: 'free',
      rateLimitAction: 'project_write',
    })

    if (!access.session) {
      return privateJsonResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    const portal = await createBillingPortalSession({
      userId: access.session.user.id,
    })
    await recordLaunchApiUsage(access, 'billing_portal')

    return privateJsonResponse(portal)
  } catch (error) {
    return launchApiRouteErrorResponse(error, 'Could not open billing portal.', 'billing_portal_failed')
  }
}
