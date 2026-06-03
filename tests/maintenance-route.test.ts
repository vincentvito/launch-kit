import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { GET, POST } from '../app/api/maintenance/route'
import { runLaunchKitMaintenance } from '@/lib/launch-kit/maintenance'
import { consumeRateLimit } from '@/lib/launch-kit/rate-limit'

vi.mock('@/lib/launch-kit/maintenance', () => ({
  runLaunchKitMaintenance: vi.fn(),
}))

vi.mock('@/lib/launch-kit/rate-limit', () => ({
  consumeRateLimit: vi.fn(),
  getRateLimitPolicy: vi.fn(() => ({ limit: 10, windowSeconds: 3600 })),
}))

const maintenance = runLaunchKitMaintenance as Mock
const rateLimit = consumeRateLimit as Mock
const originalEnv = {
  MAINTENANCE_ADMIN_TOKEN: process.env.MAINTENANCE_ADMIN_TOKEN,
  CRON_SECRET: process.env.CRON_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  VERCEL_ENV: process.env.VERCEL_ENV,
  NEXT_PHASE: process.env.NEXT_PHASE,
  npm_lifecycle_event: process.env.npm_lifecycle_event,
}

describe('maintenance route', () => {
  beforeEach(() => {
    rateLimit.mockResolvedValue({
      ok: true,
      limit: 10,
      remaining: 9,
      resetAt: new Date(Date.now() + 60_000),
    })
    maintenance.mockResolvedValue({
      rateLimitBucketsPruned: 1,
      staleQueuedJobsPruned: 2,
      completedJobsPruned: 3,
      usageEventsPruned: 4,
    })
  })

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

  it('rejects requests without a configured matching bearer token', async () => {
    delete process.env.MAINTENANCE_ADMIN_TOKEN
    delete process.env.CRON_SECRET

    const response = await POST(new Request('https://launch.example/api/maintenance', {
      method: 'POST',
      headers: {
        authorization: 'Bearer any-token',
      },
    }))

    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
    expect(response.status).toBe(401)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    expect(maintenance).not.toHaveBeenCalled()
  })

  it('runs maintenance with MAINTENANCE_ADMIN_TOKEN', async () => {
    process.env.MAINTENANCE_ADMIN_TOKEN = 'maintenance-token'
    delete process.env.CRON_SECRET

    const response = await POST(new Request('https://launch.example/api/maintenance', {
      method: 'POST',
      headers: {
        authorization: 'Bearer maintenance-token',
      },
    }))

    await expect(response.json()).resolves.toEqual({
      ok: true,
      maintenance: {
        rateLimitBucketsPruned: 1,
        staleQueuedJobsPruned: 2,
        completedJobsPruned: 3,
        usageEventsPruned: 4,
      },
    })
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
  })

  it('runs maintenance with CRON_SECRET', async () => {
    delete process.env.MAINTENANCE_ADMIN_TOKEN
    process.env.CRON_SECRET = 'cron-secret'

    const response = await GET(new Request('https://launch.example/api/maintenance', {
      method: 'GET',
      headers: {
        authorization: 'Bearer cron-secret',
      },
    }))

    expect(response.status).toBe(200)
    expect(maintenance).toHaveBeenCalledTimes(1)
  })

  it('rate limits maintenance attempts before token verification', async () => {
    rateLimit.mockResolvedValue({
      ok: false,
      limit: 10,
      remaining: 0,
      resetAt: new Date(Date.now() + 120_000),
    })

    const response = await POST(new Request('https://launch.example/api/maintenance', {
      method: 'POST',
      headers: {
        authorization: 'Bearer maintenance-token',
      },
    }))

    await expect(response.json()).resolves.toEqual({
      error: 'Too many maintenance attempts. Try again later.',
    })
    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBeTruthy()
    expect(maintenance).not.toHaveBeenCalled()
  })

  it('fails before cleanup when production readiness is not satisfied', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    process.env.VERCEL_ENV = 'production'
    process.env.DATABASE_URL = 'file:./dev.db'
    process.env.npm_lifecycle_event = 'start'
    delete process.env.NEXT_PHASE
    process.env.MAINTENANCE_ADMIN_TOKEN = 'maintenance-token'

    const response = await POST(new Request('https://launch.example/api/maintenance', {
      method: 'POST',
      headers: {
        authorization: 'Bearer maintenance-token',
      },
    }))

    await expect(response.json()).resolves.toEqual({
      error: 'Service is not ready for production.',
      code: 'production_not_ready',
    })
    expect(response.status).toBe(503)
    expect(rateLimit).not.toHaveBeenCalled()
    expect(maintenance).not.toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalledTimes(1)

    consoleError.mockRestore()
  })
})
