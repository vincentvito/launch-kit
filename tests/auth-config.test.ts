import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { authRateLimitConfig } from '../lib/auth-config'

describe('auth config', () => {
  it('uses database-backed auth rate limiting with stricter auth endpoint rules', () => {
    expect(authRateLimitConfig.storage).toBe('database')
    expect(authRateLimitConfig.enabled).toBe(true)
    expect(authRateLimitConfig.customRules?.['/sign-in/email']).toEqual({
      window: 60,
      max: 10,
    })
    expect(authRateLimitConfig.customRules?.['/sign-up/email']).toEqual({
      window: 60,
      max: 5,
    })
  })

  it('keeps the Better Auth rate limit table in the Prisma schema', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf8')

    expect(schema).toContain('model RateLimit')
    expect(schema).toContain('lastRequest BigInt')
    expect(schema).toContain('@@map("rate_limit")')
  })
})
