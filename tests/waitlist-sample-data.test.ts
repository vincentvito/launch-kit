import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { readWaitingListSampleData } from '@/components/waiting-list/sample-data'

describe('waitlist sample data', () => {
  it('keeps the rendered sample fixture in locale messages', () => {
    const dataSource = readFileSync('components/waiting-list/sample-data.ts', 'utf8')
    const dashboardSource = readFileSync(
      'components/waiting-list/waiting-list-sample-dashboard.tsx',
      'utf8',
    )
    const englishMessages = JSON.parse(readFileSync('messages/en.json', 'utf8')) as {
      WaitingList?: { sampleData?: unknown }
    }

    expect(dataSource).not.toContain('export const SAMPLE_')
    expect(dataSource).not.toContain('Shipdaddy turns one product URL')
    expect(dashboardSource).not.toContain('SAMPLE_CHANNELS')
    expect(dashboardSource).toContain('sampleData.channels')
    expect(englishMessages.WaitingList?.sampleData).toBeDefined()
  })

  it('parses localized sample fixture arrays safely', () => {
    const englishMessages = JSON.parse(readFileSync('messages/en.json', 'utf8')) as {
      WaitingList?: { sampleData?: unknown }
    }
    const sampleData = readWaitingListSampleData(englishMessages.WaitingList?.sampleData)

    expect(sampleData.channels.map((channel) => channel.id)).toContain('x')
    expect(sampleData.briefSignals).toHaveLength(3)
    expect(sampleData.subreddits.length).toBeGreaterThan(0)
    expect(sampleData.mediaKit.oneLiner).toContain('Shipdaddy')
  })
})
