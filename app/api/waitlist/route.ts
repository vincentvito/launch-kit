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

const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com', '10minutemail.net', 'guerrillamail.com', 'guerrillamail.net',
  'sharklasers.com', 'guerrillamailblock.com', 'mailinator.com', 'mailinator.net',
  'yopmail.com', 'yopmail.net', 'tempmail.com', 'temp-mail.org', 'tempmail.net',
  'getnada.com', 'nada.email', 'trashmail.com', 'trashmail.net', 'throwawaymail.com',
  'maildrop.cc', 'mailnesia.com', 'mintemail.com', 'mohmal.com', 'dispostable.com',
  'fakeinbox.com', 'spam4.me', 'tmpmail.org', 'mailcatch.com', 'emailondeck.com',
  'discard.email', 'getairmail.com', 'maileater.com', 'spamgourmet.com',
])

const MIN_SUBMIT_MS = 2000

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

  const fields = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>
  const honeypot = typeof fields.company === 'string' ? fields.company.trim() : ''
  if (honeypot) {
    return privateJsonResponse({ ok: true })
  }

  const elapsedMs = typeof fields.elapsedMs === 'number' ? fields.elapsedMs : 0
  if (elapsedMs > 0 && elapsedMs < MIN_SUBMIT_MS) {
    return privateJsonResponse({ ok: true })
  }

  const email = typeof fields.email === 'string' ? fields.email.trim().toLowerCase() : ''
  const source = typeof fields.source === 'string' ? fields.source.trim().slice(0, 120) : ''

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

  const domain = email.slice(email.lastIndexOf('@') + 1)
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return privateJsonResponse(
      { error: 'Please use a permanent email address.' },
      { status: 400 },
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
