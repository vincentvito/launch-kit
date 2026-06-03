import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getJsonObjectField,
  getJsonStringArrayField,
  getJsonStringField,
  internalServerErrorResponse,
  LaunchApiError,
  launchApiErrorResponse,
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readJsonBody,
} from '../lib/launch-kit/api-guard'
import { ProductionReadinessError } from '../lib/env'

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

  it('returns a production readiness response without exposing detailed deploy config', async () => {
    const response = launchApiErrorResponse(
      new ProductionReadinessError([
        {
          key: 'BETTER_AUTH_SECRET',
          ok: false,
          message: 'Set a strong Better Auth secret with at least 32 characters.',
        },
      ]),
    )

    await expect(response.json()).resolves.toEqual({
      error: 'Service is not ready for production.',
      code: 'production_not_ready',
    })
    expect(response.status).toBe(503)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
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

  it('rejects non-object JSON bodies before route handlers treat them as typed objects', async () => {
    await expect(readJsonBody(jsonRequest('null'))).rejects.toMatchObject({
      status: 400,
      code: 'invalid_json',
      message: 'JSON body must be an object.',
    })
    await expect(readJsonBody(jsonRequest('[]'))).rejects.toMatchObject({
      status: 400,
      code: 'invalid_json',
      message: 'JSON body must be an object.',
    })
  })

  it('accepts object JSON bodies through the shared reader', async () => {
    await expect(readJsonBody(jsonRequest('{"email":"founder@example.com"}')))
      .resolves
      .toEqual({ email: 'founder@example.com' })
  })

  it('extracts typed JSON fields without trusting malformed client values', () => {
    const body = {
      name: '  LaunchKit  ',
      rawContacts: 'Ada, ada@example.com\nGrace, grace@example.com',
      profile: { founderName: 'Ada' },
      projectName: ['not', 'a', 'string'],
      prospecting: null,
      ids: [' lead_1 ', 42, '', 'lead_2'],
    }

    expect(getJsonStringField(body, 'name')).toBe('LaunchKit')
    expect(getJsonStringField(body, 'rawContacts', { trim: false })).toBe(
      'Ada, ada@example.com\nGrace, grace@example.com',
    )
    expect(getJsonStringField(body, 'projectName')).toBe('')
    expect(getJsonStringArrayField(body, 'ids', { maxLength: 6 })).toEqual(['lead_1', 'lead_2'])
    expect(getJsonObjectField(body, 'profile')).toEqual({ founderName: 'Ada' })
    expect(getJsonObjectField(body, 'prospecting')).toBeNull()
  })
})

function jsonRequest(body: string) {
  return new Request('https://launch.example/api', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body,
  })
}
