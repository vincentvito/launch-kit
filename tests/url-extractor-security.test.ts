import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchPublicHtml } from '../lib/launch-kit/url-extractor'

vi.mock('node:dns/promises', () => ({
  lookup: vi.fn(async () => [{ address: '93.184.216.34' }]),
}))

describe('URL extraction fetch boundary', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('follows public redirects manually after revalidating the target URL', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, {
        status: 302,
        headers: { location: '/landing' },
      }))
      .mockResolvedValueOnce(new Response('<html><body><main>Launch Kit</main></body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchPublicHtml('https://example.com')

    expect(result).toEqual({
      url: 'https://example.com/landing',
      html: '<html><body><main>Launch Kit</main></body></html>',
    })
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://example.com',
      expect.objectContaining({ redirect: 'manual' }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://example.com/landing',
      expect.objectContaining({ redirect: 'manual' }),
    )
  })

  it('rejects redirects to private or internal addresses before fetching them', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(null, {
      status: 302,
      headers: { location: 'http://127.0.0.1/private' },
    }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchPublicHtml('https://example.com')).rejects.toThrow(
      'Refusing to fetch a private or internal address',
    )
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects oversized HTML responses before reading the body', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response('<html></html>', {
      status: 200,
      headers: {
        'content-type': 'text/html',
        'content-length': String(2 * 1024 * 1024 + 1),
      },
    }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchPublicHtml('https://example.com')).rejects.toThrow('Fetched HTML is too large')
  })
})
