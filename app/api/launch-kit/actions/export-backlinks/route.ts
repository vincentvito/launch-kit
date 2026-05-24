import { NextResponse } from 'next/server'
import { normalizeSeoGrowthState } from '@/lib/launch-kit/normalizers'
import { exportBacklinkProspectsCsv } from '@/lib/launch-kit/seo'
import type { SeoGrowthState } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      projectName?: string
      seoGrowth?: Partial<SeoGrowthState>
    }

    const csv = exportBacklinkProspectsCsv(normalizeSeoGrowthState(body.seoGrowth))
    const filename = `${slugify(body.projectName || 'launch-kit-backlinks')}-backlinks.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv;charset=utf-8',
        'content-disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Export backlinks action failed.', error)
    return NextResponse.json({ error: 'Export backlinks action failed.' }, { status: 500 })
  }
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'launch-kit'
}
