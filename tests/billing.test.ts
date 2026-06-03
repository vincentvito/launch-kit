import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import {
  applyStripeEvent,
  createBillingPortalSession,
  createCheckoutSession,
  InvalidStripeEventError,
  parseStripeEventPayload,
} from '../lib/billing'
import prisma from '../lib/prisma'

vi.mock('../lib/env', () => ({
  getAppUrl: () => 'https://launch.example',
}))

vi.mock('../lib/prisma', () => ({
  default: {
    userPlan: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

const userPlan = prisma.userPlan as unknown as {
  findUnique: Mock
  updateMany: Mock
  upsert: Mock
}

const originalEnv = {
  BILLING_PROVIDER: process.env.BILLING_PROVIDER,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID,
}

describe('billing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  })

  it('does not auto-grant premium during manual billing checkout', async () => {
    process.env.BILLING_PROVIDER = 'manual'

    const checkout = await createCheckoutSession({
      userId: 'user_123',
      email: 'founder@example.com',
    })

    expect(checkout.url).toBe('https://launch.example/pricing?billing=manual')
    expect(prisma.userPlan.upsert).not.toHaveBeenCalled()
  })

  it('uses a timeout for Stripe checkout requests', async () => {
    delete process.env.BILLING_PROVIDER
    process.env.STRIPE_SECRET_KEY = 'sk_test'
    process.env.STRIPE_PRICE_ID = 'price_test'
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ url: 'https://checkout.stripe.com/c/pay/cs_test_123' }), {
        status: 200,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const checkout = await createCheckoutSession({
      userId: 'user_123',
      email: 'founder@example.com',
    })

    expect(checkout.url).toBe('https://checkout.stripe.com/c/pay/cs_test_123')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.stripe.com/v1/checkout/sessions',
      expect.objectContaining({
        method: 'POST',
        signal: expect.any(AbortSignal),
      }),
    )
  })

  it('rejects unexpected Stripe checkout redirect URLs', async () => {
    delete process.env.BILLING_PROVIDER
    process.env.STRIPE_SECRET_KEY = 'sk_test'
    process.env.STRIPE_PRICE_ID = 'price_test'
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ url: 'https://evil.example/checkout' }), { status: 200 }),
      ),
    )

    await expect(
      createCheckoutSession({
        userId: 'user_123',
        email: 'founder@example.com',
      }),
    ).rejects.toThrow('Stripe checkout did not return a valid hosted URL.')
  })

  it('uses a timeout for Stripe billing portal requests', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test'
    userPlan.findUnique.mockResolvedValue({
      provider: 'stripe',
      providerCustomerId: 'cus_123',
    })
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ url: 'https://billing.stripe.com/p/session/test_123' }), {
        status: 200,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const portal = await createBillingPortalSession({ userId: 'user_123' })

    expect(portal.url).toBe('https://billing.stripe.com/p/session/test_123')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.stripe.com/v1/billing_portal/sessions',
      expect.objectContaining({
        method: 'POST',
        signal: expect.any(AbortSignal),
      }),
    )
  })

  it('updates Stripe subscription plans with explicit lookup filters only', async () => {
    await applyStripeEvent({
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_123',
          status: 'active',
          current_period_end: 1_800_000_000,
        },
      },
    })

    expect(userPlan.updateMany).toHaveBeenCalledWith({
      where: {
        OR: [{ providerSubscriptionId: 'sub_123' }],
      },
      data: {
        plan: 'premium',
        status: 'active',
        currentPeriodEnd: new Date(1_800_000_000 * 1000),
        providerSubscriptionId: 'sub_123',
      },
    })
  })

  it('ignores Stripe subscription events without a customer or subscription id', async () => {
    await applyStripeEvent({
      type: 'customer.subscription.updated',
      data: {
        object: {
          status: 'active',
        },
      },
    })

    expect(userPlan.updateMany).not.toHaveBeenCalled()
  })

  it('rejects malformed Stripe events before applying entitlement changes', async () => {
    await expect(applyStripeEvent({ data: { object: {} } })).rejects.toBeInstanceOf(
      InvalidStripeEventError,
    )
    expect(() => parseStripeEventPayload('{"type":42}')).toThrow(InvalidStripeEventError)
    expect(userPlan.upsert).not.toHaveBeenCalled()
    expect(userPlan.updateMany).not.toHaveBeenCalled()
  })

  it('ignores unsupported well-formed Stripe events', async () => {
    await applyStripeEvent({
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: 'in_123',
        },
      },
    })

    expect(userPlan.upsert).not.toHaveBeenCalled()
    expect(userPlan.updateMany).not.toHaveBeenCalled()
  })
})
