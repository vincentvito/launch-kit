import { NextResponse } from 'next/server'
import { getReadinessPayload } from '@/lib/health'

export const runtime = 'nodejs'
export const maxDuration = 10

export async function GET() {
  const payload = await getReadinessPayload()

  return NextResponse.json(payload, {
    status: payload.ok ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
