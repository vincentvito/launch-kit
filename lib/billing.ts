import prisma from '@/lib/prisma'
import { getAppUrl } from '@/lib/env'

export type StripeEvent = {
  type: string
  data?: {
    object?: Record<string, unknown>
  }
}

export class InvalidStripeEventError extends Error {
  constructor() {
    super('Invalid Stripe event.')
    this.name = 'InvalidStripeEventError'
  }
}

const STRIPE_REQUEST_TIMEOUT_MS = 15000

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID)
}

export function isManualBillingConfigured(): boolean {
  return process.env.BILLING_PROVIDER === 'manual'
}

export async function createCheckoutSession(input: {
  userId: string
  email?: string | null
}): Promise<{ url: string }> {
  if (isManualBillingConfigured()) {
    return { url: `${getAppUrl()}/pricing?billing=manual` }
  }

  if (!isStripeConfigured()) {
    throw new Error('Billing is not configured.')
  }

  const form = new URLSearchParams({
    mode: 'subscription',
    success_url: `${getAppUrl()}/dashboard?checkout=success`,
    cancel_url: `${getAppUrl()}/pricing?checkout=cancelled`,
    client_reference_id: input.userId,
    'line_items[0][price]': process.env.STRIPE_PRICE_ID!,
    'line_items[0][quantity]': '1',
    'metadata[userId]': input.userId,
    'subscription_data[metadata][userId]': input.userId,
  })

  if (input.email) {
    form.set('customer_email', input.email)
  }

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: form,
    signal: AbortSignal.timeout(STRIPE_REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`Stripe checkout failed with ${response.status}`)
  }

  return { url: await readStripeRedirectUrl(response, 'checkout') }
}

export async function createBillingPortalSession(input: {
  userId: string
}): Promise<{ url: string }> {
  const plan = await prisma.userPlan.findUnique({
    where: { userId: input.userId },
  })

  if (plan?.provider === 'manual') {
    return { url: `${getAppUrl()}/pricing?billing=manual` }
  }

  if (!process.env.STRIPE_SECRET_KEY || !plan?.providerCustomerId) {
    throw new Error('No billing customer is available.')
  }

  const form = new URLSearchParams({
    customer: plan.providerCustomerId,
    return_url: `${getAppUrl()}/dashboard`,
  })

  const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: form,
    signal: AbortSignal.timeout(STRIPE_REQUEST_TIMEOUT_MS),
  })

  if (!response.ok) {
    throw new Error(`Stripe portal failed with ${response.status}`)
  }

  return { url: await readStripeRedirectUrl(response, 'portal') }
}

export async function applyStripeEvent(event: unknown): Promise<void> {
  const stripeEvent = normalizeStripeEvent(event)
  const object = stripeEvent.data?.object || {}

  if (stripeEvent.type === 'checkout.session.completed') {
    const userId = getString(object.client_reference_id) || getMetadataValue(object, 'userId')
    if (!userId) {
      return
    }

    await prisma.userPlan.upsert({
      where: { userId },
      create: {
        userId,
        plan: 'premium',
        status: 'active',
        provider: 'stripe',
        providerCustomerId: getString(object.customer),
        providerSubscriptionId: getString(object.subscription),
      },
      update: {
        plan: 'premium',
        status: 'active',
        provider: 'stripe',
        providerCustomerId: getString(object.customer),
        providerSubscriptionId: getString(object.subscription),
      },
    })
    return
  }

  if (stripeEvent.type.startsWith('customer.subscription.')) {
    const subscriptionId = getString(object.id)
    const customerId = getString(object.customer)
    const status = normalizeStripeStatus(getString(object.status))
    const currentPeriodEnd = getUnixDate(object.current_period_end)
    const lookupFilters = [
      subscriptionId ? { providerSubscriptionId: subscriptionId } : null,
      customerId ? { providerCustomerId: customerId } : null,
    ].filter((filter): filter is { providerSubscriptionId: string } | { providerCustomerId: string } =>
      Boolean(filter),
    )

    if (lookupFilters.length === 0) {
      return
    }

    await prisma.userPlan.updateMany({
      where: {
        OR: lookupFilters,
      },
      data: {
        plan: status === 'active' || status === 'trialing' ? 'premium' : 'free',
        status,
        currentPeriodEnd,
        ...(subscriptionId ? { providerSubscriptionId: subscriptionId } : {}),
        ...(customerId ? { providerCustomerId: customerId } : {}),
      },
    })
  }
}

export function parseStripeEventPayload(payload: string): StripeEvent {
  try {
    return normalizeStripeEvent(JSON.parse(payload))
  } catch (error) {
    if (error instanceof InvalidStripeEventError) {
      throw error
    }
    throw new InvalidStripeEventError()
  }
}

function normalizeStripeEvent(value: unknown): StripeEvent {
  if (!isRecord(value) || typeof value.type !== 'string' || !value.type.trim()) {
    throw new InvalidStripeEventError()
  }

  const event: StripeEvent = {
    type: value.type.trim(),
  }
  const data = value.data
  if (isRecord(data)) {
    const object = data.object
    event.data = {
      object: isRecord(object) ? object : {},
    }
  }

  return event
}

async function readStripeRedirectUrl(
  response: Response,
  context: 'checkout' | 'portal',
): Promise<string> {
  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error(`Stripe ${context} returned invalid JSON.`)
  }

  const url = isRecord(payload) && typeof payload.url === 'string' ? payload.url.trim() : ''
  if (!isStripeHostedRedirectUrl(url)) {
    throw new Error(`Stripe ${context} did not return a valid hosted URL.`)
  }

  return url
}

function isStripeHostedRedirectUrl(value: string): boolean {
  try {
    const url = new URL(value)
    const hostname = url.hostname.toLowerCase()
    return url.protocol === 'https:' && (hostname === 'stripe.com' || hostname.endsWith('.stripe.com'))
  } catch {
    return false
  }
}

function normalizeStripeStatus(status: string): string {
  if (status === 'active' || status === 'trialing') {
    return status
  }
  if (status === 'past_due') {
    return 'past_due'
  }
  return 'canceled'
}

function getString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function getMetadataValue(object: Record<string, unknown>, key: string): string {
  const metadata = object.metadata
  if (!metadata || typeof metadata !== 'object') {
    return ''
  }

  const value = (metadata as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : ''
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getUnixDate(value: unknown): Date | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  return new Date(value * 1000)
}
