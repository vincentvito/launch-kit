import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyStripeEvent, createCheckoutSession } from '../lib/billing'
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

const originalBillingProvider = process.env.BILLING_PROVIDER

describe('billing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (originalBillingProvider === undefined) {
      delete process.env.BILLING_PROVIDER
    } else {
      process.env.BILLING_PROVIDER = originalBillingProvider
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

    expect(prisma.userPlan.updateMany).toHaveBeenCalledWith({
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

    expect(prisma.userPlan.updateMany).not.toHaveBeenCalled()
  })
})
