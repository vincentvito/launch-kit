import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function routeFileForPath(path: string): string {
  return `app${path}/route.ts`
}

describe('README', () => {
  it('documents operational API endpoints that exist', () => {
    const readme = readFileSync('README.md', 'utf8')
    const endpointMatches = readme.matchAll(/^- `(\/api\/[^`]+)` - /gm)
    const endpoints = Array.from(endpointMatches, (match) => match[1])

    expect(endpoints).toEqual(expect.arrayContaining([
      '/api/health',
      '/api/readiness',
      '/api/billing/webhook/stripe',
    ]))

    for (const endpoint of endpoints) {
      expect(existsSync(routeFileForPath(endpoint)), endpoint).toBe(true)
    }
  })
})
