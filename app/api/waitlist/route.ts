import prisma from '@/lib/prisma'
import {
  assertTrustedRequestOrigin,
  launchApiErrorResponse,
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readJsonBody,
} from '@/lib/launch-kit/api-guard'
import { consumeRateLimit, getRateLimitPolicy } from '@/lib/launch-kit/rate-limit'
import { getClientIp, getSafeReferrer, getSafeUserAgent, getSubjectKey, hashIdentifier } from '@/lib/launch-kit/security'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    assertTrustedRequestOrigin(request)
  } catch (error) {
    return launchApiErrorResponse(error)
  }

  let body: unknown

  try {
    body = await readJsonBody(request, { maxBytes: 16 * 1024 })
  } catch (error) {
    return launchApiErrorResponse(error)
  }

  const email =
    typeof body === 'object' && body !== null && 'email' in body && typeof body.email === 'string'
      ? body.email.trim().toLowerCase()
      : ''
  const source =
    typeof body === 'object' && body !== null && 'source' in body && typeof body.source === 'string'
      ? body.source.trim().slice(0, 120)
      : ''

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return privateJsonResponse({ error: 'A valid email is required.' }, { status: 400 })
  }

  const rateLimit = await consumeRateLimit({
    subjectKey: getSubjectKey(request),
    action: 'waitlist_signup',
    policy: getRateLimitPolicy('waitlist_signup', false),
  })

  if (!rateLimit.ok) {
    return privateJsonResponse(
      { error: 'Too many signup attempts. Try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.max(1, Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000))),
        },
      },
    )
  }

  try {
    await prisma.waitlistEntry.upsert({
      where: { email },
      create: {
        email,
        source: source || null,
        referrer: getSafeReferrer(request) || null,
        userAgent: getSafeUserAgent(request) || null,
        ipHash: hashIdentifier(getClientIp(request)),
      },
      update: {
        source: source || undefined,
        referrer: getSafeReferrer(request) || undefined,
        userAgent: getSafeUserAgent(request) || undefined,
        ipHash: hashIdentifier(getClientIp(request)),
      },
    })
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Could not save your email. Try again.',
      'waitlist_signup_failed',
    )
  }

  return privateJsonResponse({ ok: true })
}
