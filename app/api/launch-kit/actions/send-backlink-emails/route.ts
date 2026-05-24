import { NextResponse } from 'next/server'
import { normalizeSeoGrowthState } from '@/lib/launch-kit/normalizers'
import { runSendBacklinkEmailStubAction } from '@/lib/launch-kit/seo'
import type { SeoGrowthState } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      seoGrowth?: Partial<SeoGrowthState>
      prospectIds?: string[]
    }

    const result = runSendBacklinkEmailStubAction({
      seoGrowth: normalizeSeoGrowthState(body.seoGrowth),
      prospectIds: Array.isArray(body.prospectIds) ? body.prospectIds : [],
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Send backlink emails action failed.', error)
    return NextResponse.json({ error: 'Send backlink emails action failed.' }, { status: 500 })
  }
}
