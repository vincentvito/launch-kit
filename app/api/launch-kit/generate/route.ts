import { NextResponse } from 'next/server'
import {
  generateLaunchKit,
  parseSelectedBlockIds,
  parseSelectedGrowthBlockIds,
} from '@/lib/launch-kit/generator'
import type { ExtractedBrief, LaunchKit } from '@/lib/launch-kit/types'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      brief?: ExtractedBrief
      selectedBlocks?: unknown
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
    const selectedGrowthBlocks =
      body.selectedGrowthBlocks === undefined
        ? undefined
        : parseSelectedGrowthBlockIds(body.selectedGrowthBlocks)

    const launchKit = await generateLaunchKit({
      brief: body.brief,
      selectedBlocks,
      selectedGrowthBlocks,
      includeMediaKit: typeof body.includeMediaKit === 'boolean' ? body.includeMediaKit : true,
      includeGrowthAssets:
        typeof body.includeGrowthAssets === 'boolean' ? body.includeGrowthAssets : true,
      existingKit: body.existingKit ?? null,
    })

    return NextResponse.json({ launchKit })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate launch kit.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
