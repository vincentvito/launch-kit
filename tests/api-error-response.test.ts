import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  internalServerErrorResponse,
  LaunchApiError,
  launchApiErrorResponse,
  launchApiRouteErrorResponse,
  privateJsonResponse,
} from '../lib/launch-kit/api-guard'

describe('api error responses', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not expose internal error messages to clients', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const response = internalServerErrorResponse(
      new Error('Stripe checkout failed with 401'),
      'Could not start checkout.',
      'billing_checkout_failed',
    )

    await expect(response.json()).resolves.toEqual({ error: 'Could not start checkout.' })
    expect(response.status).toBe(500)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    expect(consoleError).toHaveBeenCalledTimes(1)
    expect(consoleError.mock.calls[0]?.[0]).toContain('Stripe checkout failed with 401')
  })

  it('marks private JSON responses as non-cacheable', async () => {
    const response = privateJsonResponse({ project: { id: 'project_123' } })

    await expect(response.json()).resolves.toEqual({ project: { id: 'project_123' } })
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
  })

  it('marks structured API errors as non-cacheable', async () => {
    const response = launchApiErrorResponse(
      new LaunchApiError(429, 'rate_limited', 'Rate limit exceeded.', 60),
    )

    await expect(response.json()).resolves.toEqual({
      error: 'Rate limit exceeded.',
      code: 'rate_limited',
    })
    expect(response.status).toBe(429)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    expect(response.headers.get('Retry-After')).toBe('60')
  })

  it('logs unexpected route errors through the shared route helper', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const response = launchApiRouteErrorResponse(
      new Error('Provider request failed with 502'),
      'Action failed.',
      'launch_action_failed',
    )

    await expect(response.json()).resolves.toEqual({ error: 'Action failed.' })
    expect(response.status).toBe(500)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    expect(consoleError).toHaveBeenCalledTimes(1)
    expect(consoleError.mock.calls[0]?.[0]).toContain('Provider request failed with 502')
  })
})
