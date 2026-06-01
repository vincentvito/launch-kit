import {
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { normalizeBrief, normalizeKit } from '@/lib/launch-kit/normalizers'
import { runFollowUpSequenceAction } from '@/lib/launch-kit/prospecting'
import type { ExtractedBrief, LaunchKit } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{
      brief?: Partial<ExtractedBrief>
      launchKit?: Partial<LaunchKit>
    }>(request)

    if (!body.brief || !body.launchKit) {
      return privateJsonResponse({ error: 'brief and launchKit are required.' }, { status: 400 })
    }

    const brief = normalizeBrief(body.brief)
    const launchKit = normalizeKit(body.launchKit, brief.language || 'en')

    const access = await requireLaunchApiAccess(request, {
      action: 'followup_sequences',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const result = runFollowUpSequenceAction({
      brief,
      launchKit,
    })
    await recordLaunchApiUsage(access, 'followup_sequences')

    return privateJsonResponse(result)
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Follow-up sequence action failed.',
      'followup_sequence_action_failed',
    )
  }
}
