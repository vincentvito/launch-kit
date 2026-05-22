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
    const message = error instanceof Error ? error.message : 'Follow-up sequence action failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
