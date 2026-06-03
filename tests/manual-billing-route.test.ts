import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { POST } from '../app/api/billing/manual-plan/route'
import { setManualLaunchPlan } from '@/lib/launch-kit/entitlements'
import { consumeRateLimit } from '@/lib/launch-kit/rate-limit'

vi.mock('@/lib/launch-kit/entitlements', () => ({
  setManualLaunchPlan: vi.fn(),
}))

vi.mock('@/lib/launch-kit/rate-limit', () => ({
  consumeRateLimit: vi.fn(),
  getRateLimitPolicy: vi.fn(() => ({ limit: 10, windowSeconds: 3600 })),
}))

const setPlan = setManualLaunchPlan as Mock
const rateLimit = consumeRateLimit as Mock

const originalEnv = {
  BILLING_PROVIDER: process.env.BILLING_PROVIDER,
  BILLING_ADMIN_TOKEN: process.env.BILLING_ADMIN_TOKEN,
}

describe('manual billing route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    rateLimit.mockResolvedValue({
      ok: true,
      limit: 10,
      remaining: 9,
      resetAt: new Date(Date.now() + 60_000),
    })
    setPlan.mockResolvedValue({
      plan: 'premium',
      status: 'manual',
      hasPremium: true,
    })
  })

  afterEach(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  })

  it('refuses manual grants unless manual billing mode is enabled', async () => {
    delete process.env.BILLING_PROVIDER
    process.env.BILLING_ADMIN_TOKEN = 'manual-admin-token'

    const response = await POST(manualBillingRequest())

    await expect(response.json()).resolves.toEqual({ error: 'Manual billing is not enabled.' })
    expect(response.status).toBe(404)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    expect(rateLimit).not.toHaveBeenCalled()
    expect(setPlan).not.toHaveBeenCalled()
  })

  it('grants manual plans when manual billing mode and token are valid', async () => {
    process.env.BILLING_PROVIDER = 'manual'
    process.env.BILLING_ADMIN_TOKEN = 'manual-admin-token'

    const response = await POST(manualBillingRequest())

    await expect(response.json()).resolves.toEqual({
      entitlement: {
        plan: 'premium',
        status: 'manual',
        hasPremium: true,
      },
    })
    expect(response.status).toBe(200)
    expect(setPlan).toHaveBeenCalledWith({
      userId: 'user_123',
      plan: 'premium',
      status: 'manual',
    })
  })
})

function manualBillingRequest() {
  return new Request('https://launch.example/api/billing/manual-plan', {
    method: 'POST',
    headers: {
      authorization: 'Bearer manual-admin-token',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      userId: 'user_123',
      plan: 'premium',
      status: 'manual',
    }),
  })
}
