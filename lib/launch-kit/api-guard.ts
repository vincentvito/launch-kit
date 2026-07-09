import { NextResponse } from 'next/server'
import { getAllowedOrigins, isProductionRuntime, isPublicFreeGenerationEnabled } from '@/lib/env'
import { isPostgresDatabaseUrl } from '@/lib/database-provider'
import type { LaunchEntitlement } from '@/lib/launch-kit/entitlements'
import type { RateLimitResult } from '@/lib/launch-kit/rate-limit'
import { getSubjectKey } from '@/lib/launch-kit/security'
import { logServerError } from '@/lib/observability'

type SessionLike = {
  user: {
    id: string
    email?: string | null
  }
} | null

export type LaunchApiAccess = {
  session: NonNullable<SessionLike> | null
  entitlement: LaunchEntitlement
  subjectKey: string
  rateLimit: RateLimitResult
  persistence: 'database' | 'stateless'
}

export type LaunchApiAccessOptions = {
  action: string
  feature: 'free' | 'premium'
  allowAnonymous?: boolean
  rateLimitAction?: string
}

export class LaunchApiError extends Error {
  status: number
  code: string
  retryAfter?: number

  constructor(status: number, code: string, message: string, retryAfter?: number) {
    super(message)
    this.status = status
    this.code = code
    this.retryAfter = retryAfter
  }
}

export async function readJsonBody<T>(
  request: Request,
  options: {
    maxBytes?: number
  } = {},
): Promise<T> {
  const contentType = request.headers.get('content-type') || ''

  if (!contentType.toLowerCase().includes('application/json')) {
    throw new LaunchApiError(415, 'unsupported_media_type', 'Content-Type must be application/json.')
  }

  try {
    return JSON.parse(await readTextBody(request, options)) as T
  } catch (error) {
    if (error instanceof LaunchApiError) {
      throw error
    }
    throw new LaunchApiError(400, 'invalid_json', 'Invalid request body.')
  }
}

export async function readTextBody(
  request: Request,
  options: {
    maxBytes?: number
  } = {},
): Promise<string> {
  const maxBytes = options.maxBytes || 1024 * 1024
  const contentLength = request.headers.get('content-length')
  if (contentLength && Number.parseInt(contentLength, 10) > maxBytes) {
    throw new LaunchApiError(413, 'payload_too_large', 'Request body is too large.')
  }

  if (!request.body) {
    return ''
  }

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      totalBytes += value.byteLength
      if (totalBytes > maxBytes) {
        throw new LaunchApiError(413, 'payload_too_large', 'Request body is too large.')
      }

      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }

  return new TextDecoder().decode(concatChunks(chunks, totalBytes))
}

function concatChunks(chunks: Uint8Array[], totalBytes: number): Uint8Array {
  const buffer = new Uint8Array(totalBytes)
  let offset = 0

  for (const chunk of chunks) {
    buffer.set(chunk, offset)
    offset += chunk.byteLength
  }

  return buffer
}

export async function getRequestSession(request: Request) {
  const { auth } = await import('@/lib/auth')

  return auth.api.getSession({
    headers: request.headers,
  }) as Promise<SessionLike>
}

export async function requireLaunchApiAccess(
  request: Request,
  options: LaunchApiAccessOptions,
): Promise<LaunchApiAccess> {
  assertTrustedRequestOrigin(request)

  const allowAnonymousFree =
    options.feature === 'free' &&
    options.allowAnonymous === true &&
    isPublicFreeGenerationEnabled()

  if (shouldUseStatelessFreeAccess(allowAnonymousFree)) {
    return createStatelessFreeAccess(request)
  }

  const session = await getRequestSession(request)
  const user = session?.user
  const entitlement = user
    ? await getPersistedLaunchEntitlement(user)
    : getAnonymousLaunchEntitlement()
  const subjectKey = getSubjectKey(request, user?.id)
  const isPremium = options.feature === 'premium'

  if (!session && !allowAnonymousFree) {
    throw new LaunchApiError(401, 'unauthorized', 'Sign in to continue.')
  }

  if (isPremium && !entitlement.hasPremium) {
    throw new LaunchApiError(402, 'upgrade_required', 'Upgrade to Premium to use this feature.')
  }

  if (isProductionRuntime() && options.feature === 'free' && !session && !allowAnonymousFree) {
    throw new LaunchApiError(401, 'unauthorized', 'Sign in to continue.')
  }

  const rateLimitAction = options.rateLimitAction || (isPremium ? 'premium_action' : options.action)
  const { consumeRateLimit, getRateLimitPolicy } = await import('@/lib/launch-kit/rate-limit')
  const rateLimit = await consumeRateLimit({
    subjectKey,
    action: rateLimitAction,
    policy: getRateLimitPolicy(rateLimitAction, entitlement.hasPremium),
  })

  if (!rateLimit.ok) {
    const retryAfter = Math.max(
      1,
      Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000),
    )
    throw new LaunchApiError(429, 'rate_limited', 'Rate limit exceeded. Try again later.', retryAfter)
  }

  return {
    session,
    entitlement,
    subjectKey,
    rateLimit,
    persistence: 'database',
  }
}

