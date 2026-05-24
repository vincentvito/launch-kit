import { NextResponse } from 'next/server'
import { normalizeSeoGrowthState } from '@/lib/launch-kit/normalizers'
import { runUpdateBacklinkProspectStatusAction } from '@/lib/launch-kit/seo'
import type { SeoGrowthState } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      seoGrowth?: Partial<SeoGrowthState>
      prospectId?: string
      status?: string
    }

    const result = runUpdateBacklinkProspectStatusAction({
      seoGrowth: normalizeSeoGrowthState(body.seoGrowth),
      prospectId: body.prospectId,
      status: body.status,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Backlink status action failed.', error)
    return NextResponse.json({ error: 'Backlink status action failed.' }, { status: 500 })
  }
}
