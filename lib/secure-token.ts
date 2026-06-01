import { createHash, timingSafeEqual } from 'node:crypto'

export function verifyBearerToken(headerValue: string | null, expectedToken: string | undefined): boolean {
  if (!expectedToken) {
    return false
  }

  const prefix = 'Bearer '
  if (!headerValue?.startsWith(prefix)) {
    return false
  }

  const providedToken = headerValue.slice(prefix.length)
  if (!providedToken) {
    return false
  }

  const providedHash = hashToken(providedToken)
  const expectedHash = hashToken(expectedToken)

  return timingSafeEqual(providedHash, expectedHash)
}

function hashToken(token: string): Buffer {
  return createHash('sha256').update(token).digest()
}
