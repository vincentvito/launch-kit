import { describe, expect, it } from 'vitest'
import { normalizeBrief } from '@/lib/launch-kit/normalizers'
import {
  buildBacklinkOutreachDeliveryPayload,
  exportBacklinkProspectsCsv,
  runAddBacklinkProspectsToListAction,
  runPersonalizeBacklinkEmailsAction,
  runSendBacklinkEmailAction,
  runUpdateBacklinkProspectStatusAction,
} from '@/lib/launch-kit/seo'

const brief = normalizeBrief({
  sourceUrl: 'https://launch.example',
  productName: 'LaunchKit',
  positioning: 'helps founders ship launch assets faster',
  targetUsers: ['founders'],
  valueProps: ['faster launch workflows'],
  proofPoints: ['used by small startup teams'],
  cta: 'Try it today.',
  keywordResearch: {
    clusters: [
      {
        id: 'cluster-launch',
        topic: 'launch marketing',
        intent: 'informational',
        priority: 'high',
        keywords: ['launch marketing'],
        contentAngles: ['launch workflows'],
      },
    ],
  },
})

const malformedSeoGrowth = {
  backlinkProspects: [
    null,
    {
      id: ' prospect_safe ',
      website: ' https://example.com/path?ref=launch ',
      domain: 42,
      title: ' Example Directory ',
      contactName: ' Editor ',
      contactEmail: 'editor@example.com',
      status: 'bad',
      estimatedTraffic: Number.NaN,
      costToList: 'free',
      valueScore: 999,
      relevanceScore: -10,
      trafficScore: 'fast',
      authorityScore: 66,
      contactabilityScore: 77,
      costScore: 88,
      listIds: ['existing-list', 9],
      backlinkAngle: ' founder story ',
      relevanceReason: 123,
      source: ['bad'],
    },
    {
      id: 'prospect_internal',
      website: 'http://127.0.0.1/private',
      title: 'Internal prospect',
      contactEmail: 'internal@example.com',
    },
  ],
  prospectLists: [
    { id: 'existing-list', name: ' Existing ', prospectIds: ['prospect_safe', 6] },
  ],
  backlinkEmailJobs: [
    { prospectIds: ['prospect_safe', 8], subject: 3 },
    { prospectIds: [], subject: ' Existing follow up ' },
  ],
}

describe('SEO action normalization', () => {
  it('sanitizes malformed backlink prospects before CSV export', () => {
    const csv = exportBacklinkProspectsCsv(malformedSeoGrowth)

    expect(csv).toContain('Example Directory')
    expect(csv).toContain('https://example.com/')
    expect(csv).toContain('"new"')
    expect(csv).not.toContain('127.0.0.1')
    expect(csv).not.toContain('[object Object]')
  })

  it('normalizes state and selector inputs before list and status updates', () => {
    const listed = runAddBacklinkProspectsToListAction({
      seoGrowth: malformedSeoGrowth,
      prospectIds: [' prospect_safe ', 4],
      listName: 99,
    })

    expect(listed.seoGrowth.prospectLists.at(-1)).toMatchObject({
      name: 'Selected backlink prospects',
      prospectIds: ['prospect_safe'],
    })
    expect(listed.seoGrowth.backlinkProspects[0]?.listIds).toEqual([
      'existing-list',
      expect.stringContaining('backlink-list-selected-backlink-prospects-'),
    ])

    const updated = runUpdateBacklinkProspectStatusAction({
      seoGrowth: malformedSeoGrowth,
      prospectId: 'prospect_safe',
      status: 'closed',
    })

    expect(updated.seoGrowth.backlinkProspects[0]?.status).toBe('closed')

    const unchanged = runUpdateBacklinkProspectStatusAction({
      seoGrowth: malformedSeoGrowth,
      prospectId: ['prospect_safe'],
      status: 'closed',
    })

    expect(unchanged.seoGrowth.backlinkProspects[0]?.status).toBe('new')
  })

  it('normalizes backlink prospects before personalization and delivery payloads', () => {
    const personalized = runPersonalizeBacklinkEmailsAction({
      brief,
      seoGrowth: malformedSeoGrowth,
      prospectIds: 'not-an-array',
    })

    expect(personalized.seoGrowth.backlinkProspects[0]).toMatchObject({
      id: 'prospect_safe',
      website: 'https://example.com/',
      customizedEmailSubject: 'LaunchKit for Example Directory',
    })

    const payload = buildBacklinkOutreachDeliveryPayload({
      seoGrowth: malformedSeoGrowth,
      prospectIds: ['prospect_safe', 6],
    })

    expect(payload.prospects).toHaveLength(1)
    expect(payload.prospects[0]).toMatchObject({
      id: 'prospect_safe',
      website: 'https://example.com/',
      contactEmail: 'editor@example.com',
    })
  })

  it('normalizes backlink prospects before send job updates', () => {
    const result = runSendBacklinkEmailAction({
      seoGrowth: malformedSeoGrowth,
      prospectIds: ['prospect_safe', 6],
      delivery: { configured: true, delivered: true },
    })

    expect(result.seoGrowth.backlinkProspects[0]).toMatchObject({
      id: 'prospect_safe',
      status: 'first_contact',
      lastContactedAt: expect.any(String),
    })
    expect(result.seoGrowth.backlinkEmailJobs[0]).toMatchObject({
      status: 'completed',
      prospectIds: ['prospect_safe'],
    })
  })
})
