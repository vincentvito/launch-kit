import { describe, expect, it } from 'vitest'
import { createDemoSnapshot } from '../lib/launch-kit/demo'
import {
  buildLeadOutreachDeliveryPayload,
  runSendOutreachEmailAction,
} from '../lib/launch-kit/prospecting'
import {
  buildBacklinkOutreachDeliveryPayload,
  runSendBacklinkEmailAction,
} from '../lib/launch-kit/seo'

describe('email delivery actions', () => {
  it('prepares lead outreach batches when delivery is not configured', () => {
    const kit = {
      ...createDemoSnapshot().kit,
      prospecting: {
        ...createDemoSnapshot().kit.prospecting,
        leads: [
          {
            id: 'lead-1',
            name: 'Maya Chen',
            role: 'Growth Lead',
            company: 'Acme',
            website: 'https://acme.example',
            email: 'maya@acme.example',
            linkedinUrl: '',
            xUrl: '',
            reason: 'Relevant launch workflow owner.',
            source: 'test',
            score: 82,
            tier: 'hot' as const,
          },
        ],
      },
    }
    const payload = buildLeadOutreachDeliveryPayload({ launchKit: kit })

    expect(payload.leads.length).toBeGreaterThan(0)
    expect(payload.leads[0]?.email).toContain('@')

    const result = runSendOutreachEmailAction({
      launchKit: kit,
      delivery: { configured: false, delivered: false },
    })

    expect(result.prospecting.emailJobs[0]?.status).toBe('queued')
    expect(result.prospecting.actionRuns[0]?.status).toBe('pending_approval')
    expect(result.info).toContain('OUTREACH_EMAIL_WEBHOOK_URL')
  })

  it('prepares backlink outreach payloads with per-prospect copy', () => {
    const kit = createDemoSnapshot().kit
    const payload = buildBacklinkOutreachDeliveryPayload({ seoGrowth: kit.seoGrowth })

    expect(payload.prospects.length).toBeGreaterThan(0)
    expect(payload.prospects[0]?.contactEmail).toContain('@')
    expect(payload.prospects[0]?.subject.length).toBeGreaterThan(0)
    expect(payload.prospects[0]?.body.length).toBeGreaterThan(0)

    const result = runSendBacklinkEmailAction({
      seoGrowth: kit.seoGrowth,
      delivery: { configured: false, delivered: false },
    })

    expect(result.seoGrowth.backlinkEmailJobs[0]?.status).toBe('queued')
    expect(result.info).toContain('OUTREACH_EMAIL_WEBHOOK_URL')
  })
})
