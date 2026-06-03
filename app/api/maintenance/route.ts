import { launchApiErrorResponse, launchApiRouteErrorResponse, privateJsonResponse } from '@/lib/launch-kit/api-guard'
import { runLaunchKitMaintenance } from '@/lib/launch-kit/maintenance'
import { consumeRateLimit, getRateLimitPolicy } from '@/lib/launch-kit/rate-limit'
import { getSubjectKey } from '@/lib/launch-kit/security'
import { assertOrLogProductionReadiness } from '@/lib/observability'
import { verifyBearerToken } from '@/lib/secure-token'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: Request) {
  return runMaintenanceRequest(request)
}

export async function POST(request: Request) {
  return runMaintenanceRequest(request)
}

async function runMaintenanceRequest(request: Request) {
  try {
    assertOrLogProductionReadiness()
  } catch (error) {
    return launchApiErrorResponse(error)
  }

  const rateLimit = await consumeRateLimit({
    subjectKey: getSubjectKey(request),
    action: 'maintenance_admin',
    policy: getRateLimitPolicy('maintenance_admin', false),
  })

  if (!rateLimit.ok) {
    return privateJsonResponse(
      { error: 'Too many maintenance attempts. Try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.max(1, Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000))),
        },
      },
    )
  }

  if (!verifyMaintenanceToken(request.headers.get('authorization'))) {
    return privateJsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    return privateJsonResponse({
      ok: true,
      maintenance: await runLaunchKitMaintenance(),
    })
  } catch (error) {
    return launchApiRouteErrorResponse(error, 'Maintenance failed.', 'launch_kit_maintenance_failed')
  }
}

function verifyMaintenanceToken(authorizationHeader: string | null): boolean {
  return (
    verifyBearerToken(authorizationHeader, process.env.MAINTENANCE_ADMIN_TOKEN) ||
    verifyBearerToken(authorizationHeader, process.env.CRON_SECRET)
  )
}
