import { NextResponse } from 'next/server'
import {
  getJsonObjectField,
  getJsonStringField,
  launchApiRouteErrorResponse,
  readTrustedJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { normalizeSeoGrowthState } from '@/lib/launch-kit/normalizers'
import { exportBacklinkProspectsCsv } from '@/lib/launch-kit/seo'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await readTrustedJsonBody(request)

    const access = await requireLaunchApiAccess(request, {
      action: 'export_backlinks',
      feature: 'premium',
      rateLimitAction: 'export',
    })
    const csv = exportBacklinkProspectsCsv(
      normalizeSeoGrowthState(getJsonObjectField(body, 'seoGrowth')),
    )
    const filename = `${slugify(getJsonStringField(body, 'projectName') || 'launch-kit-backlinks')}-backlinks.csv`
    await recordLaunchApiUsage(access, 'export_backlinks')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv;charset=utf-8',
        'content-disposition': `attachment; filename="${filename}"`,
        'cache-control': 'private, no-store',
      },
    })
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Export backlinks action failed.',
      'export_backlinks_action_failed',
    )
  }
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'launch-kit'
}
