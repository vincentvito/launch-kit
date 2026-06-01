import { describe, expect, it } from 'vitest'
import { getHealthPayload } from '../lib/health'

describe('health payload', () => {
  it('returns a stable liveness shape', () => {
    const payload = getHealthPayload()

    expect(payload.ok).toBe(true)
    expect(payload.service).toBe('launch-kit')
    expect(payload.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})
