import { NextResponse } from 'next/server'
import {
  getJsonObjectField,
  getJsonStringField,
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readTrustedJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { exportLeadsCsv } from '@/lib/launch-kit/prospecting'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await readTrustedJsonBody(request)

    const access = await requireLaunchApiAccess(request, {
      action: 'export_leads',
      feature: 'premium',
      rateLimitAction: 'export',
    })
    const csv = exportLeadsCsv(getJsonObjectField(body, 'prospecting'))
    const filename = `${slugify(getJsonStringField(body, 'projectName') || 'launch-kit-leads')}.csv`
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
