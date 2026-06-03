import {
  getJsonObjectField,
  getJsonStringField,
  launchApiErrorResponse,
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readTrustedJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import {
  InvalidLaunchProjectInputError,
  LaunchProjectNotFoundError,
  listLaunchProjects,
  saveLaunchProject,
} from '@/lib/launch-kit/projects'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(request: Request) {
  try {
    const access = await requireLaunchApiAccess(request, {
      action: 'project_read',
      feature: 'free',
      rateLimitAction: 'project_read',
    })
    if (!access.session) {
      return privateJsonResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    const projects = await listLaunchProjects(access.session.user.id)
    await recordLaunchApiUsage(access, 'project_list')
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
    if (!access.session) {
      return privateJsonResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await readTrustedJsonBody(request, { maxBytes: 2 * 1024 * 1024 })
    const sourceUrl = getJsonStringField(body, 'sourceUrl', { maxLength: 800 })
    const brief = getJsonObjectField(body, 'brief')
    const kit = getJsonObjectField(body, 'kit')

    if (!sourceUrl || !brief || !kit) {
      return privateJsonResponse(
        { error: 'sourceUrl, brief, and kit are required.' },
        { status: 400 },
      )
    }

    const name =
      getJsonStringField(body, 'name', { maxLength: 160 }) ||
      (typeof brief.productName === 'string' ? brief.productName : '') ||
      'Untitled project'
    const language =
      getJsonStringField(body, 'language', { maxLength: 16 }) ||
      (typeof brief.language === 'string' ? brief.language : '') ||
      'en'

    const saved = await saveLaunchProject({
      projectId: getJsonStringField(body, 'projectId', { maxLength: 128 }),
      userId: access.session.user.id,
      sourceUrl,
      name,
      language,
      brief,
      kit,
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
