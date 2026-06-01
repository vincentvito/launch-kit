type DeliveryResult = {
  configured: boolean
  delivered: boolean
}

export function isEmailDeliveryConfigured(): boolean {
  return Boolean(process.env.OUTREACH_EMAIL_WEBHOOK_URL)
}

export async function dispatchEmailDelivery(input: {
  kind: 'lead_outreach' | 'backlink_outreach'
  payload: unknown
}): Promise<DeliveryResult> {
  const endpoint = process.env.OUTREACH_EMAIL_WEBHOOK_URL
  if (!endpoint) {
    return {
      configured: false,
      delivered: false,
    }
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(process.env.OUTREACH_EMAIL_WEBHOOK_TOKEN
        ? { authorization: `Bearer ${process.env.OUTREACH_EMAIL_WEBHOOK_TOKEN}` }
        : {}),
    },
    body: JSON.stringify({
      kind: input.kind,
      payload: input.payload,
    }),
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    throw new Error(`Email delivery webhook failed with ${response.status}`)
  }

  return {
    configured: true,
    delivered: true,
  }
}