function hasRuntimePostgresDatabase(): boolean {
  return [process.env.DATABASE_URL, process.env.DIRECT_URL].some((value) =>
    value ? isPostgresDatabaseUrl(value) : false,
  )
}

function shouldUseStatelessFreeAccess(allowAnonymousFree: boolean): boolean {
  return allowAnonymousFree && !isProductionRuntime() && !hasRuntimePostgresDatabase()
}

function getAnonymousLaunchEntitlement(): LaunchEntitlement {
  return {
    plan: 'free',
    status: 'anonymous',
    hasPremium: false,
  }
}

async function getPersistedLaunchEntitlement(user: NonNullable<SessionLike>['user']) {
  const { getLaunchEntitlement } = await import('@/lib/launch-kit/entitlements')
  return getLaunchEntitlement(user)
}

function createStatelessFreeAccess(request: Request): LaunchApiAccess {
  const entitlement = getAnonymousLaunchEntitlement()

  return {
    session: null,
    entitlement,
    subjectKey: getSubjectKey(request),
    rateLimit: {
      ok: true,
      limit: Number.POSITIVE_INFINITY,
      remaining: Number.POSITIVE_INFINITY,
      resetAt: new Date(Date.now() + 60 * 60 * 1000),
    },
    persistence: 'stateless',
  }
}

export function assertTrustedRequestOrigin(request: Request): void {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
    return
  }

  const origin = request.headers.get('origin')

  if (!origin) {
    if (isProductionRuntime()) {
      throw new LaunchApiError(403, 'untrusted_origin', 'Request origin is required.')
    }
    return
  }

  const normalizedOrigin = normalizeOrigin(origin)
  if (!normalizedOrigin) {
    throw new LaunchApiError(403, 'untrusted_origin', 'Request origin is not allowed.')
  }

  const requestOrigin = new URL(request.url).origin
  if (
    !isProductionRuntime() &&
    (normalizedOrigin === requestOrigin || (isLoopbackOrigin(normalizedOrigin) && isLoopbackOrigin(requestOrigin)))
  ) {
    return
  }

  const allowedOrigins = getAllowedOrigins()
    .map((value) => normalizeOrigin(value))
    .filter((value): value is string => Boolean(value))

  if (!allowedOrigins.includes(normalizedOrigin)) {
    throw new LaunchApiError(403, 'untrusted_origin', 'Request origin is not allowed.')
  }
}

function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value)
    return url.origin
  } catch {
    return null
  }
}

function isLoopbackOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin)
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]'
  } catch {
    return false
  }
}

export async function recordLaunchApiUsage(
  access: LaunchApiAccess,
  action: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  if (access.persistence === 'stateless') {
    return
  }

  const { recordUsageEvent } = await import('@/lib/launch-kit/usage')
  await recordUsageEvent({
    userId: access.session?.user.id,
    subjectKey: access.subjectKey,
    action,
    metadata,
  })
}

export function privateJsonResponse(body: unknown, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(body, init)
  markPrivateNoStore(response)
  return response
}

function markPrivateNoStore(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}

export function launchApiErrorResponse(error: unknown): NextResponse {
  if (error instanceof LaunchApiError) {
    const response = markPrivateNoStore(
      NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.status },
      ),
    )

    if (error.retryAfter) {
      response.headers.set('Retry-After', String(error.retryAfter))
    }

    return response
  }

  if (error instanceof Error && error.message === 'UNAUTHORIZED') {
    return markPrivateNoStore(
      NextResponse.json({ error: 'Unauthorized', code: 'unauthorized' }, { status: 401 }),
    )
  }

  return markPrivateNoStore(
    NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 }),
  )
}

export function internalServerErrorResponse(
  error: unknown,
  publicMessage = 'Unexpected server error.',
  event = 'launch_api_internal_error',
): NextResponse {
  logServerError(event, error)
  return markPrivateNoStore(NextResponse.json({ error: publicMessage }, { status: 500 }))
}

export function launchApiRouteErrorResponse(
  error: unknown,
  publicMessage = 'Unexpected server error.',
  event = 'launch_api_internal_error',
): NextResponse {
  if (
    error instanceof LaunchApiError ||
    (error instanceof Error && error.message === 'UNAUTHORIZED')
  ) {
    return launchApiErrorResponse(error)
  }

  return internalServerErrorResponse(error, publicMessage, event)
}
