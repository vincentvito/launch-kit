import prisma from '@/lib/prisma'
import { getAppUrl } from '@/lib/env'

type StripeEvent = {
  type: string
  data?: {
    object?: Record<string, unknown>
  }
}

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
  })

  if (!response.ok) {
    throw new Error(`Stripe checkout failed with ${response.status}`)
  }

  const json = (await response.json()) as { url?: string }
  if (!json.url) {
    throw new Error('Stripe checkout did not return a URL.')
  }

  return { url: json.url }
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
  })

  if (!response.ok) {
    throw new Error(`Stripe portal failed with ${response.status}`)
  }

  const json = (await response.json()) as { url?: string }
  if (!json.url) {
    throw new Error('Stripe portal did not return a URL.')
  }

  return { url: json.url }
}

export async function applyStripeEvent(event: StripeEvent): Promise<void> {
  const object = event.data?.object || {}

  if (event.type === 'checkout.session.completed') {
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

  if (event.type.startsWith('customer.subscription.')) {
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

function getUnixDate(value: unknown): Date | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  return new Date(value * 1000)
}
