import { NextResponse } from 'next/server'
import { normalizeBrief, normalizeSeoGrowthState } from '@/lib/launch-kit/normalizers'
import { runPersonalizeBacklinkEmailsAction } from '@/lib/launch-kit/seo'
import type { ExtractedBrief, SeoGrowthState } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      brief?: Partial<ExtractedBrief>
      seoGrowth?: Partial<SeoGrowthState>
      prospectIds?: string[]
    }

    if (!body.brief) {
      return NextResponse.json({ error: 'Brief is required.' }, { status: 400 })
    }

    const result = runPersonalizeBacklinkEmailsAction({
      brief: normalizeBrief(body.brief),
      seoGrowth: normalizeSeoGrowthState(body.seoGrowth),
      prospectIds: Array.isArray(body.prospectIds) ? body.prospectIds : [],
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Personalize backlink emails action failed.', error)
    return NextResponse.json({ error: 'Personalize backlink emails action failed.' }, { status: 500 })
  }
}
