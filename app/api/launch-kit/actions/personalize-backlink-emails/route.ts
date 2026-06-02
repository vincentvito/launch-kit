import {
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { normalizeBrief, normalizeSeoGrowthState } from '@/lib/launch-kit/normalizers'
import { runPersonalizeBacklinkEmailsAction } from '@/lib/launch-kit/seo'
import type { ExtractedBrief, SeoGrowthState } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{
      brief?: Partial<ExtractedBrief>
      seoGrowth?: Partial<SeoGrowthState>
      prospectIds?: string[]
    }>(request)

    if (!body.brief) {
      return privateJsonResponse({ error: 'Brief is required.' }, { status: 400 })
    }

    const access = await requireLaunchApiAccess(request, {
      action: 'personalize_backlink_emails',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const result = runPersonalizeBacklinkEmailsAction({
      brief: normalizeBrief(body.brief),
      seoGrowth: normalizeSeoGrowthState(body.seoGrowth),
      prospectIds: Array.isArray(body.prospectIds) ? body.prospectIds : [],
    })
    await recordLaunchApiUsage(access, 'personalize_backlink_emails')

    return privateJsonResponse(result)
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Personalize backlink emails action failed.',
      'personalize_backlink_emails_action_failed',
    )
  }
}
