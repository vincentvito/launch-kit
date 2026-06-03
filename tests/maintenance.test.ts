import { afterEach, describe, expect, it, vi, type Mock } from 'vitest'
import prisma from '@/lib/prisma'
import { runLaunchKitMaintenance } from '../lib/launch-kit/maintenance'

vi.mock('@/lib/prisma', () => ({
  default: {
    rateLimitBucket: {
      deleteMany: vi.fn(),
    },
    launchJob: {
      deleteMany: vi.fn(),
    },
    usageEvent: {
      deleteMany: vi.fn(),
    },
  },
}))

const mockedPrisma = prisma as unknown as {
  rateLimitBucket: { deleteMany: Mock }
  launchJob: { deleteMany: Mock }
  usageEvent: { deleteMany: Mock }
}

const originalEnv = {
  MAINTENANCE_STALE_JOB_HOURS: process.env.MAINTENANCE_STALE_JOB_HOURS,
  MAINTENANCE_COMPLETED_JOB_DAYS: process.env.MAINTENANCE_COMPLETED_JOB_DAYS,
  MAINTENANCE_USAGE_EVENT_DAYS: process.env.MAINTENANCE_USAGE_EVENT_DAYS,
}

describe('Launch Kit maintenance', () => {
  afterEach(() => {
    vi.clearAllMocks()
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  })

  it('prunes expired rate limits, stale jobs, completed jobs, and old usage events', async () => {
    const now = new Date('2026-06-02T10:00:00.000Z')
    process.env.MAINTENANCE_STALE_JOB_HOURS = '12'
    process.env.MAINTENANCE_COMPLETED_JOB_DAYS = '14'
    process.env.MAINTENANCE_USAGE_EVENT_DAYS = '90'
    mockedPrisma.rateLimitBucket.deleteMany.mockResolvedValue({ count: 3 })
    mockedPrisma.launchJob.deleteMany
      .mockResolvedValueOnce({ count: 2 })
      .mockResolvedValueOnce({ count: 5 })
    mockedPrisma.usageEvent.deleteMany.mockResolvedValue({ count: 8 })

    const result = await runLaunchKitMaintenance(now)

    expect(result).toEqual({
      rateLimitBucketsPruned: 3,
      staleQueuedJobsPruned: 2,
      completedJobsPruned: 5,
      usageEventsPruned: 8,
    })
    expect(mockedPrisma.rateLimitBucket.deleteMany).toHaveBeenCalledWith({
      where: {
        resetAt: {
          lt: new Date('2026-06-01T10:00:00.000Z'),
        },
      },
    })
    expect(mockedPrisma.launchJob.deleteMany).toHaveBeenNthCalledWith(1, {
      where: {
        status: 'queued',
        createdAt: {
          lt: new Date('2026-06-01T22:00:00.000Z'),
        },
      },
    })
    expect(mockedPrisma.launchJob.deleteMany).toHaveBeenNthCalledWith(2, {
      where: {
        status: {
          in: ['completed', 'failed'],
        },
        updatedAt: {
          lt: new Date('2026-05-19T10:00:00.000Z'),
        },
      },
    })
    expect(mockedPrisma.usageEvent.deleteMany).toHaveBeenCalledWith({
      where: {
        createdAt: {
          lt: new Date('2026-03-04T10:00:00.000Z'),
        },
      },
    })
  })
})
