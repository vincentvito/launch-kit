import { ingestProductUrl } from '@/lib/launch-kit/url-extractor'
import {
  LaunchApiError,
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{
      url?: string
      languageOverride?: string
    }>(request, { maxBytes: 16 * 1024 })

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
    const publicError = toPublicIngestError(error)

    return launchApiRouteErrorResponse(
      publicError || error,
      'Failed to ingest URL.',
      'launch_kit_ingest_failed',
    )
  }
}

function toPublicIngestError(error: unknown): LaunchApiError | null {
  if (!(error instanceof Error)) {
    return null
  }

  if (
    error.message === 'URL is required' ||
    error.message === 'Invalid URL' ||
    error.message === 'Only HTTP(S) URLs are supported'
  ) {
    return new LaunchApiError(400, 'invalid_url', 'Enter a valid public URL.')
  }

  if (error.message === 'Could not resolve URL host') {
    return new LaunchApiError(400, 'invalid_url', 'We could not resolve that URL.')
  }

  if (error.message === 'Refusing to fetch a private or internal address') {
    return new LaunchApiError(400, 'private_url', 'Enter a public website URL.')
  }

  if (error.message === 'Could not extract any content from URL') {
    return new LaunchApiError(422, 'empty_extraction', 'We could not extract readable content from that page.')
  }

  if (error.message === 'Fetched HTML is too large') {
    return new LaunchApiError(413, 'url_too_large', 'That page is too large to extract.')
  }

  return null
}
