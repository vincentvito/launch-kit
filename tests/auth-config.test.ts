import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getAuthClientBaseUrl } from '../lib/auth-client-url'
import { authRateLimitConfig } from '../lib/auth-config'
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '../lib/auth-password-policy'

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
    expect(schema).toContain('id          String @id')
    expect(schema).toContain('key         String @unique')
    expect(schema).toContain('lastRequest BigInt')
    expect(schema).toContain('@@map("rate_limit")')
  })

  it('migrates existing Better Auth rate-limit rows with generated ids', () => {
    const migration = readFileSync(
      'prisma/migrations/20260603140536_auth_rate_limit_id/migration.sql',
      'utf8',
    )

    expect(migration).toContain('"id" TEXT NOT NULL PRIMARY KEY')
    expect(migration).toContain('CREATE UNIQUE INDEX "rate_limit_key_key" ON "rate_limit"("key")')
    expect(migration).toContain(
      'SELECT lower(hex(randomblob(16))), "count", "key", "lastRequest" FROM "rate_limit"',
    )
  })

  it('normalizes the client auth base URL to an HTTP origin', () => {
    expect(getAuthClientBaseUrl('https://launch.example/auth?next=/dashboard#top')).toBe(
      'https://launch.example',
    )
    expect(getAuthClientBaseUrl('javascript:alert(1)')).toBe('http://localhost:3000')
  })

  it('does not pass raw public env URLs directly into the auth client', () => {
    const source = readFileSync('lib/auth-client.ts', 'utf8')

    expect(source).toContain('getAuthClientBaseUrl()')
    expect(source).not.toContain("baseURL: process.env.NEXT_PUBLIC_APP_URL")
  })

  it('keeps server and client password length policy aligned', () => {
    const serverSource = readFileSync('lib/auth.ts', 'utf8')
    const clientSource = readFileSync('app/auth/login/login-client.tsx', 'utf8')

    expect(MIN_PASSWORD_LENGTH).toBe(10)
    expect(MAX_PASSWORD_LENGTH).toBe(128)
    expect(serverSource).toContain('minPasswordLength: MIN_PASSWORD_LENGTH')
    expect(serverSource).toContain('maxPasswordLength: MAX_PASSWORD_LENGTH')
    expect(clientSource).toContain('minLength={MIN_PASSWORD_LENGTH}')
    expect(clientSource).not.toContain('minLength={8}')
  })

  it('keeps the login screen branded for Launch Kit instead of the starter app', () => {
    const clientSource = readFileSync('app/auth/login/login-client.tsx', 'utf8')
    const englishMessages = readFileSync('messages/en.json', 'utf8')
    const spanishMessages = readFileSync('messages/es.json', 'utf8')

    expect(clientSource).toContain("t('brand')")
    expect(clientSource).toContain("t('brandInitial')")
    expect(clientSource).toContain("t('defaultName')")
    expect(clientSource.toLowerCase()).not.toContain('clickstudio')
    expect(clientSource.toLowerCase()).not.toContain('click</span>')
    expect(englishMessages).toContain('"brand": "Launch Kit"')
    expect(spanishMessages).toContain('"brand": "Launch Kit"')
  })
})
