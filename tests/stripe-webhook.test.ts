import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyStripeWebhookSignature } from '../lib/stripe-webhook'

describe('stripe webhook verification', () => {
  it('accepts a valid v1 signature', () => {
    const payload = JSON.stringify({ id: 'evt_test' })
    const timestamp = '123456'
    const secret = 'whsec_test'
    const signature = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')

    expect(
      verifyStripeWebhookSignature({
        payload,
        signatureHeader: `t=${timestamp},v1=${signature}`,
        secret,
        now: Number(timestamp) * 1000,
      }),
    ).toBe(true)
  })

  it('rejects invalid signatures', () => {
    expect(
      verifyStripeWebhookSignature({
        payload: '{}',
        signatureHeader: 't=123,v1=deadbeef',
        secret: 'whsec_test',
        now: 123000,
      }),
    ).toBe(false)
  })

  it('rejects signatures outside the timestamp tolerance', () => {
    const payload = JSON.stringify({ id: 'evt_test' })
    const timestamp = '123456'
    const secret = 'whsec_test'
    const signature = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')

    expect(
      verifyStripeWebhookSignature({
        payload,
        signatureHeader: `t=${timestamp},v1=${signature}`,
        secret,
        now: (Number(timestamp) + 301) * 1000,
      }),
    ).toBe(false)
  })

  it('accepts any valid v1 signature when Stripe sends multiple signatures', () => {
    const payload = JSON.stringify({ id: 'evt_test' })
    const timestamp = '123456'
    const secret = 'whsec_test'
    const signature = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')

    expect(
      verifyStripeWebhookSignature({
        payload,
        signatureHeader: `t=${timestamp},v1=deadbeef,v1=${signature}`,
        secret,
        now: Number(timestamp) * 1000,
      }),
    ).toBe(true)
  })

  it('rejects non-numeric timestamps', () => {
    const payload = JSON.stringify({ id: 'evt_test' })
    const secret = 'whsec_test'
    const signature = createHmac('sha256', secret).update('123abc.' + payload).digest('hex')

    expect(
      verifyStripeWebhookSignature({
        payload,
        signatureHeader: `t=123abc,v1=${signature}`,
        secret,
        now: 123000,
      }),
    ).toBe(false)
  })
})
