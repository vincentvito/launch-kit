import { NextResponse } from 'next/server'
import { runImportEmailListAction } from '@/lib/launch-kit/prospecting'
import type { ProspectingState } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      prospecting?: ProspectingState
      rawContacts?: string
    }

    const result = runImportEmailListAction({
      prospecting: body.prospecting,
      rawContacts: body.rawContacts || '',
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Import email list action failed.', error)
    return NextResponse.json({ error: 'Import email list action failed.' }, { status: 500 })
  }
}
