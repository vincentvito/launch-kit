import {
  getJsonObjectField,
  getJsonStringField,
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readTrustedJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { runImportEmailListAction } from '@/lib/launch-kit/prospecting'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await readTrustedJsonBody(request)

    const access = await requireLaunchApiAccess(request, {
      action: 'import_email_list',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const result = runImportEmailListAction({
      prospecting: getJsonObjectField(body, 'prospecting') || undefined,
      rawContacts: getJsonStringField(body, 'rawContacts', { trim: false }),
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
