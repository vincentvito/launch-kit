import {
  launchApiErrorResponse,
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { requireServerSession } from '@/lib/launch-kit/auth'
import {
  InvalidLaunchProjectInputError,
  LaunchProjectNotFoundError,
  listLaunchProjects,
  saveLaunchProject,
} from '@/lib/launch-kit/projects'
import type { ExtractedBrief, LaunchKit } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await requireServerSession()
    const projects = await listLaunchProjects(session.user.id)
    return privateJsonResponse({ projects })
  } catch (error) {
    return launchApiRouteErrorResponse(error, 'Failed to fetch projects.', 'launch_projects_fetch_failed')
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireLaunchApiAccess(request, {
      action: 'project_write',
      feature: 'free',
      rateLimitAction: 'project_write',
    })
    const session = await requireServerSession()
    const body = await readJsonBody<{
      projectId?: string
      sourceUrl?: string
      name?: string
      language?: string
      brief?: ExtractedBrief
      kit?: LaunchKit
    }>(request, { maxBytes: 2 * 1024 * 1024 })

    if (!body.sourceUrl || !body.brief || !body.kit) {
      return privateJsonResponse(
        { error: 'sourceUrl, brief, and kit are required.' },
        { status: 400 },
      )
    }

    const saved = await saveLaunchProject({
      projectId: body.projectId,
      userId: session.user.id,
      sourceUrl: body.sourceUrl,
      name: body.name?.trim() || body.brief.productName || 'Untitled project',
      language: body.language?.trim() || body.brief.language || 'en',
      brief: body.brief,
      kit: body.kit,
    })
    await recordLaunchApiUsage(access, 'project_save', {
      projectId: saved.id,
      sourceUrl: saved.sourceUrl,
    })

    return privateJsonResponse({ project: saved })
  } catch (error) {
    const guarded = launchApiErrorResponse(error)
    if (guarded.status !== 500) {
      return guarded
    }

    if (error instanceof LaunchProjectNotFoundError) {
      return privateJsonResponse({ error: 'Project not found.' }, { status: 404 })
    }

    if (error instanceof InvalidLaunchProjectInputError) {
      return privateJsonResponse({ error: error.message }, { status: 400 })
    }

    return launchApiRouteErrorResponse(error, 'Failed to save project.', 'launch_project_save_failed')
  }
}
