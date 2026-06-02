import { applyStripeEvent } from '@/lib/billing'
import {
  internalServerErrorResponse,
  launchApiErrorResponse,
  privateJsonResponse,
  readTextBody,
} from '@/lib/launch-kit/api-guard'
import { verifyStripeWebhookSignature } from '@/lib/stripe-webhook'

export const runtime = 'nodejs'
const MAX_STRIPE_WEBHOOK_BYTES = 256 * 1024

export async function POST(request: Request) {
  let payload: string

  try {
    payload = await readTextBody(request, { maxBytes: MAX_STRIPE_WEBHOOK_BYTES })
  } catch (error) {
    return launchApiErrorResponse(error)
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET || ''
  const verified = verifyStripeWebhookSignature({
    payload,
    signatureHeader: request.headers.get('stripe-signature'),
    secret,
  })

  if (!verified) {
    return privateJsonResponse({ error: 'Invalid webhook signature.' }, { status: 400 })
  }

  let event: Parameters<typeof applyStripeEvent>[0]

  try {
    event = JSON.parse(payload) as Parameters<typeof applyStripeEvent>[0]
  } catch {
    return privateJsonResponse({ error: 'Invalid webhook payload.' }, { status: 400 })
  }

  try {
    await applyStripeEvent(event)
    return privateJsonResponse({ received: true })
  } catch (error) {
    return internalServerErrorResponse(error, 'Webhook failed.', 'stripe_webhook_failed')
  }
}
