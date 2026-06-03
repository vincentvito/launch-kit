import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchPublicHtml } from '../lib/launch-kit/url-extractor'
import { normalizePublicHttpUrl } from '../lib/launch-kit/url-safety'

vi.mock('node:dns/promises', () => ({
  lookup: vi.fn(async () => [{ address: '93.184.216.34' }]),
}))

const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL

describe('URL extraction fetch boundary', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    if (originalAppUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL
    } else {
      process.env.NEXT_PUBLIC_APP_URL = originalAppUrl
    }
  })

  it('follows public redirects manually after revalidating the target URL', async () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://launch.example'
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
      expect.objectContaining({
        headers: expect.objectContaining({
          'user-agent': 'LaunchKitBot/1.0 (+https://launch.example)',
        }),
        redirect: 'manual',
      }),
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

  it('normalizes public provider URLs without keeping tracking fragments', () => {
    expect(normalizePublicHttpUrl('https://example.com/path?utm_source=test#demo')).toBe(
      'https://example.com/path',
    )
    expect(normalizePublicHttpUrl('https://example.com/path', { includePath: false })).toBe(
      'https://example.com',
    )
    expect(normalizePublicHttpUrl('https://[2606:4700:4700::1111]/dns?utm=test#frag')).toBe(
      'https://[2606:4700:4700::1111]/dns',
    )
  })

  it('drops private or internal provider URLs before they enter discovery data', () => {
    expect(normalizePublicHttpUrl('http://localhost:3000')).toBe('')
    expect(normalizePublicHttpUrl('https://intranet')).toBe('')
    expect(normalizePublicHttpUrl('https://printer.local')).toBe('')
    expect(normalizePublicHttpUrl('http://127.0.0.1/private')).toBe('')
    expect(normalizePublicHttpUrl('http://10.0.0.5/private')).toBe('')
    expect(normalizePublicHttpUrl('http://192.0.0.10/private')).toBe('')
    expect(normalizePublicHttpUrl('http://224.0.0.1/private')).toBe('')
    expect(normalizePublicHttpUrl('http://[::1]/private')).toBe('')
    expect(normalizePublicHttpUrl('http://[fd00::1]/private')).toBe('')
    expect(normalizePublicHttpUrl('http://[fe80::1]/private')).toBe('')
    expect(normalizePublicHttpUrl('http://[ff02::1]/private')).toBe('')
  })
})
