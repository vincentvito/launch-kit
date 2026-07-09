import prisma from '@/lib/prisma'
import { parseInteger } from '@/lib/env'

export type RateLimitResult = {
  ok: boolean
  limit: number
  remaining: number
  resetAt: Date
}

export type RateLimitPolicy = {
  limit: number
  windowSeconds: number
}

const DEFAULT_LIMITS: Record<string, RateLimitPolicy> = {
  ingest: { limit: 20, windowSeconds: 60 * 60 },
  generate_free: { limit: 6, windowSeconds: 24 * 60 * 60 },
  generate_premium: { limit: 60, windowSeconds: 24 * 60 * 60 },
  premium_action: { limit: 120, windowSeconds: 24 * 60 * 60 },
  project_write: { limit: 100, windowSeconds: 60 * 60 },
  export: { limit: 100, windowSeconds: 60 * 60 },
  billing_admin: { limit: 10, windowSeconds: 60 * 60 },
}

export function getRateLimitPolicy(action: string, premium: boolean): RateLimitPolicy {
  const key = action === 'generate' ? (premium ? 'generate_premium' : 'generate_free') : action
  const fallback = DEFAULT_LIMITS[key] || DEFAULT_LIMITS.premium_action
  const envKey = `RATE_LIMIT_${key.toUpperCase()}`

  return {
    limit: parseInteger(process.env[envKey], fallback.limit),
    windowSeconds: parseInteger(process.env[`${envKey}_WINDOW_SECONDS`], fallback.windowSeconds),
  }
}

export async function consumeRateLimit(input: {
  subjectKey: string
  action: string
  policy: RateLimitPolicy
}): Promise<RateLimitResult> {
  const now = new Date()
  const resetAt = new Date(now.getTime() + input.policy.windowSeconds * 1000)
  const key = `${input.subjectKey}:${input.action}`

  if (input.policy.limit <= 0) {
    return {
      ok: false,
      limit: input.policy.limit,
      remaining: 0,
      resetAt,
    }
  }

  const activeIncrement = await prisma.rateLimitBucket.updateMany({
    where: {
      key,
      resetAt: {
        gt: now,
      },
      count: {
        lt: input.policy.limit,
      },
    },
    data: {
      count: {
        increment: 1,
      },
    },
  })

  if (activeIncrement.count > 0) {
    const updated = await prisma.rateLimitBucket.findUnique({
      where: { key },
    })

    return {
      ok: true,
      limit: input.policy.limit,
      remaining: Math.max(input.policy.limit - (updated?.count || input.policy.limit), 0),
      resetAt: updated?.resetAt || resetAt,
    }
  }

  const bucket = await prisma.rateLimitBucket.findUnique({
    where: { key },
  })

  if (bucket && bucket.resetAt > now) {
    return {
      ok: false,
      limit: input.policy.limit,
      remaining: 0,
      resetAt: bucket.resetAt,
    }
  }

  if (!bucket || bucket.resetAt <= now) {
    await prisma.rateLimitBucket.upsert({
      where: { key },
      create: {
        key,
        count: 1,
        resetAt,
      },
      update: {
        count: 1,
        resetAt,
      },
    })

    return {
      ok: true,
      limit: input.policy.limit,
      remaining: Math.max(input.policy.limit - 1, 0),
      resetAt,
    }
  }

  return {
    ok: false,
    limit: input.policy.limit,
    remaining: 0,
    resetAt,
  }
}

export async function pruneExpiredRateLimitBuckets(): Promise<void> {
  await prisma.rateLimitBucket.deleteMany({
    where: {
      resetAt: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  })
}
