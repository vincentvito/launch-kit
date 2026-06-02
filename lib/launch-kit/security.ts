import { createHash } from 'node:crypto'
import { getRateLimitSalt } from '@/lib/env'

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown'
  }

  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

export function hashIdentifier(value: string): string {
  return createHash('sha256')
    .update(getRateLimitSalt())
    .update(':')
    .update(value)
    .digest('hex')
}

export function getSubjectKey(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  return `ip:${hashIdentifier(getClientIp(request)).slice(0, 32)}`
}

export function getSafeUserAgent(request: Request): string {
  return (request.headers.get('user-agent') || '').slice(0, 300)
}

export function getSafeReferrer(request: Request): string {
  return (request.headers.get('referer') || request.headers.get('referrer') || '').slice(0, 500)
}
