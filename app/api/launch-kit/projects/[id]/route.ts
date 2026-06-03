import {
  launchApiRouteErrorResponse,
  privateJsonResponse,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { deleteLaunchProject, getLaunchProject, LaunchProjectNotFoundError } from '@/lib/launch-kit/projects'

export const runtime = 'nodejs'
export const maxDuration = 30

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const access = await requireLaunchApiAccess(request, {
      action: 'project_read',
      feature: 'free',
      rateLimitAction: 'project_read',
    })
    if (!access.session) {
      return privateJsonResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const project = await getLaunchProject(access.session.user.id, id)
    if (!project) {
      return privateJsonResponse({ error: 'Project not found.' }, { status: 404 })
    }

    await recordLaunchApiUsage(access, 'project_read', { projectId: id })
    return privateJsonResponse({ project })
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Failed to fetch project.',
      'launch_project_fetch_failed',
    )
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const access = await requireLaunchApiAccess(request, {
      action: 'project_delete',
      feature: 'free',
      rateLimitAction: 'project_write',
    })
    if (!access.session) {
      return privateJsonResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await deleteLaunchProject(access.session.user.id, id)
    await recordLaunchApiUsage(access, 'project_delete', { projectId: id })

    return privateJsonResponse({ ok: true })
  } catch (error) {
    if (error instanceof LaunchProjectNotFoundError) {
      return privateJsonResponse({ error: 'Project not found.' }, { status: 404 })
    }

    return launchApiRouteErrorResponse(
      error,
      'Failed to delete project.',
      'launch_project_delete_failed',
    )
  }
}
