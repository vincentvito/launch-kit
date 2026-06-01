import { describe, expect, it } from 'vitest'
import { LaunchApiError, readJsonBody, readTextBody } from '../lib/launch-kit/api-guard'

async function expectLaunchApiError(
  promise: Promise<unknown>,
  expected: {
    status: number
    code: string
  },
) {
  try {
    await promise
    throw new Error('Expected request parsing to fail.')
  } catch (error) {
    expect(error).toBeInstanceOf(LaunchApiError)
    expect((error as LaunchApiError).status).toBe(expected.status)
    expect((error as LaunchApiError).code).toBe(expected.code)
  }
}

describe('readJsonBody', () => {
  it('parses a valid JSON request body', async () => {
    const body = await readJsonBody<{ name: string }>(
      new Request('https://launch.example/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ name: 'LaunchKit' }),
      }),
    )

    expect(body.name).toBe('LaunchKit')
  })

  it('rejects non-JSON requests', async () => {
    await expectLaunchApiError(
      readJsonBody(
        new Request('https://launch.example/api/test', {
          method: 'POST',
          headers: { 'content-type': 'text/plain' },
          body: 'plain text',
        }),
      ),
      { status: 415, code: 'unsupported_media_type' },
    )
  })

  it('rejects requests with a content length above the configured limit', async () => {
    await expectLaunchApiError(
      readJsonBody(
        new Request('https://launch.example/api/test', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'content-length': '2048',
          },
          body: JSON.stringify({ ok: true }),
        }),
        { maxBytes: 16 },
      ),
      { status: 413, code: 'payload_too_large' },
    )
  })

  it('rejects streamed request bodies above the configured limit', async () => {
    await expectLaunchApiError(
      readJsonBody(
        new Request('https://launch.example/api/test', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text: 'this body is too large' }),
        }),
        { maxBytes: 8 },
      ),
      { status: 413, code: 'payload_too_large' },
    )
  })

  it('rejects malformed JSON', async () => {
    await expectLaunchApiError(
      readJsonBody(
        new Request('https://launch.example/api/test', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{"missing":',
        }),
      ),
      { status: 400, code: 'invalid_json' },
    )
  })

  it('applies byte limits to raw text bodies', async () => {
    await expectLaunchApiError(
      readTextBody(
        new Request('https://launch.example/api/webhook', {
          method: 'POST',
          body: 'signed webhook payload',
        }),
        { maxBytes: 8 },
      ),
      { status: 413, code: 'payload_too_large' },
    )
  })
})
