import prisma from '@/lib/prisma'
import { parseInteger } from '@/lib/env'
import { pruneExpiredRateLimitBuckets } from '@/lib/launch-kit/rate-limit'

export type MaintenanceResult = {
  rateLimitBucketsPruned: number
  staleQueuedJobsPruned: number
  completedJobsPruned: number
  usageEventsPruned: number
}

export async function runLaunchKitMaintenance(now = new Date()): Promise<MaintenanceResult> {
  const staleQueuedJobHours = parseInteger(process.env.MAINTENANCE_STALE_JOB_HOURS, 24)
  const completedJobDays = parseInteger(process.env.MAINTENANCE_COMPLETED_JOB_DAYS, 30)
  const usageEventDays = parseInteger(process.env.MAINTENANCE_USAGE_EVENT_DAYS, 180)

  const rateLimitBucketsPruned = await pruneExpiredRateLimitBuckets(now)
  const staleQueuedJobsPruned = await prisma.launchJob.deleteMany({
    where: {
      status: 'queued',
      createdAt: {
        lt: hoursAgo(now, staleQueuedJobHours),
      },
    },
  })
  const completedJobsPruned = await prisma.launchJob.deleteMany({
    where: {
      status: {
        in: ['completed', 'failed'],
      },
      updatedAt: {
        lt: daysAgo(now, completedJobDays),
      },
    },
  })
  const usageEventsPruned = await prisma.usageEvent.deleteMany({
    where: {
      createdAt: {
        lt: daysAgo(now, usageEventDays),
      },
    },
  })

  return {
    rateLimitBucketsPruned,
    staleQueuedJobsPruned: staleQueuedJobsPruned.count,
    completedJobsPruned: completedJobsPruned.count,
    usageEventsPruned: usageEventsPruned.count,
  }
}

function hoursAgo(now: Date, hours: number): Date {
  return new Date(now.getTime() - hours * 60 * 60 * 1000)
}

function daysAgo(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
}
