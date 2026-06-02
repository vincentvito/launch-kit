import { dispatchEmailDelivery, isEmailDeliveryConfigured } from '@/lib/email-delivery'
import {
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { normalizeSeoGrowthState } from '@/lib/launch-kit/normalizers'
import {
  buildBacklinkOutreachDeliveryPayload,
  runSendBacklinkEmailAction,
} from '@/lib/launch-kit/seo'
import type { SeoGrowthState } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{
      seoGrowth?: Partial<SeoGrowthState>
      prospectIds?: string[]
    }>(request)

    const access = await requireLaunchApiAccess(request, {
      action: 'send_backlink_emails',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const input = {
      seoGrowth: normalizeSeoGrowthState(body.seoGrowth),
      prospectIds: Array.isArray(body.prospectIds) ? body.prospectIds : [],
    }
    const deliveryPayload = buildBacklinkOutreachDeliveryPayload(input)
    const delivery = deliveryPayload.prospects.length > 0
      ? await dispatchEmailDelivery({
          kind: 'backlink_outreach',
          payload: deliveryPayload,
        })
      : { configured: isEmailDeliveryConfigured(), delivered: false }
    const result = runSendBacklinkEmailAction({ ...input, delivery })
    await recordLaunchApiUsage(access, 'send_backlink_emails')

    return privateJsonResponse(result)
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Send backlink emails action failed.',
      'send_backlink_emails_action_failed',
    )
  }
}
