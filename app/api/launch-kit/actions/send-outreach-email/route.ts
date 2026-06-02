import { dispatchEmailDelivery, isEmailDeliveryConfigured } from '@/lib/email-delivery'
import {
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { normalizeKit } from '@/lib/launch-kit/normalizers'
import {
  buildLeadOutreachDeliveryPayload,
  runSendOutreachEmailAction,
} from '@/lib/launch-kit/prospecting'
import type { LaunchKit } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{
      launchKit?: Partial<LaunchKit>
      selectedLeadIds?: string[]
      subject?: string
      body?: string
    }>(request)

    if (!body.launchKit) {
      return privateJsonResponse({ error: 'launchKit is required.' }, { status: 400 })
    }

    const launchKit = normalizeKit(body.launchKit, body.launchKit.language || 'en')
    const access = await requireLaunchApiAccess(request, {
      action: 'send_outreach_email',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const input = {
      launchKit,
      selectedLeadIds: Array.isArray(body.selectedLeadIds) ? body.selectedLeadIds : [],
      subject: body.subject,
      body: body.body,
    }
    const deliveryPayload = buildLeadOutreachDeliveryPayload(input)
    const delivery = deliveryPayload.leads.length > 0
      ? await dispatchEmailDelivery({
          kind: 'lead_outreach',
          payload: deliveryPayload,
        })
      : { configured: isEmailDeliveryConfigured(), delivered: false }
    const result = runSendOutreachEmailAction({ ...input, delivery })
    await recordLaunchApiUsage(access, 'send_outreach_email')

    return privateJsonResponse(result)
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Send outreach email action failed.',
      'send_outreach_email_action_failed',
    )
  }
}
