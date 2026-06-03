import { describe, expect, it } from 'vitest'
import {
  exportLeadsCsv,
  runBuildEmailListAction,
  runImportEmailListAction,
  runScoreSegmentAction,
} from '@/lib/launch-kit/prospecting'

describe('prospecting action normalization', () => {
  const malformedProspecting = {
    queryHints: [' founders ', 42],
    leads: [
      null,
      {
        name: ' Ada Lovelace ',
        role: 99,
        company: ' Example Co ',
        website: ' https://example.com/team ',
        email: '',
        linkedinUrl: 'javascript:alert(1)',
        xUrl: 'http://localhost:3000/profile',
        reason: 42,
        source: ['bad'],
        score: 999,
        tier: 'blazing',
      },
      {
        company: ' Internal Co ',
        website: 'http://127.0.0.1/private',
        score: -10,
      },
    ],
    personalizedOutreach: [
      { leadId: 7, emailBody: ' hello ' },
      { leadId: 'lead_1', emailBody: 4 },
    ],
    actionRuns: [{ type: 'weird', status: 'bad', summary: 123 }],
    emailJobs: [
      { leadIds: ['lead_1', 5], subject: 99 },
      { leadIds: [], subject: ' Existing batch ' },
    ],
    lastScrapeAt: 123,
  }

  it('sanitizes malformed prospecting state before building email hints', () => {
    const result = runBuildEmailListAction({ prospecting: malformedProspecting })

    expect(result.prospecting.queryHints).toEqual(['founders'])
    expect(result.prospecting.leads).toHaveLength(2)
    expect(result.prospecting.leads[0]).toMatchObject({
      name: 'Ada Lovelace',
      role: '',
      company: 'Example Co',
      website: 'https://example.com/team',
      email: 'ada.lovelace@example.com',
      linkedinUrl: 'https://www.linkedin.com/in/ada-lovelace',
      xUrl: '',
      reason: '',
      source: '',
      score: 100,
      tier: 'hot',
    })
    expect(result.prospecting.leads[1]).toMatchObject({
      company: 'Internal Co',
      website: '',
      score: 0,
      tier: 'cold',
    })
    expect(result.prospecting.personalizedOutreach).toEqual([])
    expect(result.prospecting.emailJobs).toEqual([
      {
        id: 'email-job-1',
        status: 'completed',
        leadIds: ['lead_1'],
        subject: '',
        bodyPreview: '',
        createdAt: '',
        completedAt: undefined,
      },
      {
        id: 'email-job-2',
        status: 'completed',
        leadIds: [],
        subject: 'Existing batch',
        bodyPreview: '',
        createdAt: '',
        completedAt: undefined,
      },
    ])
    expect(result.prospecting.actionRuns[1]).toMatchObject({
      type: 'prospect',
      status: 'failed',
      summary: '',
    })
  })

  it('sanitizes malformed prospecting state before scoring and CSV export', () => {
    const scored = runScoreSegmentAction({ prospecting: malformedProspecting })
    const csv = exportLeadsCsv(malformedProspecting)

    expect(scored.prospecting.leads[0]).toMatchObject({
      website: 'https://example.com/team',
      linkedinUrl: '',
      score: 98,
      tier: 'hot',
    })
    expect(scored.prospecting.leads[1]).toMatchObject({
      website: '',
      score: 12,
      tier: 'cold',
    })
    expect(csv).toContain('Ada Lovelace')
    expect(csv).toContain('https://example.com/team')
    expect(csv).not.toContain('127.0.0.1')
    expect(csv).not.toContain('[object Object]')
  })

  it('normalizes existing state before importing contacts', () => {
    const result = runImportEmailListAction({
      prospecting: malformedProspecting,
      rawContacts: 'Jane Founder, Founder, Startup Co, jane@example.org, https://example.org',
    })

    expect(result.prospecting.leads.some((lead) => lead.email === 'jane@example.org')).toBe(true)
    expect(result.prospecting.leads.every((lead) => typeof lead.name === 'string')).toBe(true)
    expect(result.prospecting.leads.every((lead) => typeof lead.score === 'number')).toBe(true)
  })
})
