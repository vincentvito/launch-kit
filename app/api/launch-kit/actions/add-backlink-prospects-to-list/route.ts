import {
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { normalizeSeoGrowthState } from '@/lib/launch-kit/normalizers'
import { runAddBacklinkProspectsToListAction } from '@/lib/launch-kit/seo'
import type { SeoGrowthState } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{
      seoGrowth?: Partial<SeoGrowthState>
      prospectIds?: string[]
      listName?: string
    }>(request)

    const access = await requireLaunchApiAccess(request, {
      action: 'add_backlink_prospects_to_list',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const result = runAddBacklinkProspectsToListAction({
      seoGrowth: normalizeSeoGrowthState(body.seoGrowth),
      prospectIds: Array.isArray(body.prospectIds) ? body.prospectIds : [],
      listName: body.listName,
    })
    await recordLaunchApiUsage(access, 'add_backlink_prospects_to_list')

    return privateJsonResponse(result)
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Backlink list action failed.',
      'backlink_list_action_failed',
    )
  }
}
