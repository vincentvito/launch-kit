import { describe, expect, it, vi } from 'vitest'
import { createDemoSnapshot } from '@/lib/launch-kit/demo'
import { generateLaunchKit } from '@/lib/launch-kit/generator'

vi.mock('@/lib/launch-kit/replicate', () => ({
  hasReplicateToken: () => true,
  runReplicateStructured: vi.fn(async () => ({
    platformBlocks: {
      product_hunt: {
        title: { bad: true },
        body: 42,
        cta: null,
        notes: ['not', 'a', 'string'],
      },
    },
    channelPacks: {
      x: {
        notes: { bad: true },
        cards: [
          {
            id: 123,
            title: 'Provider-generated X headline',
            body: 'Title: Provider-generated X headline\n\nI built Launch Kit after realizing launch prep kept turning into ten empty docs.',
            cta: null,
            proofPoint: false,
            format: 42,
            socialContractNote: {},
            qualityChecks: [1, '  Check source proof  '],
          },
        ],
      },
    },
    mediaKit: {
      founderCompanyBio: {},
      productOneLiner: 5,
      boilerplate: null,
      pressRelease: [],
      keyVisualsChecklist: [{ bad: true }, '  Product screenshots  '],
      screenshotsAndLogos: {},
      contactDetails: null,
    },
    growthAssets: {
      linkedinOutreach: {
        notes: {},
        personalizationTemplate: 42,
        variants: [
          { message: {}, title: {} },
          { message: '  Hi {{firstName}}, saw {{company}}.  ', title: {}, cta: 5 },
        ],
      },
      seoPostPacks: [
        {
          keywordTopic: {},
          keywordClusterId: 42,
          title: [],
          metaDescription: {},
          outline: [{ bad: true }, '  Core workflow  '],
          draft: null,
          cta: 5,
        },
      ],
    },
  })),
}))

describe('launch kit provider output normalization', () => {
  it('falls back safely when structured model output contains malformed field types', async () => {
    const brief = createDemoSnapshot().brief

    const kit = await generateLaunchKit({
      brief,
      selectedBlocks: ['product_hunt'],
      selectedChannelPackIds: ['x'],
      selectedGrowthBlocks: ['linkedin_outreach', 'seo_posts'],
      includeMediaKit: true,
      includeGrowthAssets: true,
    })

    expect(kit.platformBlocks.product_hunt.title).toBe(`${brief.productName} on Product Hunt`)
    expect(kit.platformBlocks.product_hunt.body).toContain(brief.productName)
    expect(kit.channelPacks.x.cards[0]?.body).toContain(brief.productName)
    expect(kit.channelPacks.x.cards[0]?.body).not.toContain('Title:')
    expect(kit.channelPacks.x.cards[0]?.title).toBe('X - Launch post')
    expect(kit.channelPacks.x.cards[0]?.qualityChecks).toEqual(['Check source proof'])
    expect(kit.mediaKit.keyVisualsChecklist).toEqual(['Product screenshots'])
    expect(kit.growthAssets.linkedinOutreach.variants).toHaveLength(1)
    expect(kit.growthAssets.linkedinOutreach.variants[0]?.title).toBe('Variant 2')
    expect(kit.growthAssets.seoPostPacks[0]?.outline).toEqual(['Core workflow'])
  })
})
