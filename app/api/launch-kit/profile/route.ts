import {
  launchApiErrorResponse,
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { requireServerSession } from '@/lib/launch-kit/auth'
import { getUserLaunchProfile, upsertUserLaunchProfile } from '@/lib/launch-kit/projects'
import type { MediaKitContact } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await requireServerSession()
    const profile = await getUserLaunchProfile(session.user.id)
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
    const session = await requireServerSession()
    const body = await readJsonBody<{
      profile?: Partial<MediaKitContact>
    }>(request, { maxBytes: 64 * 1024 })

    const profile = await upsertUserLaunchProfile(session.user.id, body.profile || {})
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
