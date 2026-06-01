import { NextResponse } from 'next/server'
import {
  launchApiRouteErrorResponse,
  readJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { normalizeSeoGrowthState } from '@/lib/launch-kit/normalizers'
import { exportBacklinkProspectsCsv } from '@/lib/launch-kit/seo'
import type { SeoGrowthState } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{
      projectName?: string
      seoGrowth?: Partial<SeoGrowthState>
    }>(request)

    const access = await requireLaunchApiAccess(request, {
      action: 'export_backlinks',
      feature: 'premium',
      rateLimitAction: 'export',
    })
    const csv = exportBacklinkProspectsCsv(normalizeSeoGrowthState(body.seoGrowth))
    const filename = `${slugify(body.projectName || 'launch-kit-backlinks')}-backlinks.csv`
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
