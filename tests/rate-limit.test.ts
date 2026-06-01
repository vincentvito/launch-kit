import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import prisma from '@/lib/prisma'
import { consumeRateLimit } from '../lib/launch-kit/rate-limit'

vi.mock('@/lib/prisma', () => ({
  default: {
    rateLimitBucket: {
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

const rateLimitBucket = prisma.rateLimitBucket as unknown as {
  updateMany: Mock
  findUnique: Mock
  upsert: Mock
}

describe('rate limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('denies requests when a policy limit is zero', async () => {
    const result = await consumeRateLimit({
      subjectKey: 'user:user_123',
      action: 'generate_free',
      policy: {
        limit: 0,
        windowSeconds: 60,
      },
    })

    expect(result.ok).toBe(false)
    expect(result.remaining).toBe(0)
    expect(rateLimitBucket.updateMany).not.toHaveBeenCalled()
  })

  it('atomically increments active buckets that are under the limit', async () => {
    const resetAt = new Date(Date.now() + 60_000)
    rateLimitBucket.updateMany.mockResolvedValue({ count: 1 })
    rateLimitBucket.findUnique.mockResolvedValue({
      key: 'user:user_123:generate_free',
      count: 2,
      resetAt,
    })

    const result = await consumeRateLimit({
      subjectKey: 'user:user_123',
      action: 'generate_free',
      policy: {
        limit: 3,
        windowSeconds: 60,
      },
    })

    expect(rateLimitBucket.updateMany).toHaveBeenCalledWith({
      where: {
        key: 'user:user_123:generate_free',
        resetAt: {
          gt: expect.any(Date),
        },
        count: {
          lt: 3,
        },
      },
      data: {
        count: {
          increment: 1,
        },
      },
    })
    expect(result.ok).toBe(true)
    expect(result.remaining).toBe(1)
    expect(result.resetAt).toBe(resetAt)
  })

  it('rejects active buckets that are already exhausted', async () => {
    const resetAt = new Date(Date.now() + 60_000)
    rateLimitBucket.updateMany.mockResolvedValue({ count: 0 })
    rateLimitBucket.findUnique.mockResolvedValue({
      key: 'user:user_123:generate_free',
      count: 3,
      resetAt,
    })

    const result = await consumeRateLimit({
      subjectKey: 'user:user_123',
      action: 'generate_free',
      policy: {
        limit: 3,
        windowSeconds: 60,
      },
    })

    expect(result.ok).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.resetAt).toBe(resetAt)
    expect(rateLimitBucket.upsert).not.toHaveBeenCalled()
  })

  it('starts a new bucket when no active bucket exists', async () => {
    rateLimitBucket.updateMany.mockResolvedValue({ count: 0 })
    rateLimitBucket.findUnique.mockResolvedValue(null)
    rateLimitBucket.upsert.mockResolvedValue({})

    const result = await consumeRateLimit({
      subjectKey: 'user:user_123',
      action: 'generate_free',
      policy: {
        limit: 3,
        windowSeconds: 60,
      },
    })

    expect(rateLimitBucket.upsert).toHaveBeenCalledWith({
      where: { key: 'user:user_123:generate_free' },
      create: expect.objectContaining({
        key: 'user:user_123:generate_free',
        count: 1,
      }),
      update: expect.objectContaining({
        count: 1,
      }),
    })
    expect(result.ok).toBe(true)
    expect(result.remaining).toBe(2)
  })
})
