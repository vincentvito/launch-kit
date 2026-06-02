import { describe, expect, it } from 'vitest'
import { createEmptyProspectingState, createEmptySeoGrowthState } from '../lib/launch-kit/normalizers'
import { exportLeadsCsv } from '../lib/launch-kit/prospecting'
import { exportBacklinkProspectsCsv } from '../lib/launch-kit/seo'
import { escapeCsvCell } from '../lib/launch-kit/utils'

describe('CSV exports', () => {
  it('escapes formula-like cells before writing lead exports', () => {
    const csv = exportLeadsCsv({
      ...createEmptyProspectingState(),
      leads: [
        {
          id: 'lead_1',
          name: '=IMPORTXML("https://evil.example")',
          role: '+Growth',
          company: '@Acme',
          website: 'https://example.com',
          email: 'founder@example.com',
          linkedinUrl: '',
          xUrl: '',
          score: 90,
          tier: 'hot',
          reason: '-starts with dash',
          source: 'seeded',
        },
      ],
    })

    expect(csv).toContain('"\'=IMPORTXML(""https://evil.example"")"')
    expect(csv).toContain('"\'@Acme"')
    expect(csv).toContain('"\'-starts with dash"')
  })

  it('escapes formula-like cells before writing backlink exports', () => {
    const csv = exportBacklinkProspectsCsv({
      ...createEmptySeoGrowthState(),
      backlinkProspects: [
        {
          id: 'backlink_1',
          website: 'https://example.com',
          domain: 'example.com',
          title: '=HYPERLINK("https://evil.example")',
          contactName: 'Editorial',
          contactEmail: 'editor@example.com',
          scrapedSummary: '',
          relevanceReason: '+relevant',
          backlinkAngle: '@angle',
          costToList: null,
          estimatedTraffic: null,
          relevanceScore: 80,
          trafficScore: 70,
          authorityScore: 60,
          contactabilityScore: 90,
          costScore: 50,
          valueScore: 76,
          status: 'new',
          listIds: [],
          customizedEmailSubject: '',
          customizedEmailBody: '',
          source: 'seeded',
          discoveredAt: '',
          lastContactedAt: '',
        },
      ],
    })

    expect(csv).toContain('"\'=HYPERLINK(""https://evil.example"")"')
    expect(csv).toContain('"\'@angle"')
  })

  it('preserves ordinary CSV quoting behavior', () => {
    expect(escapeCsvCell('Said "hello"')).toBe('"Said ""hello"""')
  })
})
