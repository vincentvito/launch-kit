import { NextResponse } from 'next/server'
import { normalizeBrief, normalizeKit } from '@/lib/launch-kit/normalizers'
import { runPersonalizeOutreachAction } from '@/lib/launch-kit/prospecting'
import type { ExtractedBrief, LaunchKit } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      brief?: Partial<ExtractedBrief>
      launchKit?: Partial<LaunchKit>
      selectedLeadIds?: string[]
    }

    if (!body.brief || !body.launchKit) {
      return NextResponse.json({ error: 'brief and launchKit are required.' }, { status: 400 })
    }

    const brief = normalizeBrief(body.brief)
    const launchKit = normalizeKit(body.launchKit, brief.language || 'en')

    const result = runPersonalizeOutreachAction({
      brief,
      launchKit,
      selectedLeadIds: Array.isArray(body.selectedLeadIds) ? body.selectedLeadIds : [],
    })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Personalize outreach action failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
