import { NextResponse } from 'next/server'
import {
  launchApiRouteErrorResponse,
  privateJsonResponse,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { renderPressPackHtml } from '@/lib/launch-kit/exporters'
import { getLaunchProject } from '@/lib/launch-kit/projects'

export const runtime = 'nodejs'
export const maxDuration = 60

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const access = await requireLaunchApiAccess(request, {
      action: 'export_press_pack',
      feature: 'free',
      rateLimitAction: 'export',
    })
    if (!access.session) {
      return privateJsonResponse({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const project = await getLaunchProject(access.session.user.id, id)

    if (!project) {
      return privateJsonResponse({ error: 'Project not found.' }, { status: 404 })
    }

    const html = renderPressPackHtml(project)
    const filename = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'launch-kit'}-press-pack.html`
    await recordLaunchApiUsage(access, 'export_press_pack', {
      projectId: project.id,
    })
    return new NextResponse(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'content-disposition': `attachment; filename="${filename}"`,
        'cache-control': 'private, no-store',
      },
    })
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Failed to render press pack.',
      'launch_project_press_pack_failed',
    )
  }
}
