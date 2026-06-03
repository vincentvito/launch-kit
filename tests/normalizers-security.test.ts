import { describe, expect, it } from 'vitest'
import { normalizeBrief, normalizeKit, sanitizeXPostBody } from '@/lib/launch-kit/normalizers'

describe('launch kit normalizer URL safety', () => {
  it('removes unsafe generated asset and growth URLs before dashboard rendering', () => {
    const normalized = normalizeKit({
      assetLibrary: {
        generatedAssets: [
          {
            templateId: 'screenshot_product_showcase',
            format: '16:9',
            status: 'succeeded',
            outputUrl: 'javascript:alert(1)',
          },
          {
            templateId: 'screenshot_product_showcase',
            format: '16:9',
            status: 'succeeded',
            outputUrl: 'http://127.0.0.1:3000/internal.png',
          },
          {
            templateId: 'image_ad_problem_solution',
            format: '1:1',
            status: 'succeeded',
            outputUrl: 'data:image/svg+xml;base64,PHN2Zy8+',
          },
        ],
      },
      seoGrowth: {
        freeTools: [
          {
            id: 'tool_1',
            category: 'Audit',
            title: 'Unsafe tool',
            url: 'javascript:alert(1)',
            workflow: 'Check the launch.',
          },
          {
            id: 'tool_2',
            category: 'Audit',
            title: 'Internal tool',
            url: 'http://10.0.0.5/tool',
            workflow: 'Check the launch.',
          },
          {
            id: 'tool_3',
            category: 'Audit',
            title: 'Safe tool',
            url: 'https://example.com/tool?ref=launch#section',
            workflow: 'Check the launch.',
          },
        ],
        backlinkProspects: [
          {
            id: 'prospect_1',
            title: 'Unsafe prospect',
            website: 'javascript:alert(1)',
            domain: 'example.com',
          },
          {
            id: 'prospect_internal',
            title: 'Internal prospect',
            website: 'http://localhost:3000/private',
            domain: 'localhost',
          },
          {
            id: 'prospect_dotless',
            title: 'Dotless prospect',
            website: 'https://intranet/private',
            domain: 'intranet',
          },
          {
            id: 'prospect_2',
            title: 'Safe prospect',
            website: 'https://example.com/path?ref=launch#fragment',
            domain: '',
          },
        ],
      },
    }, 'en')

    expect(normalized.assetLibrary.generatedAssets[0]?.outputUrl).toBe('')
    expect(normalized.assetLibrary.generatedAssets[1]?.outputUrl).toBe('')
    expect(normalized.assetLibrary.generatedAssets[2]?.outputUrl).toBe('data:image/svg+xml;base64,PHN2Zy8+')
    expect(normalized.seoGrowth.freeTools[0]?.url).toBe('')
    expect(normalized.seoGrowth.freeTools[1]?.url).toBe('')
    expect(normalized.seoGrowth.freeTools[2]?.url).toBe('https://example.com/tool?ref=launch')
    expect(normalized.seoGrowth.backlinkProspects[0]?.website).toBe('')
    expect(normalized.seoGrowth.backlinkProspects[1]?.website).toBe('')
    expect(normalized.seoGrowth.backlinkProspects[2]?.website).toBe('')
    expect(normalized.seoGrowth.backlinkProspects[3]?.website).toBe('https://example.com/')
  })

  it('rebuilds subreddit recommendation URLs from the normalized subreddit slug', () => {
    const normalized = normalizeKit({
      platformBlocks: {
        reddit: {
          id: 'reddit',
          label: 'Reddit',
          title: 'Reddit launch',
          body: '',
          cta: '',
          notes: '',
          redditRecommendations: {
            engagementSubreddits: [
              {
                name: 'r/startups',
                url: 'javascript:alert(1)',
                reason: 'Relevant founder audience.',
                postingGuidance: 'Ask for feedback.',
              },
            ],
            selfPromotionSubreddits: [],
          },
        },
      },
    }, 'en')

    expect(
      normalized.platformBlocks.reddit.redditRecommendations?.engagementSubreddits[0]?.url,
    ).toBe('https://www.reddit.com/r/startups/')
  })

  it('coerces malformed stored brief and launch kit fields into the expected runtime shape', () => {
    const brief = normalizeBrief({
      productName: 12,
      targetUsers: [' makers ', 4, null, ''],
      keywordResearch: {
        clusters: [
          {
            topic: ' launch seo ',
            intent: 'bad',
            priority: 'urgent',
            keywords: [' launch ', 9],
            contentAngles: [false, ' founder lesson '],
          },
        ],
      },
    }, {
      productName: 'Fallback App',
      sourceUrl: 'https://example.com',
      language: 'en',
    })

    expect(brief.productName).toBe('Fallback App')
    expect(brief.targetUsers).toEqual(['makers'])
    expect(brief.keywordResearch.clusters[0]).toMatchObject({
      topic: 'launch seo',
      intent: 'informational',
      priority: 'medium',
      keywords: ['launch'],
      contentAngles: ['founder lesson'],
    })

    const normalized = normalizeKit({
      generatedAt: 42,
      language: {},
      platformBlocks: {
        product_hunt: {
          title: 123,
          body: ' launch story ',
          cta: null,
          notes: ['bad'],
        },
        reddit: {
          id: 'reddit',
          label: 'Reddit',
          title: 'Reddit launch',
          body: '',
          cta: '',
          notes: '',
          redditRecommendations: {
            engagementSubreddits: [
              null,
              {
                name: 'r/SaaS',
                reason: 5,
                postingGuidance: ' ask for feedback ',
              },
            ],
            selfPromotionSubreddits: [{ url: 'https://reddit.com/r/SideProject' }],
          },
        },
      },
      channelPacks: {
        x: {
          label: 99,
          notes: 123,
          cards: [
            null,
            {
              id: 7,
              title: 9,
              body: 'Title: Missing launches taught me this\n\nbuilt this after missing launches ',
              cta: {},
              stage: 'bad',
              qualityChecks: [' honest ', 0, ''],
            },
          ],
        },
      },
      mediaKit: {
        founderCompanyBio: 123,
        keyVisualsChecklist: [' logo ', 42, ' product shot '],
      },
      growthAssets: {
        linkedinOutreach: {
          notes: ['bad'],
          variants: [
            null,
            { id: 7, title: 42, message: ' useful note ', cta: 123 },
            { message: 5 },
          ],
        },
        xOutreach: {
          variants: [{ title: {}, message: ' distribution lesson ' }],
        },
        seoPostPacks: [
          null,
          {
            title: 42,
            draft: ' draft body ',
            outline: [' intro ', 6],
          },
        ],
        followUpSequences: [
          { day: 3, message: ' checking in ' },
          { message: 4 },
        ],
      },
      prospecting: {
        queryHints: [' founders ', 42],
        leads: [
          null,
          {
            company: ' Acme ',
            website: 'http://127.0.0.1/private',
            score: 999,
            tier: 'blazing',
          },
          {
            name: 'Ada',
            website: 'https://example.com/profile',
          },
        ],
        personalizedOutreach: [
          { leadId: 'lead_1', emailBody: ' hello ' },
          { leadId: 'lead_1', linkedinMessage: 8 },
        ],
        actionRuns: [{ type: 'bad', status: 'bad' }],
        emailJobs: [
          { leadIds: ['lead_1', 3], subject: 5 },
          { subject: 'Subject' },
        ],
      },
      seoGrowth: {
        websiteAnalysis: {
          score: '100',
          summary: 3,
          strengths: [' fast ', 4],
          checks: [
            null,
            { label: 3, detail: ' fix metadata ', status: 'bad' },
          ],
          llmReadinessNotes: [' cite sources ', {}],
        },
        blogStrategy: [
          {
            keywordTopic: ' founder marketing ',
            title: 44,
            intent: 'bad',
            targetKeywords: [' launch ', 7],
          },
        ],
        freeTools: [{ title: 'Tool', url: 'javascript:alert(1)', workflow: 5 }],
        backlinkProspects: [
          null,
          {
            website: 'http://localhost:3000/private',
            domain: 42,
            title: ' Bad link ',
            listIds: ['list_1', 9],
            status: 'bad',
          },
        ],
        prospectLists: [
          { name: 7, prospectIds: [1] },
          { name: 'Launch list', prospectIds: ['prospect_1', 8] },
        ],
        backlinkEmailJobs: [
          { prospectIds: ['prospect_1', 9], subject: 3 },
          { subject: 'Follow up' },
        ],
      },
    }, 'en')

    expect(normalized.generatedAt).not.toBe('42')
    expect(normalized.platformBlocks.product_hunt).toMatchObject({
      title: '',
      body: 'launch story',
      cta: '',
      notes: '',
    })
    expect(
      normalized.platformBlocks.reddit.redditRecommendations?.engagementSubreddits[0],
    ).toMatchObject({
      name: 'r/SaaS',
      url: 'https://www.reddit.com/r/SaaS/',
      reason: '',
      postingGuidance: 'ask for feedback',
    })
    expect(normalized.channelPacks.x.cards[0]).toMatchObject({
      title: '',
      body: 'built this after missing launches',
      cta: '',
      stage: 'evergreen',
      qualityChecks: ['honest'],
    })
    expect(normalized.mediaKit.keyVisualsChecklist).toEqual(['logo', 'product shot'])
    expect(normalized.growthAssets.linkedinOutreach.variants).toHaveLength(1)
    expect(normalized.growthAssets.xOutreach.variants[0]).toMatchObject({
      title: '',
      message: 'distribution lesson',
    })
    expect(normalized.growthAssets.seoPostPacks[0]).toMatchObject({
      title: '',
      draft: 'draft body',
      outline: ['intro'],
    })
    expect(normalized.growthAssets.followUpSequences).toEqual([
      { day: 'Day 1', message: 'checking in' },
    ])
    expect(normalized.prospecting.queryHints).toEqual(['founders'])
    expect(normalized.prospecting.leads[0]).toMatchObject({
      company: 'Acme',
      website: '',
      score: 100,
      tier: 'warm',
    })
    expect(normalized.prospecting.leads[1]?.website).toBe('https://example.com/profile')
    expect(normalized.prospecting.personalizedOutreach).toHaveLength(1)
    expect(normalized.prospecting.actionRuns[0]).toMatchObject({
      type: 'prospect',
      status: 'failed',
    })
    expect(normalized.prospecting.emailJobs).toEqual([
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
        subject: 'Subject',
        bodyPreview: '',
        createdAt: '',
        completedAt: undefined,
      },
    ])
    expect(normalized.seoGrowth.websiteAnalysis).toMatchObject({
      score: 0,
      summary: '',
      strengths: ['fast'],
      llmReadinessNotes: ['cite sources'],
    })
    expect(normalized.seoGrowth.websiteAnalysis?.checks[0]).toMatchObject({
      label: '',
      status: 'warning',
      detail: 'fix metadata',
    })
    expect(normalized.seoGrowth.blogStrategy[0]).toMatchObject({
      keywordTopic: 'founder marketing',
      title: '',
      intent: 'informational',
      targetKeywords: ['launch'],
    })
    expect(normalized.seoGrowth.freeTools[0]).toMatchObject({
      title: 'Tool',
      url: '',
      workflow: '',
    })
    expect(normalized.seoGrowth.backlinkProspects[0]).toMatchObject({
      website: '',
      domain: '',
      title: 'Bad link',
      listIds: ['list_1'],
      status: 'new',
    })
    expect(normalized.seoGrowth.prospectLists).toEqual([
      {
        id: 'backlink-list-2',
        name: 'Launch list',
        description: '',
        prospectIds: ['prospect_1'],
        createdAt: '',
        updatedAt: '',
      },
    ])
    expect(normalized.seoGrowth.backlinkEmailJobs).toEqual([
      {
        id: 'backlink-email-job-1',
        status: 'completed',
        prospectIds: ['prospect_1'],
        subject: '',
        bodyPreview: '',
        createdAt: '',
        completedAt: '',
      },
      {
        id: 'backlink-email-job-2',
        status: 'completed',
        prospectIds: [],
        subject: 'Follow up',
        bodyPreview: '',
        createdAt: '',
        completedAt: '',
      },
    ])
  })

  it('removes visible headline wrappers from X post bodies only at the start', () => {
    expect(
      sanitizeXPostBody(
        'Title: Launch prep should not start from blank docs\n\nI built Launch Kit because launch copy kept getting scattered.',
        'X - Launch post',
        'Launch post',
      ),
    ).toBe('I built Launch Kit because launch copy kept getting scattered.')

    expect(sanitizeXPostBody('X post: I learned the launch story matters more than the CTA.'))
      .toBe('I learned the launch story matters more than the CTA.')

    expect(
      sanitizeXPostBody(
        'Launch post\n\nI learned the launch story matters more than the CTA.',
        'X - Launch post',
        'Launch post',
      ),
    ).toBe('I learned the launch story matters more than the CTA.')
  })
})
