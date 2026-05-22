import { NextResponse } from 'next/server'
import { normalizeKit } from '@/lib/launch-kit/normalizers'
import { runSendOutreachEmailStubAction } from '@/lib/launch-kit/prospecting'
import type { LaunchKit } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      launchKit?: Partial<LaunchKit>
      selectedLeadIds?: string[]
      subject?: string
      body?: string
    }

    if (!body.launchKit) {
      return NextResponse.json({ error: 'launchKit is required.' }, { status: 400 })
    }

    const launchKit = normalizeKit(body.launchKit, body.launchKit.language || 'en')
    const result = runSendOutreachEmailStubAction({
      launchKit,
      selectedLeadIds: Array.isArray(body.selectedLeadIds) ? body.selectedLeadIds : [],
      subject: body.subject,
      body: body.body,
    })

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Send outreach email action failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
