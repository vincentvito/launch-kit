import {
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { runImportEmailListAction } from '@/lib/launch-kit/prospecting'
import type { ProspectingState } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{
      prospecting?: ProspectingState
      rawContacts?: string
    }>(request)

    const access = await requireLaunchApiAccess(request, {
      action: 'import_email_list',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const result = runImportEmailListAction({
      prospecting: body.prospecting,
      rawContacts: body.rawContacts || '',
    })
    await recordLaunchApiUsage(access, 'import_email_list')

    return privateJsonResponse(result)
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Import email list action failed.',
      'import_email_list_action_failed',
    )
  }
}
