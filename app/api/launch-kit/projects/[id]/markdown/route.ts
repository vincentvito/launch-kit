import { NextResponse } from 'next/server'
import {
  launchApiRouteErrorResponse,
  privateJsonResponse,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { requireServerSession } from '@/lib/launch-kit/auth'
import { renderLaunchKitMarkdown } from '@/lib/launch-kit/exporters'
import { getLaunchProject } from '@/lib/launch-kit/projects'

export const runtime = 'nodejs'

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const access = await requireLaunchApiAccess(request, {
      action: 'export_markdown',
      feature: 'free',
      rateLimitAction: 'export',
    })
    const { id } = await params
    const session = await requireServerSession()
    const project = await getLaunchProject(session.user.id, id)

    if (!project) {
      return privateJsonResponse({ error: 'Project not found.' }, { status: 404 })
    }

    const markdown = renderLaunchKitMarkdown(project)
    await recordLaunchApiUsage(access, 'export_markdown', {
      projectId: project.id,
    })
    return new NextResponse(markdown, {
      status: 200,
      headers: {
        'content-type': 'text/markdown; charset=utf-8',
        'content-disposition': `attachment; filename="${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'launch-kit'}.md"`,
        'cache-control': 'private, no-store',
      },
    })
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Failed to export markdown.',
      'launch_project_markdown_export_failed',
    )
  }
}
