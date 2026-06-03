import { ingestProductUrl } from '@/lib/launch-kit/url-extractor'
import {
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readTrustedJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const body = await readTrustedJsonBody(request, { maxBytes: 16 * 1024 })

    if (!body.url || typeof body.url !== 'string') {
      return privateJsonResponse({ error: 'A valid URL is required.' }, { status: 400 })
    }

    const access = await requireLaunchApiAccess(request, {
      action: 'ingest',
      feature: 'free',
      allowAnonymous: true,
    })
    const brief = await ingestProductUrl({
      url: body.url,
      languageOverride: typeof body.languageOverride === 'string' ? body.languageOverride : undefined,
    })
    await recordLaunchApiUsage(access, 'ingest', {
      sourceUrl: brief.sourceUrl,
      productName: brief.productName,
    })

    return privateJsonResponse({ brief })
  } catch (error) {
    return launchApiRouteErrorResponse(
      error,
      'Failed to ingest URL.',
      'launch_kit_ingest_failed',
    )
  }
}
