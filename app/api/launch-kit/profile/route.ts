import {
  getJsonObjectField,
  launchApiErrorResponse,
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readTrustedJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { getUserLaunchProfile, upsertUserLaunchProfile } from '@/lib/launch-kit/projects'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(request: Request) {
  try {
    const access = await requireLaunchApiAccess(request, {
      action: 'profile_read',
      feature: 'free',
      rateLimitAction: 'project_read',
    })
    if (!access.session) {
      return privateJsonResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserLaunchProfile(access.session.user.id)
    await recordLaunchApiUsage(access, 'profile_read')
    return privateJsonResponse({ profile })
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Failed to load profile.',
      'launch_profile_load_failed',
    )
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireLaunchApiAccess(request, {
      action: 'profile_write',
      feature: 'free',
      rateLimitAction: 'project_write',
    })
    if (!access.session) {
      return privateJsonResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await readTrustedJsonBody(request, { maxBytes: 64 * 1024 })

    const profile = await upsertUserLaunchProfile(
      access.session.user.id,
      getJsonObjectField(body, 'profile') || {},
    )
    await recordLaunchApiUsage(access, 'profile_save')
    return privateJsonResponse({ profile })
  } catch (error) {
    const guarded = launchApiErrorResponse(error)
    if (guarded.status !== 500) {
      return guarded
    }

    return launchApiRouteErrorResponse(error, 'Failed to save profile.', 'launch_profile_save_failed')
  }
}
