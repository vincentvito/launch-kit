import { createHmac } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/billing/webhook/stripe/route'

vi.mock('@/lib/prisma', () => ({
  default: {
    userPlan: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}))

const originalEnv = {
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
}

describe('stripe webhook route', () => {
  afterEach(() => {
    if (originalEnv.STRIPE_WEBHOOK_SECRET === undefined) {
      delete process.env.STRIPE_WEBHOOK_SECRET
    } else {
      process.env.STRIPE_WEBHOOK_SECRET = originalEnv.STRIPE_WEBHOOK_SECRET
    }
  })

  it('rejects signed but malformed Stripe event payloads with a 400', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    const payload = JSON.stringify({ id: 'evt_bad', data: { object: {} } })
    const response = await POST(new Request('https://launch.example/api/billing/webhook/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': signStripePayload(payload, 'whsec_test'),
      },
      body: payload,
    }))

    await expect(response.json()).resolves.toEqual({ error: 'Invalid webhook payload.' })
    expect(response.status).toBe(400)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
  })
})

function signStripePayload(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')

  return `t=${timestamp},v1=${signature}`
}
