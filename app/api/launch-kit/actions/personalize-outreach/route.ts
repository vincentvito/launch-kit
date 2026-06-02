import {
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { normalizeBrief, normalizeKit } from '@/lib/launch-kit/normalizers'
import { runPersonalizeOutreachAction } from '@/lib/launch-kit/prospecting'
import type { ExtractedBrief, LaunchKit } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{
      brief?: Partial<ExtractedBrief>
      launchKit?: Partial<LaunchKit>
      selectedLeadIds?: string[]
    }>(request)

    if (!body.brief || !body.launchKit) {
      return privateJsonResponse({ error: 'brief and launchKit are required.' }, { status: 400 })
    }

    const brief = normalizeBrief(body.brief)
    const launchKit = normalizeKit(body.launchKit, brief.language || 'en')

    const access = await requireLaunchApiAccess(request, {
      action: 'personalize_outreach',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const result = runPersonalizeOutreachAction({
      brief,
      launchKit,
      selectedLeadIds: Array.isArray(body.selectedLeadIds) ? body.selectedLeadIds : [],
    })
    await recordLaunchApiUsage(access, 'personalize_outreach')

    return privateJsonResponse(result)
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Personalize outreach action failed.',
      'personalize_outreach_action_failed',
    )
  }
}
