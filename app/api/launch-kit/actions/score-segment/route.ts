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
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Score and segment action failed.', error)
    return NextResponse.json({ error: 'Score and segment action failed.' }, { status: 500 })
  }
}
