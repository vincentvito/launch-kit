import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('dashboard hydration contract', () => {
  it('keeps the initial demo snapshot deterministic between server and client render', () => {
    const source = readFileSync('app/dashboard/dashboard-client.tsx', 'utf8')

    expect(source).not.toContain('window.location.origin')
    expect(source).toContain('return createDemoSnapshot()')
  })
})
