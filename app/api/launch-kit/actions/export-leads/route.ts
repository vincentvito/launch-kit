import { NextResponse } from 'next/server'
import { exportLeadsCsv } from '@/lib/launch-kit/prospecting'
import type { ProspectingState } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      prospecting?: ProspectingState
      projectName?: string
      download?: boolean
    }

    const csv = exportLeadsCsv(body.prospecting)
    const filename = `${slugify(body.projectName || 'launch-kit-leads')}.csv`

    if (body.download === false) {
      return NextResponse.json({ csv, filename })
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Export leads failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'launch-kit'
}
