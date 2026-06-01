import { afterEach, describe, expect, it } from 'vitest'
import {
  assertProductionReady,
  getProductionReadinessChecks,
  parseBoolean,
  parseCsv,
  parseInteger,
} from '../lib/env'

const keys = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'NEXT_PUBLIC_APP_URL',
  'BETTER_AUTH_URL',
  'OPENAI_API_KEY',
  'REPLICATE_API_TOKEN',
  'BILLING_PROVIDER',
  'BILLING_ADMIN_TOKEN',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_ID',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'AUTH_ALLOW_PASSWORD_ONLY',
  'SKIP_PRODUCTION_ENV_CHECKS',
  'VERCEL_ENV',
  'NEXT_PHASE',
  'npm_lifecycle_event',
]

describe('env helpers', () => {
  const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]))

  afterEach(() => {
    for (const key of keys) {
      if (original[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = original[key]
      }
    }
  })

  it('parses booleans, integers, and csv values defensively', () => {
    expect(parseBoolean('yes')).toBe(true)
    expect(parseBoolean('', true)).toBe(true)
    expect(parseBoolean('no')).toBe(false)
    expect(parseInteger('12', 3)).toBe(12)
    expect(parseInteger('-1', 3)).toBe(3)
    expect(parseCsv('a@example.com, b@example.com ,,')).toEqual(['a@example.com', 'b@example.com'])
  })

  it('reports production readiness checks from environment values', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@example.com:5432/app'
    process.env.BETTER_AUTH_SECRET = 'super-secret-value-that-is-long-enough'
    process.env.NEXT_PUBLIC_APP_URL = 'https://launch.example.com'
    process.env.BETTER_AUTH_URL = 'https://launch.example.com'
    process.env.OPENAI_API_KEY = 'sk-test'
    process.env.BILLING_PROVIDER = 'manual'
    process.env.BILLING_ADMIN_TOKEN = 'manual-admin-token-that-is-long-enough'
    process.env.AUTH_ALLOW_PASSWORD_ONLY = 'true'
    delete process.env.GOOGLE_CLIENT_ID
    delete process.env.GOOGLE_CLIENT_SECRET

    const checks = getProductionReadinessChecks()

    expect(checks.find((check) => check.key === 'DATABASE_URL')?.ok).toBe(true)
    expect(checks.find((check) => check.key === 'BETTER_AUTH_SECRET')?.ok).toBe(true)
    expect(checks.find((check) => check.key === 'NEXT_PUBLIC_APP_URL')?.ok).toBe(true)
    expect(checks.find((check) => check.key === 'BETTER_AUTH_URL')?.ok).toBe(true)
    expect(checks.find((check) => check.key === 'AI_PROVIDER')?.ok).toBe(true)
    expect(checks.find((check) => check.key === 'BILLING')?.ok).toBe(true)
    expect(checks.find((check) => check.key === 'GOOGLE_OAUTH')?.ok).toBe(true)
  })

  it('fails production readiness until Prisma is switched from SQLite to Postgres', () => {
    const checks = getProductionReadinessChecks()

    expect(checks.find((check) => check.key === 'PRISMA_SCHEMA_PROVIDER')?.ok).toBe(false)
    expect(checks.find((check) => check.key === 'PRISMA_MIGRATION_PROVIDER')?.ok).toBe(false)
  })

  it('fails fast for production runtime when required env is missing', () => {
    process.env.VERCEL_ENV = 'production'
    process.env.DATABASE_URL = 'file:./dev.db'
    process.env.BETTER_AUTH_SECRET = 'replace-me-with-openssl-rand-base64-32'
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    process.env.BETTER_AUTH_URL = 'http://localhost:3000'
    delete process.env.OPENAI_API_KEY
    delete process.env.REPLICATE_API_TOKEN
    delete process.env.BILLING_PROVIDER
    delete process.env.BILLING_ADMIN_TOKEN
    delete process.env.STRIPE_SECRET_KEY
    delete process.env.STRIPE_WEBHOOK_SECRET
    delete process.env.STRIPE_PRICE_ID
    delete process.env.AUTH_ALLOW_PASSWORD_ONLY
    delete process.env.SKIP_PRODUCTION_ENV_CHECKS
    delete process.env.NEXT_PHASE
    delete process.env.npm_lifecycle_event

    expect(() => assertProductionReady()).toThrow('Production environment is not ready')
  })

  it('does not pass billing readiness for incomplete billing provider config', () => {
    process.env.BILLING_PROVIDER = 'manual'
    process.env.BILLING_ADMIN_TOKEN = 'short'
    delete process.env.STRIPE_SECRET_KEY
    delete process.env.STRIPE_WEBHOOK_SECRET
    delete process.env.STRIPE_PRICE_ID

    const billing = getProductionReadinessChecks().find((check) => check.key === 'BILLING')
    expect(billing?.ok).toBe(false)

    delete process.env.BILLING_PROVIDER
    process.env.STRIPE_SECRET_KEY = 'sk_live_test'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    delete process.env.STRIPE_PRICE_ID

    const incompleteStripe = getProductionReadinessChecks().find((check) => check.key === 'BILLING')
    expect(incompleteStripe?.ok).toBe(false)
  })

  it('requires production database and URL values to use deploy-safe schemes', () => {
    process.env.DATABASE_URL = 'mysql://user:pass@example.com:3306/app'
    process.env.NEXT_PUBLIC_APP_URL = 'http://launch.example.com'
    process.env.BETTER_AUTH_URL = 'https://localhost:3000'

    const checks = getProductionReadinessChecks()
    expect(checks.find((check) => check.key === 'DATABASE_URL')?.ok).toBe(false)
    expect(checks.find((check) => check.key === 'NEXT_PUBLIC_APP_URL')?.ok).toBe(false)
    expect(checks.find((check) => check.key === 'BETTER_AUTH_URL')?.ok).toBe(false)
  })

  it('requires production secrets to be non-placeholder and long enough', () => {
    process.env.BETTER_AUTH_SECRET = 'short-secret'
    process.env.BILLING_PROVIDER = 'manual'
    process.env.BILLING_ADMIN_TOKEN = 'replace-me-with-a-long-token-value'
    delete process.env.STRIPE_SECRET_KEY
    delete process.env.STRIPE_WEBHOOK_SECRET
    delete process.env.STRIPE_PRICE_ID

    const checks = getProductionReadinessChecks()
    expect(checks.find((check) => check.key === 'BETTER_AUTH_SECRET')?.ok).toBe(false)
    expect(checks.find((check) => check.key === 'BILLING')?.ok).toBe(false)
  })

  it('allows explicit production readiness bypasses for build tooling only', () => {
    process.env.VERCEL_ENV = 'production'
    process.env.DATABASE_URL = 'file:./dev.db'
    process.env.NEXT_PHASE = 'phase-production-build'

    expect(() => assertProductionReady()).not.toThrow()
  })
})
