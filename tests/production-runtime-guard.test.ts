import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const guardedRuntimeSurfaces = [
  'app/layout.tsx',
  'app/api/auth/[...all]/route.ts',
  'app/api/waitlist/route.ts',
  'app/api/billing/manual-plan/route.ts',
  'app/api/billing/webhook/stripe/route.ts',
  'app/api/maintenance/route.ts',
  'lib/launch-kit/api-guard.ts',
  'lib/launch-kit/auth.ts',
]

describe('production runtime guard', () => {
  it('enforces production readiness on pages, auth, launch APIs, and standalone mutating routes', () => {
    for (const file of guardedRuntimeSurfaces) {
      const source = readFileSync(file, 'utf8')

      expect(source, file).toContain('assertOrLogProductionReadiness')
    }
  })

  it('leaves health and readiness endpoints available for diagnostics', () => {
    for (const file of ['app/api/health/route.ts', 'app/api/readiness/route.ts']) {
      const source = readFileSync(file, 'utf8')

      expect(source, file).not.toContain('assertOrLogProductionReadiness')
    }
  })
})
