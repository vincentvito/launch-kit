import { NextResponse } from 'next/server'
import { requireServerSession } from '@/lib/launch-kit/auth'
import { getUserLaunchProfile, upsertUserLaunchProfile } from '@/lib/launch-kit/projects'
import type { MediaKitContact } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await requireServerSession()
    const profile = await getUserLaunchProfile(session.user.id)
    return NextResponse.json({ profile })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Failed to load profile.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireServerSession()
    const body = (await request.json()) as {
      profile?: Partial<MediaKitContact>
    }

    const profile = await upsertUserLaunchProfile(session.user.id, body.profile || {})
    return NextResponse.json({ profile })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const message = error instanceof Error ? error.message : 'Failed to save profile.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
