import { dispatchEmailDelivery, isEmailDeliveryConfigured } from '@/lib/email-delivery'
import {
  getJsonObjectField,
  getJsonStringArrayField,
  getJsonStringField,
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readTrustedJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { normalizeKit } from '@/lib/launch-kit/normalizers'
import {
  buildLeadOutreachDeliveryPayload,
  runSendOutreachEmailAction,
} from '@/lib/launch-kit/prospecting'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await readTrustedJsonBody(request)
    const launchKitInput = getJsonObjectField(body, 'launchKit')

    if (!launchKitInput) {
      return privateJsonResponse({ error: 'launchKit is required.' }, { status: 400 })
    }

    const launchKit = normalizeKit(
      launchKitInput,
      typeof launchKitInput.language === 'string' ? launchKitInput.language : 'en',
    )
    const access = await requireLaunchApiAccess(request, {
      action: 'send_outreach_email',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const input = {
      launchKit,
      selectedLeadIds: getJsonStringArrayField(body, 'selectedLeadIds', { maxLength: 128 }),
      subject: getJsonStringField(body, 'subject', { maxLength: 240 }),
      body: getJsonStringField(body, 'body', { maxLength: 8000, trim: false }),
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
