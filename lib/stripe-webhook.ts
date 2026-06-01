import { createHmac, timingSafeEqual } from 'node:crypto'

export function verifyStripeWebhookSignature(input: {
  payload: string
  signatureHeader: string | null
  secret: string
  toleranceSeconds?: number
  now?: number
}): boolean {
  if (!input.signatureHeader || !input.secret) {
    return false
  }

  const signatures: string[] = []
  let timestamp = ''

  for (const part of input.signatureHeader.split(',')) {
    const [key, value] = part.split('=')
    if (!key || !value) {
      continue
    }

    if (key === 't') {
      timestamp = value
    } else if (key === 'v1') {
      signatures.push(value)
    }
  }

  if (!timestamp || signatures.length === 0) {
    return false
  }

  if (!/^\d+$/.test(timestamp)) {
    return false
  }

  const timestampSeconds = Number.parseInt(timestamp, 10)
  if (!Number.isFinite(timestampSeconds)) {
    return false
  }

  const toleranceSeconds = input.toleranceSeconds ?? 5 * 60
  const nowSeconds = Math.floor((input.now ?? Date.now()) / 1000)
  if (Math.abs(nowSeconds - timestampSeconds) > toleranceSeconds) {
    return false
  }

  const signedPayload = `${timestamp}.${input.payload}`
  const expected = createHmac('sha256', input.secret).update(signedPayload).digest('hex')
  const expectedBuffer = Buffer.from(expected, 'hex')

  for (const signature of signatures) {
    const signatureBuffer = Buffer.from(signature, 'hex')
    if (expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer)) {
      return true
    }
  }

  return false
}
