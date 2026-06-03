import { afterEach, describe, expect, it, vi } from 'vitest'
import { dispatchEmailDelivery } from '../lib/email-delivery'

const originalEnv = {
  OUTREACH_EMAIL_WEBHOOK_URL: process.env.OUTREACH_EMAIL_WEBHOOK_URL,
  OUTREACH_EMAIL_WEBHOOK_TOKEN: process.env.OUTREACH_EMAIL_WEBHOOK_TOKEN,
  VERCEL_ENV: process.env.VERCEL_ENV,
  NODE_ENV: process.env.NODE_ENV,
}

describe('email delivery webhook', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  })

  it('does not deliver when the webhook is not configured', async () => {
    delete process.env.OUTREACH_EMAIL_WEBHOOK_URL

    await expect(dispatchEmailDelivery({
      kind: 'lead_outreach',
      payload: { leads: [] },
    })).resolves.toEqual({
      configured: false,
      delivered: false,
    })
  })

  it('sends delivery payloads with the configured bearer token', async () => {
    process.env.OUTREACH_EMAIL_WEBHOOK_URL = 'https://delivery.example/webhook'
    process.env.OUTREACH_EMAIL_WEBHOOK_TOKEN = 'delivery-token'
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(dispatchEmailDelivery({
      kind: 'backlink_outreach',
      payload: { prospects: [{ email: 'editor@example.com' }] },
    })).resolves.toEqual({
      configured: true,
      delivered: true,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://delivery.example/webhook',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          authorization: 'Bearer delivery-token',
          'content-type': 'application/json',
        }),
        body: JSON.stringify({
          kind: 'backlink_outreach',
          payload: { prospects: [{ email: 'editor@example.com' }] },
        }),
      }),
    )
  })

  it('rejects invalid webhook URLs before dispatch', async () => {
    process.env.OUTREACH_EMAIL_WEBHOOK_URL = 'not a url'

    await expect(dispatchEmailDelivery({
      kind: 'lead_outreach',
      payload: {},
    })).rejects.toThrow('Invalid email delivery webhook URL.')
  })

  it('rejects local plaintext webhook URLs in production', async () => {
    process.env.VERCEL_ENV = 'production'
    process.env.OUTREACH_EMAIL_WEBHOOK_URL = 'http://localhost:8787/webhook'

    await expect(dispatchEmailDelivery({
      kind: 'lead_outreach',
      payload: {},
    })).rejects.toThrow('Email delivery webhook must use a public HTTPS URL in production.')
  })
})
