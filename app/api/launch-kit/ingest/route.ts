import { NextResponse } from 'next/server'
import { ingestProductUrl } from '@/lib/launch-kit/url-extractor'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      url?: string
      languageOverride?: string
    }

    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json({ error: 'A valid URL is required.' }, { status: 400 })
    }

    const brief = await ingestProductUrl({
      url: body.url,
      languageOverride: typeof body.languageOverride === 'string' ? body.languageOverride : undefined,
    })

    return NextResponse.json({ brief })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Failed to ingest URL.', error)
    return NextResponse.json({ error: 'Failed to ingest URL.' }, { status: 500 })
  }
}
