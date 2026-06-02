import { generateLaunchAsset } from '@/lib/launch-kit/assets'
import {
  launchApiRouteErrorResponse,
  privateJsonResponse,
  readJsonBody,
  recordLaunchApiUsage,
  requireLaunchApiAccess,
} from '@/lib/launch-kit/api-guard'
import { completeLaunchJob, createLaunchJob } from '@/lib/launch-kit/jobs'
import { normalizeBrief, normalizeKit } from '@/lib/launch-kit/normalizers'
import type { ExtractedBrief, LaunchAssetFormat, LaunchKit } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

const LAUNCH_ASSET_FORMATS = new Set(['16:9', '9:16', '1:1', '4:5', '1.91:1', 'text'])

export async function POST(request: Request) {
  let jobId: string | undefined

  try {
    const body = await readJsonBody<{
      brief?: Partial<ExtractedBrief>
      launchKit?: Partial<LaunchKit> | null
      templateId?: unknown
      format?: unknown
    }>(request, { maxBytes: 2 * 1024 * 1024 })

    if (!body.brief) {
      return privateJsonResponse({ error: 'Brief is required.' }, { status: 400 })
    }

    if (typeof body.templateId !== 'string' || !body.templateId.trim()) {
      return privateJsonResponse({ error: 'Template is required.' }, { status: 400 })
    }

    if (typeof body.format !== 'string' || !LAUNCH_ASSET_FORMATS.has(body.format)) {
      return privateJsonResponse({ error: 'Supported format is required.' }, { status: 400 })
    }

    const access = await requireLaunchApiAccess(request, {
      action: 'asset_generate',
      feature: 'premium',
      rateLimitAction: 'premium_action',
    })
    const brief = normalizeBrief(body.brief)
    const kit = normalizeKit(body.launchKit, brief.language)
    const job = await createLaunchJob({
      userId: access.session?.user.id,
      subjectKey: access.subjectKey,
      action: 'asset_generate',
      payload: {
        sourceUrl: brief.sourceUrl,
        productName: brief.productName,
        templateId: body.templateId,
        format: body.format,
      },
    })
    jobId = job.id
    const launchKit = await generateLaunchAsset({
      brief,
      kit,
      templateId: body.templateId,
      format: body.format as LaunchAssetFormat,
    })
    await recordLaunchApiUsage(access, 'asset_generate', {
      templateId: body.templateId,
      format: body.format,
      productName: brief.productName,
    })
    await completeLaunchJob({
      jobId,
      result: {
        templateId: body.templateId,
        format: body.format,
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
