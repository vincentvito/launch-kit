import { generateLaunchAsset } from '@/lib/launch-kit/assets'
import {
  getJsonObjectField,
  getJsonStringField,
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readTrustedJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { completeLaunchJob, createLaunchJob } from '@/lib/launch-kit/jobs'
import { normalizeBrief, normalizeKit } from '@/lib/launch-kit/normalizers'
import type { LaunchAssetFormat } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'
export const maxDuration = 60

const LAUNCH_ASSET_FORMATS = new Set(['16:9', '9:16', '1:1', '4:5', '1.91:1', 'text'])

export async function POST(request: Request) {
  let jobId: string | undefined

  try {
    const body = await readTrustedJsonBody(request, { maxBytes: 2 * 1024 * 1024 })
    const requestedBrief = getJsonObjectField(body, 'brief')
    const templateId = getJsonStringField(body, 'templateId', { maxLength: 160 })
    const format = getJsonStringField(body, 'format', { maxLength: 20 })

    if (!requestedBrief) {
      return privateJsonResponse({ error: 'Brief is required.' }, { status: 400 })
    }

    if (!templateId) {
      return privateJsonResponse({ error: 'Template is required.' }, { status: 400 })
    }

    if (!LAUNCH_ASSET_FORMATS.has(format)) {
      return privateJsonResponse({ error: 'Supported format is required.' }, { status: 400 })
    }

    const access = await requireLaunchApiAccess(request, {
      action: 'asset_generate',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const brief = normalizeBrief(requestedBrief)
    const kit = normalizeKit(getJsonObjectField(body, 'launchKit'), brief.language)
    const job = await createLaunchJob({
      userId: access.session?.user.id,
      subjectKey: access.subjectKey,
      action: 'asset_generate',
      payload: {
        sourceUrl: brief.sourceUrl,
        productName: brief.productName,
        templateId,
        format,
      },
    })
    jobId = job.id
    const launchKit = await generateLaunchAsset({
      brief,
      kit,
      templateId,
      format: format as LaunchAssetFormat,
    })
    await recordLaunchApiUsage(access, 'asset_generate', {
      templateId,
      format,
      productName: brief.productName,
    })
    await completeLaunchJob({
      jobId,
      result: {
        templateId,
        format,
      },
    })

    return privateJsonResponse({ launchKit, jobId })
  } catch (error) {
    if (jobId) {
      await completeLaunchJob({ jobId, error }).catch(() => undefined)
    }

    return launchApiRouteErrorResponse(
      error,
      'Failed to generate launch asset.',
      'launch_asset_generate_failed',
    )
  }
}
