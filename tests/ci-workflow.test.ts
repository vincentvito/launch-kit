import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('CI workflow', () => {
  it('runs the production-quality local verification gates', () => {
    const workflow = readFileSync('.github/workflows/ci.yml', 'utf8')

    expect(workflow).toContain('npm ci')
    expect(workflow).toContain('npm run lint')
    expect(workflow).toContain('npm run test')
    expect(workflow).toContain('npm run build')
    expect(workflow).toContain('npm run maintenance:run')
    expect(workflow).toContain('npm audit --audit-level=moderate')
    expect(workflow).toContain('npm run preflight:production')
    expect(workflow).toContain('continue-on-error: true')
  })
})
