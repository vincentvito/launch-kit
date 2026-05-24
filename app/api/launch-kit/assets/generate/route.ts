import { NextResponse } from 'next/server'
import { generateLaunchAsset } from '@/lib/launch-kit/assets'
import { normalizeBrief, normalizeKit } from '@/lib/launch-kit/normalizers'
import type { ExtractedBrief, LaunchAssetFormat, LaunchKit } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

const LAUNCH_ASSET_FORMATS = new Set(['16:9', '9:16', '1:1', '4:5', '1.91:1', 'text'])

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      brief?: Partial<ExtractedBrief>
      launchKit?: Partial<LaunchKit> | null
      templateId?: unknown
      format?: unknown
    }

    if (!body.brief) {
      return NextResponse.json({ error: 'Brief is required.' }, { status: 400 })
    }

    if (typeof body.templateId !== 'string' || !body.templateId.trim()) {
      return NextResponse.json({ error: 'Template is required.' }, { status: 400 })
    }

    if (typeof body.format !== 'string' || !LAUNCH_ASSET_FORMATS.has(body.format)) {
      return NextResponse.json({ error: 'Supported format is required.' }, { status: 400 })
    }

    const brief = normalizeBrief(body.brief)
    const kit = normalizeKit(body.launchKit, brief.language)
    const launchKit = await generateLaunchAsset({
      brief,
      kit,
      templateId: body.templateId,
      format: body.format as LaunchAssetFormat,
    })

    return NextResponse.json({ launchKit })
  } catch (error) {
    console.error('Failed to generate launch asset.', error)
    return NextResponse.json({ error: 'Failed to generate launch asset.' }, { status: 500 })
  }
}
