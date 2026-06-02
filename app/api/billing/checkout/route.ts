import { createCheckoutSession } from '@/lib/billing'
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
      action: 'billing_checkout',
      feature: 'free',
      rateLimitAction: 'project_write',
    })

    if (!access.session) {
      return privateJsonResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    const checkout = await createCheckoutSession({
      userId: access.session.user.id,
      email: access.session.user.email,
    })
    await recordLaunchApiUsage(access, 'billing_checkout')

    return privateJsonResponse(checkout)
  } catch (error) {
    return launchApiRouteErrorResponse(error, 'Could not start checkout.', 'billing_checkout_failed')
  }
}
