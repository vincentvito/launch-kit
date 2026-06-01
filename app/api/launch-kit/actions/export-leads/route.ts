import { NextResponse } from 'next/server'
import {
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { exportLeadsCsv } from '@/lib/launch-kit/prospecting'
import type { ProspectingState } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{
      prospecting?: ProspectingState
      projectName?: string
      download?: boolean
    }>(request)

    const access = await requireLaunchApiAccess(request, {
      action: 'export_leads',
      feature: 'premium',
      rateLimitAction: 'export',
    })
    const csv = exportLeadsCsv(body.prospecting)
    const filename = `${slugify(body.projectName || 'launch-kit-leads')}.csv`
    await recordLaunchApiUsage(access, 'export_leads')

    if (body.download === false) {
      return privateJsonResponse({ csv, filename })
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="${filename}"`,
        'cache-control': 'private, no-store',
      },
    })
  } catch (error) {
    return launchApiRouteErrorResponse(error, 'Export leads failed.', 'export_leads_failed')
  }
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'launch-kit'
}
