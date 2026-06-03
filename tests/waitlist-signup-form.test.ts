import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('waitlist signup form', () => {
  it('waits for a saved signup before unlocking the sample', () => {
    const source = readFileSync('components/waiting-list/waiting-list-signup-form.tsx', 'utf8')
    const fetchIndex = source.indexOf("await fetch('/api/waitlist'")
    const okIndex = source.indexOf('if (!response.ok)')
    const unlockIndex = source.indexOf('onSampleUnlocked(trimmed)')

    expect(source).not.toContain("void fetch('/api/waitlist'")
    expect(source).toContain("source: 'waitlist'")
    expect(source).toContain("dispatch({ type: 'saving' })")
    expect(fetchIndex).toBeGreaterThanOrEqual(0)
    expect(okIndex).toBeGreaterThan(fetchIndex)
    expect(unlockIndex).toBeGreaterThan(okIndex)
  })
})
