import { NextResponse } from 'next/server'
import { requireServerSession } from '@/lib/launch-kit/auth'
import { listLaunchProjects, saveLaunchProject } from '@/lib/launch-kit/projects'
import type { ExtractedBrief, LaunchKit } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await requireServerSession()
    const projects = await listLaunchProjects(session.user.id)
    return NextResponse.json({ projects })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to fetch projects.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireServerSession()
    const body = (await request.json()) as {
      projectId?: string
      sourceUrl?: string
      name?: string
      language?: string
      brief?: ExtractedBrief
      kit?: LaunchKit
    }

    if (!body.sourceUrl || !body.brief || !body.kit) {
      return NextResponse.json({ error: 'sourceUrl, brief, and kit are required.' }, { status: 400 })
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

    return NextResponse.json({ project: saved })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const message = error instanceof Error ? error.message : 'Failed to save project.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
