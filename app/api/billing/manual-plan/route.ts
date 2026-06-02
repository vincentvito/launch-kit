import { launchApiErrorResponse, privateJsonResponse, readJsonBody } from '@/lib/launch-kit/api-guard'
import { setManualLaunchPlan } from '@/lib/launch-kit/entitlements'
import type { LaunchPlan } from '@/lib/launch-kit/entitlements'
import { consumeRateLimit, getRateLimitPolicy } from '@/lib/launch-kit/rate-limit'
import { getSubjectKey } from '@/lib/launch-kit/security'
import { verifyBearerToken } from '@/lib/secure-token'

export const runtime = 'nodejs'

const MANUAL_PLANS = new Set<LaunchPlan>(['free', 'premium', 'admin'])
const MANUAL_STATUSES = new Set(['manual', 'active', 'trialing', 'past_due', 'canceled', 'inactive'])

export async function POST(request: Request) {
  const rateLimit = await consumeRateLimit({
    subjectKey: getSubjectKey(request),
    action: 'billing_admin',
    policy: getRateLimitPolicy('billing_admin', false),
  })

  if (!rateLimit.ok) {
    return privateJsonResponse(
      { error: 'Too many billing admin attempts. Try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.max(1, Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000))),
        },
      },
    )
  }

  if (!verifyBearerToken(request.headers.get('authorization'), process.env.BILLING_ADMIN_TOKEN)) {
    return privateJsonResponse({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await readJsonBody(request, { maxBytes: 16 * 1024 })
  } catch (error) {
    return launchApiErrorResponse(error)
  }

  const userId = getStringField(body, 'userId')
  const plan = getStringField(body, 'plan')
  const status = getStringField(body, 'status') || 'manual'

  if (!userId || !plan) {
    return privateJsonResponse({ error: 'userId and plan are required.' }, { status: 400 })
  }

  if (!MANUAL_PLANS.has(plan as LaunchPlan)) {
    return privateJsonResponse({ error: 'plan must be free, premium, or admin.' }, { status: 400 })
  }

  if (!MANUAL_STATUSES.has(status)) {
    return privateJsonResponse({ error: 'status is not supported.' }, { status: 400 })
  }

  const entitlement = await setManualLaunchPlan({
    userId,
    plan: plan as LaunchPlan,
    status,
  })

  return privateJsonResponse({ entitlement })
}

function getStringField(value: unknown, key: string): string {
  if (!value || typeof value !== 'object' || !(key in value)) {
    return ''
  }

  const field = (value as Record<string, unknown>)[key]
  return typeof field === 'string' ? field.trim().slice(0, 256) : ''
}
