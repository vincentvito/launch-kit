import {
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { normalizeSeoGrowthState } from '@/lib/launch-kit/normalizers'
import { runUpdateBacklinkProspectStatusAction } from '@/lib/launch-kit/seo'
import type { SeoGrowthState } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{
      seoGrowth?: Partial<SeoGrowthState>
      prospectId?: string
      status?: string
    }>(request)

    const access = await requireLaunchApiAccess(request, {
      action: 'update_backlink_prospect_status',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const result = runUpdateBacklinkProspectStatusAction({
      seoGrowth: normalizeSeoGrowthState(body.seoGrowth),
      prospectId: body.prospectId,
      status: body.status,
    })
    await recordLaunchApiUsage(access, 'update_backlink_prospect_status')

    return privateJsonResponse(result)
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Backlink status action failed.',
      'backlink_status_action_failed',
    )
  }
}
