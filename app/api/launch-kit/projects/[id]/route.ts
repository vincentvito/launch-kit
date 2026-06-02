import { launchApiRouteErrorResponse, privateJsonResponse } from '@/lib/launch-kit/api-guard'
import { requireServerSession } from '@/lib/launch-kit/auth'
import { getLaunchProject } from '@/lib/launch-kit/projects'

export const runtime = 'nodejs'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await requireServerSession()

    const project = await getLaunchProject(session.user.id, id)
    if (!project) {
      return privateJsonResponse({ error: 'Project not found.' }, { status: 404 })
    }

    return privateJsonResponse({ project })
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Failed to fetch project.',
      'launch_project_fetch_failed',
    )
  }
}
