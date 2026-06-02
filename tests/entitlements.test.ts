import { beforeEach, describe, expect, it, vi } from 'vitest'
import prisma from '@/lib/prisma'
import { getLaunchEntitlement, setManualLaunchPlan } from '../lib/launch-kit/entitlements'

vi.mock('@/lib/prisma', () => ({
  default: {
    userPlan: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

const userPlan = prisma.userPlan as unknown as {
  findUnique: ReturnType<typeof vi.fn>
  upsert: ReturnType<typeof vi.fn>
}

describe('launch entitlements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('preserves persisted admin plans as admin entitlements', async () => {
    userPlan.findUnique.mockResolvedValue({
      plan: 'admin',
      status: 'manual',
      currentPeriodEnd: null,
    })

    const entitlement = await getLaunchEntitlement({
      id: 'user_123',
      email: 'founder@example.com',
    })

    expect(entitlement).toEqual({
      plan: 'admin',
      status: 'manual',
      hasPremium: true,
    })
  })

  it('stores manual admin grants without downgrading them to premium', async () => {
    userPlan.upsert.mockResolvedValue({
      plan: 'admin',
      status: 'manual',
    })

    const entitlement = await setManualLaunchPlan({
      userId: 'user_123',
      plan: 'admin',
    })

    expect(userPlan.upsert).toHaveBeenCalledWith({
      where: { userId: 'user_123' },
      create: {
        userId: 'user_123',
        plan: 'admin',
        status: 'manual',
        provider: 'manual',
      },
      update: {
        plan: 'admin',
        status: 'manual',
        provider: 'manual',
      },
    })
    expect(entitlement).toEqual({
      plan: 'admin',
      status: 'manual',
      hasPremium: true,
    })
  })

  it('does not grant premium access for expired premium plans', async () => {
    userPlan.findUnique.mockResolvedValue({
      plan: 'premium',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() - 1000),
    })

    const entitlement = await getLaunchEntitlement({
      id: 'user_123',
      email: 'founder@example.com',
    })

    expect(entitlement).toEqual({
      plan: 'premium',
      status: 'active',
      hasPremium: false,
    })
  })
})
