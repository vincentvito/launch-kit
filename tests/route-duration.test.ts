import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function findApiRoutes(dir = 'app/api'): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const routePath = join(dir, entry.name)

    if (entry.isDirectory()) {
      return findApiRoutes(routePath)
    }

    return entry.name === 'route.ts' ? [routePath] : []
  })
}

describe('route duration contract', () => {
  it('sets an explicit Node runtime and Vercel budget for every API route', () => {
    for (const route of findApiRoutes()) {
      const source = readFileSync(route, 'utf8')
      const maxDuration = source.match(/export const maxDuration = (\d+)/)?.[1]

      expect(source, route).toContain("export const runtime = 'nodejs'")
      expect(maxDuration, route).toBeDefined()
      expect(Number(maxDuration), route).toBeGreaterThan(0)
      expect(Number(maxDuration), route).toBeLessThanOrEqual(60)
    }
  })

  it('keeps health diagnostics on a short budget and long-running work on a larger budget', () => {
    const expectedBudgets: Record<string, number> = {
      'app/api/health/route.ts': 5,
      'app/api/readiness/route.ts': 10,
      'app/api/launch-kit/generate/route.ts': 60,
      'app/api/launch-kit/ingest/route.ts': 60,
      'app/api/launch-kit/assets/generate/route.ts': 60,
      'app/api/billing/webhook/stripe/route.ts': 60,
      'app/api/maintenance/route.ts': 60,
    }

    for (const [route, budget] of Object.entries(expectedBudgets)) {
      const source = readFileSync(route, 'utf8')

      expect(source, route).toContain(`export const maxDuration = ${budget}`)
    }
  })
})
