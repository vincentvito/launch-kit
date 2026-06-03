import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const platformEnvKeys = new Set([
  'NEXT_PHASE',
  'NODE_ENV',
  'VERCEL_ENV',
  'VERCEL_URL',
])

function findSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)

    if (entry.isDirectory()) {
      if (path === 'lib/generated') {
        return []
      }

      return findSourceFiles(path)
    }

    return /\.(ts|tsx)$/.test(entry.name) ? [path] : []
  })
}

function readEnvKeys(path: string): Set<string> {
  const content = readFileSync(path, 'utf8')
  const keys = new Set<string>()

  for (const line of content.split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=/)
    if (match?.[1]) {
      keys.add(match[1])
    }
  }

  return keys
}

function readUsedEnvKeys(): Set<string> {
  const keys = new Set<string>()

  for (const file of ['app', 'lib', 'scripts'].flatMap((dir) => findSourceFiles(dir))) {
    const source = readFileSync(file, 'utf8')
    const patterns = [
      /process\.env\.([A-Z0-9_]+)/g,
      /process\.env\[['"]([A-Z0-9_]+)['"]\]/g,
    ]

    for (const pattern of patterns) {
      for (const match of source.matchAll(pattern)) {
        const key = match[1]
        if (key && !platformEnvKeys.has(key)) {
          keys.add(key)
        }
      }
    }
  }

  return keys
}

function readRateLimitEnvKeys(): string[] {
  const source = readFileSync('lib/launch-kit/rate-limit.ts', 'utf8')
  const defaultLimits = source.match(/const DEFAULT_LIMITS[\s\S]*?= \{([\s\S]*?)\n\}/)?.[1] || ''
  const policyKeys = [...defaultLimits.matchAll(/^\s+([a-z_]+):/gm)]
    .map((match) => match[1])
    .filter((key): key is string => Boolean(key))

  return policyKeys.flatMap((key) => {
    const envKey = `RATE_LIMIT_${key.toUpperCase()}`
    return [envKey, `${envKey}_WINDOW_SECONDS`]
  })
}

describe('env example files', () => {
  it('keeps local and production env templates aligned by key', () => {
    const localKeys = readEnvKeys('.env.example')
    const productionKeys = readEnvKeys('.env.production.example')

    expect(Array.from(localKeys).sort()).toEqual(Array.from(productionKeys).sort())
  })

  it('keeps the production env template aligned with production preflight inputs', () => {
    const keys = readEnvKeys('.env.production.example')

    expect(Array.from(keys)).toEqual(expect.arrayContaining([
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
      'OUTREACH_EMAIL_WEBHOOK_URL',
      'OUTREACH_EMAIL_WEBHOOK_TOKEN',
      'MAINTENANCE_STALE_JOB_HOURS',
      'MAINTENANCE_COMPLETED_JOB_DAYS',
      'MAINTENANCE_USAGE_EVENT_DAYS',
      'MAINTENANCE_ADMIN_TOKEN',
      'CRON_SECRET',
      'RATE_LIMIT_MAINTENANCE_ADMIN',
      'RATE_LIMIT_PROJECT_READ',
      'RATE_LIMIT_PROJECT_WRITE',
      'LAUNCH_KIT_DISCOVERY_PROVIDER',
      'LAUNCH_KIT_SEO_DISCOVERY_PROVIDER',
      'SERPAPI_API_KEY',
      'PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH',
      'CHROME_EXECUTABLE_PATH',
      'REPLICATE_DEBUG',
      'SAMPLE_ASSET_KIND',
      'SAMPLE_ASSET_FILES',
    ]))
  })

  it('documents every non-platform env var read by app, lib, or scripts', () => {
    const templatedKeys = readEnvKeys('.env.example')
    const usedKeys = readUsedEnvKeys()
    const missing = Array.from(usedKeys)
      .filter((key) => !templatedKeys.has(key))
      .sort()

    expect(missing).toEqual([])
  })

  it('documents all persisted rate-limit limit and window overrides', () => {
    const templatedKeys = readEnvKeys('.env.example')

    expect(readRateLimitEnvKeys().filter((key) => !templatedKeys.has(key))).toEqual([])
  })
})
