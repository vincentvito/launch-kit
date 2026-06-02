import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { isPostgresDatabaseUrl } from '@/lib/database-provider'

type EnvCheck = {
  key: string
  ok: boolean
  message: string
}

export type RuntimeEnv = 'development' | 'preview' | 'production'

export function getRuntimeEnv(): RuntimeEnv {
  if (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production') {
    return 'production'
  }
  if (process.env.VERCEL_ENV === 'preview') {
    return 'preview'
  }
  return 'development'
}

export function isProductionRuntime(): boolean {
  return getRuntimeEnv() === 'production'
}

export function isProductionBuildPhase(): boolean {
  return (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.npm_lifecycle_event === 'build'
  )
}

export function shouldSkipProductionReadinessChecks(): boolean {
  return parseBoolean(process.env.SKIP_PRODUCTION_ENV_CHECKS) || isProductionBuildPhase()
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000'
}

export function getAllowedOrigins(): string[] {
  const configuredOrigins = [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter((value): value is string => Boolean(value))

  if (isProductionRuntime()) {
    return configuredOrigins
  }

  return [
    ...configuredOrigins,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]
}

export function parseBoolean(value: string | undefined, fallback = false): boolean {
  if (value === undefined || value.trim() === '') {
    return fallback
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

export function parseInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export function parseCsv(value: string | undefined): string[] {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function isProductionHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      url.hostname !== 'localhost' &&
      url.hostname !== '127.0.0.1' &&
      !url.hostname.endsWith('.localhost')
    )
  } catch {
    return false
  }
}

function isStrongSecret(value: string, minLength = 32): boolean {
  return value.trim().length >= minLength && !value.includes('replace-me')
}

function readPrismaSchema(): string {
  try {
    return readFileSync(join(process.cwd(), 'prisma', 'schema.prisma'), 'utf8')
  } catch {
    return ''
  }
}

function readPrismaMigrationLock(): string {
  try {
    return readFileSync(join(process.cwd(), 'prisma', 'migrations', 'migration_lock.toml'), 'utf8')
  } catch {
    return ''
  }
}

function getPrismaSchemaProvider(): string {
  const schema = readPrismaSchema()
  return schema.match(/datasource\s+db\s+\{[\s\S]*?provider\s*=\s*"([^"]+)"/)?.[1] || ''
}

function getPrismaMigrationProvider(): string {
  const lockfile = readPrismaMigrationLock()
  return lockfile.match(/provider\s*=\s*"([^"]+)"/)?.[1] || ''
}

export function getAdminEmails(): string[] {
  return parseCsv(process.env.LAUNCH_KIT_ADMIN_EMAILS).map((email) => email.toLowerCase())
}

export function isPublicFreeGenerationEnabled(): boolean {
  return parseBoolean(
    process.env.LAUNCH_KIT_PUBLIC_FREE_ENABLED,
    !isProductionRuntime(),
  )
}

export function getRateLimitSalt(): string {
  return (
    process.env.RATE_LIMIT_SALT ||
    process.env.BETTER_AUTH_SECRET ||
    'launch-kit-local-rate-limit-salt'
  )
}

export function getProductionReadinessChecks(): EnvCheck[] {
  const databaseUrl = process.env.DATABASE_URL || ''
  const directUrl = process.env.DIRECT_URL || ''
  const betterAuthSecret = process.env.BETTER_AUTH_SECRET || ''
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const authUrl = process.env.BETTER_AUTH_URL || ''
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  const aiEnabled = Boolean(process.env.OPENAI_API_KEY || process.env.REPLICATE_API_TOKEN)
  const manualBillingConfigured = Boolean(
    process.env.BILLING_PROVIDER === 'manual' &&
      isStrongSecret(process.env.BILLING_ADMIN_TOKEN || ''),
  )
  const stripeBillingConfigured = Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_PRICE_ID,
  )
  const prismaSchemaProvider = getPrismaSchemaProvider()
  const prismaMigrationProvider = getPrismaMigrationProvider()

  return [
    {
      key: 'DATABASE_URL',
      ok: isPostgresDatabaseUrl(databaseUrl),
      message: 'Use a postgres:// or postgresql:// DATABASE_URL for production.',
    },
    {
      key: 'DIRECT_URL',
      ok: isPostgresDatabaseUrl(directUrl),
      message: 'Set DIRECT_URL to the direct Postgres connection for Prisma migrations.',
    },
    {
      key: 'PRISMA_SCHEMA_PROVIDER',
      ok: prismaSchemaProvider === 'postgresql',
      message: 'Switch prisma/schema.prisma datasource.provider to "postgresql" before production.',
    },
    {
      key: 'PRISMA_MIGRATION_PROVIDER',
      ok: prismaMigrationProvider === 'postgresql',
      message: 'Switch prisma/migrations/migration_lock.toml provider to "postgresql" before production.',
    },
    {
      key: 'BETTER_AUTH_SECRET',
      ok: isStrongSecret(betterAuthSecret),
      message: 'Set a strong Better Auth secret with at least 32 characters.',
    },
    {
      key: 'NEXT_PUBLIC_APP_URL',
      ok: isProductionHttpsUrl(appUrl),
      message: 'Set the public production HTTPS URL.',
    },
    {
      key: 'BETTER_AUTH_URL',
      ok: isProductionHttpsUrl(authUrl),
      message: 'Set the production auth HTTPS URL.',
    },
    {
      key: 'AI_PROVIDER',
      ok: aiEnabled,
      message: 'Set OPENAI_API_KEY or REPLICATE_API_TOKEN for live AI generation.',
    },
    {
      key: 'BILLING',
      ok: manualBillingConfigured || stripeBillingConfigured,
      message: 'Set Stripe env vars or BILLING_PROVIDER=manual with a strong BILLING_ADMIN_TOKEN for invite/manual premium.',
    },
    {
      key: 'GOOGLE_OAUTH',
      ok: googleEnabled || process.env.AUTH_ALLOW_PASSWORD_ONLY === 'true',
      message: 'Set Google OAuth or explicitly allow password-only auth.',
    },
  ]
}

export function assertProductionReady(): void {
  if (!isProductionRuntime()) {
    return
  }

  const failed = getProductionReadinessChecks().filter((check) => !check.ok)
  if (failed.length > 0 && !shouldSkipProductionReadinessChecks()) {
    const summary = failed.map((check) => `${check.key}: ${check.message}`).join('; ')
    throw new Error(`Production environment is not ready: ${summary}`)
  }
}
