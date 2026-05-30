import { NextResponse } from 'next/server'
import {
  generateLaunchKit,
  parseChannelCardTarget,
  parseSelectedBlockIds,
  parseSelectedChannelPackIds,
  parseSelectedGrowthBlockIds,
} from '@/lib/launch-kit/generator'
import { normalizeBrief } from '@/lib/launch-kit/normalizers'
import type { ExtractedBrief, LaunchKit } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      brief?: ExtractedBrief
      selectedBlocks?: unknown
      selectedChannelPackIds?: unknown
      channelCardTarget?: unknown
      selectedGrowthBlocks?: unknown
      includeMediaKit?: boolean
      includeGrowthAssets?: boolean
      existingKit?: LaunchKit | null
    }

    if (!body.brief) {
      return NextResponse.json({ error: 'Brief is required.' }, { status: 400 })
    }

    const selectedBlocks =
      body.selectedBlocks === undefined ? undefined : parseSelectedBlockIds(body.selectedBlocks)
    const selectedChannelPackIds =
      body.selectedChannelPackIds === undefined
        ? undefined
        : parseSelectedChannelPackIds(body.selectedChannelPackIds)
    const channelCardTarget = parseChannelCardTarget(body.channelCardTarget)
    const selectedGrowthBlocks =
      body.selectedGrowthBlocks === undefined
        ? undefined
        : parseSelectedGrowthBlockIds(body.selectedGrowthBlocks)

    const brief = normalizeBrief(body.brief)
    const launchKit = await generateLaunchKit({
      brief,
      selectedBlocks,
      selectedChannelPackIds,
      channelCardTarget,
      selectedGrowthBlocks,
      includeMediaKit: typeof body.includeMediaKit === 'boolean' ? body.includeMediaKit : true,
      includeGrowthAssets:
        typeof body.includeGrowthAssets === 'boolean' ? body.includeGrowthAssets : true,
      existingKit: body.existingKit ?? null,
    })

    return NextResponse.json({ launchKit })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Failed to generate launch kit.', error)
    return NextResponse.json({ error: 'Failed to generate launch kit.' }, { status: 500 })
  }
}
