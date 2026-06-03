import { afterEach, describe, expect, it, vi } from 'vitest'
import { runReplicatePrediction } from '@/lib/launch-kit/replicate'

const originalToken = process.env.REPLICATE_API_TOKEN

describe('replicate adapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    if (originalToken === undefined) {
      delete process.env.REPLICATE_API_TOKEN
    } else {
      process.env.REPLICATE_API_TOKEN = originalToken
    }
  })

  it('returns null when the create response is not a valid prediction', async () => {
    process.env.REPLICATE_API_TOKEN = 'replicate-token'
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 42, status: 'succeeded' }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      runReplicatePrediction({
        model: 'owner/model',
        input: { prompt: 'Generate asset' },
      }),
    ).resolves.toBeNull()

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not follow untrusted poll URLs from provider payloads', async () => {
    process.env.REPLICATE_API_TOKEN = 'replicate-token'
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'pred_123',
            status: 'processing',
            urls: {
              get: 'http://127.0.0.1/admin',
              web: 'javascript:alert(1)',
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ bad: true }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await runReplicatePrediction({
      model: 'owner/model',
      input: { prompt: 'Generate asset' },
      pollTimeoutMs: 1,
    })

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.replicate.com/v1/predictions/pred_123',
      expect.any(Object),
    )
    expect(result).toMatchObject({
      id: 'pred_123',
      status: 'failed',
      outputUrl: '',
      webUrl: 'https://replicate.com/p/pred_123',
      getUrl: 'https://api.replicate.com/v1/predictions/pred_123',
    })
  })

  it('sanitizes generated output URLs before returning them to the app', async () => {
    process.env.REPLICATE_API_TOKEN = 'replicate-token'
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'pred_456',
          status: 'succeeded',
          output: {
            url: 'javascript:alert(1)',
            images: [
              'http://localhost/internal.png',
              'https://cdn.example.com/generated.png?token=abc#frag',
            ],
          },
          urls: {
            get: 'https://api.replicate.com/v1/predictions/pred_456#frag',
            web: 'https://replicate.com/p/pred_456#frag',
          },
        }),
        { status: 200 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await runReplicatePrediction({
      model: 'owner/model',
      input: { prompt: 'Generate asset' },
    })

    expect(result).toMatchObject({
      id: 'pred_456',
      status: 'succeeded',
      outputUrl: 'https://cdn.example.com/generated.png?token=abc',
      webUrl: 'https://replicate.com/p/pred_456',
      getUrl: 'https://api.replicate.com/v1/predictions/pred_456',
    })
  })
})
