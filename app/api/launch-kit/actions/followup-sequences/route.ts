import { NextResponse } from 'next/server'
import { normalizeBrief, normalizeKit } from '@/lib/launch-kit/normalizers'
import { runFollowUpSequenceAction } from '@/lib/launch-kit/prospecting'
import type { ExtractedBrief, LaunchKit } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      brief?: Partial<ExtractedBrief>
      launchKit?: Partial<LaunchKit>
    }

    if (!body.brief || !body.launchKit) {
      return NextResponse.json({ error: 'brief and launchKit are required.' }, { status: 400 })
    }

    const brief = normalizeBrief(body.brief)
    const launchKit = normalizeKit(body.launchKit, brief.language || 'en')

    const result = runFollowUpSequenceAction({
      brief,
      launchKit,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Follow-up sequence action failed.', error)
    return NextResponse.json({ error: 'Follow-up sequence action failed.' }, { status: 500 })
  }
}
