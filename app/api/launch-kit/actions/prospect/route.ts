import { runProspectAction } from '@/lib/launch-kit/prospecting'
import {
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { normalizeBrief } from '@/lib/launch-kit/normalizers'
import type { ExtractedBrief, ProspectingState } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{
      brief?: Partial<ExtractedBrief>
      prospecting?: ProspectingState
    }>(request)

    if (!body.brief) {
      return privateJsonResponse({ error: 'Brief is required.' }, { status: 400 })
    }

    const access = await requireLaunchApiAccess(request, {
      action: 'prospect',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const brief = normalizeBrief(body.brief)
    const result = await runProspectAction({
      brief,
      prospecting: body.prospecting,
    })
    await recordLaunchApiUsage(access, 'prospect', {
      productName: brief.productName,
    })

    return privateJsonResponse(result)
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Prospecting action failed.',
      'prospecting_action_failed',
    )
  }
}
