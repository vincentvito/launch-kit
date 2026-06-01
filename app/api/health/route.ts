import { NextResponse } from 'next/server'
import { getHealthPayload } from '@/lib/health'

export const runtime = 'nodejs'

export function GET() {
  return NextResponse.json(getHealthPayload(), {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
