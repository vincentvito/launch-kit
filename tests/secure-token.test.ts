import { describe, expect, it } from 'vitest'
import { verifyBearerToken } from '../lib/secure-token'

describe('secure bearer token verification', () => {
  it('accepts matching bearer tokens', () => {
    expect(verifyBearerToken('Bearer secret-token', 'secret-token')).toBe(true)
  })

  it('rejects missing, malformed, or mismatched bearer tokens', () => {
    expect(verifyBearerToken(null, 'secret-token')).toBe(false)
    expect(verifyBearerToken('Basic secret-token', 'secret-token')).toBe(false)
    expect(verifyBearerToken('Bearer wrong-token', 'secret-token')).toBe(false)
    expect(verifyBearerToken('Bearer secret-token', undefined)).toBe(false)
  })
})
