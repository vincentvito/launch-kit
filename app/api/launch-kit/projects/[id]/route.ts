import { NextResponse } from 'next/server'
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
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to fetch project.' }, { status: 500 })
  }
}
