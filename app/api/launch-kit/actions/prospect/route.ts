import { NextResponse } from 'next/server'
import { runProspectAction } from '@/lib/launch-kit/prospecting'
import { normalizeBrief } from '@/lib/launch-kit/normalizers'
import type { ExtractedBrief, ProspectingState } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      brief?: Partial<ExtractedBrief>
      prospecting?: ProspectingState
    }

    if (!body.brief) {
      return NextResponse.json({ error: 'Brief is required.' }, { status: 400 })
    }

    const brief = normalizeBrief(body.brief)
    const result = await runProspectAction({
      brief,
      prospecting: body.prospecting,
    })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Prospecting action failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
