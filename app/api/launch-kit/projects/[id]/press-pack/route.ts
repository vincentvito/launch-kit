import { NextResponse } from 'next/server'
import {
  launchApiRouteErrorResponse,
  privateJsonResponse,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { requireServerSession } from '@/lib/launch-kit/auth'
import { renderPressPackHtml } from '@/lib/launch-kit/exporters'
import { getLaunchProject } from '@/lib/launch-kit/projects'

export const runtime = 'nodejs'

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
    const { id } = await params
    const session = await requireServerSession()
    const project = await getLaunchProject(session.user.id, id)

    if (!project) {
      return privateJsonResponse({ error: 'Project not found.' }, { status: 404 })
    }

    const html = renderPressPackHtml(project)
    await recordLaunchApiUsage(access, 'export_press_pack', {
      projectId: project.id,
    })
    return new NextResponse(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
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
