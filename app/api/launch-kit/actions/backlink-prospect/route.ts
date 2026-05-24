import { NextResponse } from 'next/server'
import { normalizeBrief, normalizeSeoGrowthState } from '@/lib/launch-kit/normalizers'
import { runBacklinkProspectAction } from '@/lib/launch-kit/seo'
import type { ExtractedBrief, SeoGrowthState } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      brief?: Partial<ExtractedBrief>
      seoGrowth?: Partial<SeoGrowthState>
    }

    if (!body.brief) {
      return NextResponse.json({ error: 'Brief is required.' }, { status: 400 })
    }

    const result = await runBacklinkProspectAction({
      brief: normalizeBrief(body.brief),
      seoGrowth: normalizeSeoGrowthState(body.seoGrowth),
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Backlink prospect action failed.', error)
    return NextResponse.json({ error: 'Backlink prospect action failed.' }, { status: 500 })
  }
}
