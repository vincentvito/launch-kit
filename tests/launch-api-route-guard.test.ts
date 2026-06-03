import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const savedProjectRoutes = [
  'app/api/launch-kit/projects/route.ts',
  'app/api/launch-kit/projects/[id]/route.ts',
  'app/api/launch-kit/profile/route.ts',
  'app/api/launch-kit/projects/[id]/markdown/route.ts',
  'app/api/launch-kit/projects/[id]/press-pack/route.ts',
]

const projectReadRoutes = [
  'app/api/launch-kit/projects/route.ts',
  'app/api/launch-kit/projects/[id]/route.ts',
  'app/api/launch-kit/profile/route.ts',
]

const exportRoutes = [
  'app/api/launch-kit/projects/[id]/markdown/route.ts',
  'app/api/launch-kit/projects/[id]/press-pack/route.ts',
]

const routeInputValidationRoutes = [
  'app/api/launch-kit/projects/route.ts',
  'app/api/launch-kit/profile/route.ts',
  'app/api/launch-kit/actions/export-leads/route.ts',
  'app/api/launch-kit/actions/export-backlinks/route.ts',
  'app/api/launch-kit/actions/import-email-list/route.ts',
]

describe('launch api route guards', () => {
  it('uses the shared launch api access guard for saved project/profile reads and exports', () => {
    for (const route of savedProjectRoutes) {
      const source = readFileSync(route, 'utf8')

      expect(source, route).toContain('requireLaunchApiAccess')
      expect(source, route).not.toContain('requireServerSession')
    }
  })

  it('rate limits saved project/profile reads separately from writes and exports', () => {
    for (const route of projectReadRoutes) {
      const source = readFileSync(route, 'utf8')

      expect(source, route).toContain("rateLimitAction: 'project_read'")
    }

    for (const route of exportRoutes) {
      const source = readFileSync(route, 'utf8')

      expect(source, route).toContain("rateLimitAction: 'export'")
    }
  })

  it('documents the saved project read rate-limit override in env templates', () => {
    const rateLimitSource = readFileSync('lib/launch-kit/rate-limit.ts', 'utf8')
    const localEnv = readFileSync('.env.example', 'utf8')
    const productionEnv = readFileSync('.env.production.example', 'utf8')

    expect(rateLimitSource).toContain('project_read')
    expect(localEnv).toContain('RATE_LIMIT_PROJECT_READ')
    expect(productionEnv).toContain('RATE_LIMIT_PROJECT_READ')
  })

  it('uses runtime JSON field extraction for route-local strings and object payloads', () => {
    for (const route of routeInputValidationRoutes) {
      const source = readFileSync(route, 'utf8')

      expect(source, route).toMatch(/getJson(?:String|Object)Field/)
      expect(source, route).not.toContain('body.name?.trim()')
      expect(source, route).not.toContain('body.language?.trim()')
      expect(source, route).not.toContain('slugify(body.projectName')
      expect(source, route).not.toContain('rawContacts: body.rawContacts ||')
      expect(source, route).not.toContain('body.profile || {}')
      expect(source, route).not.toContain('getJsonObjectField<')
      expect(source, route).not.toContain('readJsonBody<')
    }
  })

  it('does not pass sensitive nested JSON payloads directly from typed request bodies', () => {
    const forbiddenNestedPayloadPattern =
      /body\.(?:brief|launchKit|kit|seoGrowth|prospecting)(?!Input|\s*=)/

    for (const route of listRouteFiles('app/api/launch-kit')) {
      const source = readFileSync(route, 'utf8')

      expect(source, route).not.toMatch(forbiddenNestedPayloadPattern)
    }
  })

  it('uses the trusted JSON body reader for Launch Kit mutating route bodies', () => {
    for (const route of listRouteFiles('app/api/launch-kit')) {
      const source = readFileSync(route, 'utf8')

      expect(source, route).not.toContain('readJsonBody')
    }
  })
})

function listRouteFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name)
    if (entry.isDirectory()) {
      return listRouteFiles(path)
    }

    return entry.name === 'route.ts' ? [path] : []
  })
}
