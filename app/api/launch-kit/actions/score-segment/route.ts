import { NextResponse } from 'next/server'
import { runScoreSegmentAction } from '@/lib/launch-kit/prospecting'
import type { ProspectingState } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      prospecting?: ProspectingState
    }

    const result = runScoreSegmentAction({
      prospecting: body.prospecting,
    })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Score and segment action failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
