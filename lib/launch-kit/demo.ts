import {
  DEFAULT_LAUNCH_ASSET_TEMPLATES,
  PLATFORM_IDS,
  PLATFORM_LABELS,
  type ExtractedBrief,
  type LaunchKit,
  type LaunchProjectSnapshot,
  type PlatformBlock,
  type PlatformBlockId,
  type SeoGrowthState,
} from '@/lib/launch-kit/types'

export const DEMO_SOURCE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const DEMO_TIMESTAMP = '2026-05-21T08:00:00.000Z'

function buildDemoBrief(sourceUrl: string): ExtractedBrief {
  return {
    sourceUrl,
    productName: 'Launch Kit',
    positioning:
      'Launch Kit turns one product URL into platform-native launch copy, a press-ready media kit, SEO strategy, and outreach controls for founders shipping without a full marketing team.',
    targetUsers: [
      'Solo SaaS founders preparing a public launch',
      'Indie hackers shipping frequent product updates',
      'Small startup teams coordinating content, press, and outreach',
    ],
    icp:
      'Founders and lean product teams who need a repeatable launch workflow that keeps one narrative consistent while adapting delivery across communities, SEO, and outreach.',
    painPoints: [
      'Rewriting the same product story for every launch channel',
      'Losing voice quality when one generic post is reused everywhere',
      'Splitting launch copy, media assets, SEO planning, and prospecting across too many tools',
    ],
    valueProps: [
      'Extracts an editable product brief from one URL',
      'Generates channel-ready launch assets for social, community, video, email, press, SEO, and outreach',
      'Keeps exports, prospecting, and simulated outreach in one dashboard',
    ],
    keyClaims: [
      'One URL becomes a full multi-channel launch kit',
      'Every output respects the social contract of its destination channel',
      'SEO and outreach channel views include analysis, blog strategy, backlinks, and tracking',
    ],
    proofPoints: [
      'Generates 8 launch channels plus media kit and growth assets from one structured brief',
      'Includes per-tab regenerate controls, markdown export, and print-ready press pack output',
      'Ships with zero-config fallbacks so a fresh clone can demo the workflow without external services',
    ],
    cta: 'Try Launch Kit with your product URL',
    language: 'en',
    sourceHighlights: [
      'One URL, every launch channel.',
      'Review generated content, regenerate tabs, and export your kit.',
      'SEO, prospecting, and outreach execution controls live in dedicated channel views.',
    ],
    detectedImageUrls: [`${sourceUrl}/globe.svg`, `${sourceUrl}/window.svg`],
    crawlPages: [
      sourceUrl,
      `${sourceUrl}/dashboard`,
      `${sourceUrl}/changelog`,
      `${sourceUrl}/auth/login`,
    ],
    keywordResearch: {
      generatedAt: DEMO_TIMESTAMP,
      notes:
        'Clustered from Launch Kit positioning, dashboard workflows, and founder launch intent.',
      clusters: [
        {
          id: 'cluster-launch-kit-generator',
          topic: 'Launch kit generator',
          intent: 'commercial',
          priority: 'high',
          keywords: [
            'launch kit generator',
            'product launch kit',
            'startup launch content generator',
            'launch copy generator',
          ],
          contentAngles: [
            'How founders create a complete launch kit from one product URL',
            'What belongs in a modern product launch kit',
          ],
        },
        {
          id: 'cluster-channel-launch-copy',
          topic: 'Channel-specific launch copy',
          intent: 'informational',
          priority: 'high',
          keywords: [
            'product hunt launch copy',
            'hacker news launch post',
            'reddit launch post',
            'linkedin product launch post',
          ],
          contentAngles: [
            'How each community changes the tone and structure of launch copy',
            'Examples of adapting one product story for multiple channels',
          ],
        },
        {
          id: 'cluster-launch-seo',
          topic: 'SEO strategy for product launches',
          intent: 'commercial',
          priority: 'medium',
          keywords: [
            'product launch SEO strategy',
            'startup blog strategy',
            'backlink outreach for SaaS',
            'SEO launch checklist',
          ],
          contentAngles: [
            'How to pair launch content with a 4-day blog cadence',
            'How backlink prospecting supports a new product launch',
          ],
        },
      ],
    },
  }
}

export const DEMO_BRIEF: ExtractedBrief = buildDemoBrief(DEMO_SOURCE_URL)

const DEMO_BLOCKS: Record<PlatformBlockId, PlatformBlock> = {
  product_hunt: {
    id: 'product_hunt',
    label: PLATFORM_LABELS.product_hunt,
    title: 'Launch Kit - One URL, every launch channel',
    body:
      'Launch Kit turns one product URL into a complete launch system: Product Hunt copy, Show HN, Reddit, Indie Hackers, LinkedIn, short-form video scripts, email, press assets, SEO strategy, and outreach controls.\n\nInstead of starting from a blank page for every channel, founders review one extracted brief and generate platform-native assets from the same source narrative.',
    cta: 'Try Launch Kit with your product URL',
    notes: 'Maker-friendly and outcome-led, with the full workflow visible.',
  },
  hacker_news: {
    id: 'hacker_news',
    label: PLATFORM_LABELS.hacker_news,
    title: 'Show HN: Launch Kit - URL to launch assets for founders',
    body:
      'I built Launch Kit because launch prep kept turning into repetitive rewriting work.\n\nThe flow is intentionally simple: paste a product URL, review the extracted brief, then generate drafts for Product Hunt, HN, Reddit, Indie Hackers, LinkedIn, short video, email, press, SEO, and outreach.\n\nWould appreciate feedback on the extraction quality, per-channel voice, and whether the SEO and outreach channel views feel useful or too much.',
    cta: 'Try it and share blunt feedback',
    notes: 'Humble, specific, and feedback-oriented for HN.',
  },
  reddit: {
    id: 'reddit',
    label: PLATFORM_LABELS.reddit,
    title: 'Built a launch dashboard that rewrites one product URL for each channel',
    body:
      'I kept seeing the same launch problem: the product story is one thing, but every community expects a different style.\n\nLaunch Kit extracts a brief from a URL and generates drafts for launch communities, social, video, email, press, SEO, and backlink outreach. The goal is not to spam every channel, but to stop pretending one generic announcement fits everywhere.\n\nIf you launch products, which output would you trust least: HN, Reddit, LinkedIn, SEO, or outreach?',
    cta: 'Share what would make this more useful',
    notes: 'Transparent and discussion-first, with a direct community question.',
    redditRecommendations: {
      engagementSubreddits: [
        {
          name: 'r/startups',
          url: 'https://www.reddit.com/r/startups/',
          reason: 'Founder and operator audience discussing launch workflows, positioning, and early growth.',
          postingGuidance: 'Join product and GTM discussions first; ask for feedback on the launch process rather than posting a bare link.',
        },
        {
          name: 'r/SaaS',
          url: 'https://www.reddit.com/r/SaaS/',
          reason: 'Relevant for SaaS launch messaging, content workflows, and founder growth systems.',
          postingGuidance: 'Lead with lessons, metrics, or a specific question for other SaaS builders.',
        },
        {
          name: 'r/indiehackers',
          url: 'https://www.reddit.com/r/indiehackers/',
          reason: 'Build-in-public readers can react to the product workflow and launch tradeoffs.',
          postingGuidance: 'Share the build story and ask which output builders would trust least.',
        },
      ],
      selfPromotionSubreddits: [
        {
          name: 'r/SideProject',
          url: 'https://www.reddit.com/r/SideProject/',
          reason: 'Common place for makers to share new tools and side projects.',
          postingGuidance: 'Check current rules and flairs; disclose that you built it and ask for concrete feedback.',
        },
        {
          name: 'r/AlphaandBetaUsers',
          url: 'https://www.reddit.com/r/AlphaandBetaUsers/',
          reason: 'Useful for finding early testers who can try the dashboard and critique generated outputs.',
          postingGuidance: 'Be explicit about what is beta, who should test, and what feedback would help.',
        },
        {
          name: 'r/MicroSaas',
          url: 'https://www.reddit.com/r/MicroSaas/',
          reason: 'A fit for lean SaaS tooling and founder-led experiments.',
          postingGuidance: 'Frame it around the niche, build process, and current traction; verify promo rules before linking.',
        },
      ],
    },
  },
  indie_hackers: {
    id: 'indie_hackers',
    label: PLATFORM_LABELS.indie_hackers,
    title: 'I turned my launch checklist into a URL-to-launch-kit workflow',
    body:
      'Launch Kit is my attempt to make launch prep less fragmented.\n\nWhat it does: extracts a product brief from a URL, generates channel-native launch copy, creates a media kit, suggests SEO/blog strategy, and helps organize outreach prospects.\n\nThe opinion: founders should keep one source narrative, then adapt the delivery to each channel instead of rewriting from scratch.\n\nNext experiment: improving the SEO/backlink workflow without making the dashboard feel heavy.',
    cta: 'Follow the build and test the sample kit',
    notes: 'Build-in-public structure with product opinion and next experiment.',
  },
  linkedin: {
    id: 'linkedin',
    label: PLATFORM_LABELS.linkedin,
    title: 'Launch Kit helps founders turn one product URL into a complete launch system',
    body:
      'Launch day should not be eight blank documents and a scattered asset folder.\n\nLaunch Kit extracts one structured product brief, then generates platform-native assets for community launches, social posts, short-form video, email announcements, press packs, SEO planning, and outreach workflows.\n\nThe result: one narrative, adapted to each channel, with exports in the same dashboard.',
    cta: 'Try it on your next product launch',
    notes: 'Professional and systems-oriented for LinkedIn.',
  },
  tiktok: {
    id: 'tiktok',
    label: PLATFORM_LABELS.tiktok,
    title: 'TikTok Script: One URL to launch kit',
    body:
      'Hook (0-2s): Launching should not mean rewriting your story ten times.\nRetention beat (3-7s): I paste one product URL into Launch Kit and it extracts the audience, pains, value props, proof, and CTA.\nStory beat (8-18s): Then it generates Product Hunt, HN, Reddit, LinkedIn, video, email, press, SEO, and outreach assets.\nClose (19-24s): One brief. Every launch channel. Less copy chaos.',
    cta: 'Try Launch Kit with your URL',
    notes: 'Fast visual beats with a clear before/after workflow.',
  },
  youtube_shorts: {
    id: 'youtube_shorts',
    label: PLATFORM_LABELS.youtube_shorts,
    title: 'YouTube Shorts Script: Stop launching from blank pages',
    body:
      'Open: Most product launches start with the same problem: one story, too many channels.\nMiddle: Launch Kit reads your product URL, builds an editable brief, and turns it into launch copy, press assets, SEO strategy, and outreach workflows.\nProof beat: The sample dashboard shows real generated blocks, exports, and SEO/outreach controls.\nEnd: Start with one URL. Leave with a launch kit.',
    cta: 'Open the sample Launch Kit dashboard',
    notes: 'Narrative rhythm designed for a concise product walkthrough.',
  },
  email_announcement: {
    id: 'email_announcement',
    label: PLATFORM_LABELS.email_announcement,
    title: 'Subject: Launch Kit turns one URL into your full launch system',
    body:
      'Hi there,\n\nLaunch Kit is built for founders who want launch day to feel organized instead of fragmented.\n\nPaste your product URL, confirm the extracted brief, then generate launch-ready assets for Product Hunt, HN, Reddit, Indie Hackers, LinkedIn, short-form video, email, press, SEO, and outreach.\n\nIf you usually rewrite the same story channel by channel, this gives you one narrative system and a real dashboard to work from.',
    cta: 'Try Launch Kit with your product URL',
    notes: 'Clear value summary with workflow and low-friction CTA.',
  },
}

function buildDemoSeoGrowth(): SeoGrowthState {
  return {
    websiteAnalysis: {
      generatedAt: DEMO_TIMESTAMP,
      score: 94,
      summary:
        'Launch Kit has clear category positioning, strong workflow language, and enough structured output examples to support launch-focused SEO and LLM answer visibility.',
      strengths: [
        'Clear product category: launch kit generator for founders',
        'Specific workflow language around URL extraction, channel outputs, media kits, SEO, and outreach',
        'Strong comparison-ready framing: one source narrative adapted to each channel',
      ],
      fixes: [
        'Publish comparison pages for alternatives, templates, and launch workflows',
        'Add concrete screenshots and examples for each generated channel',
        'Create FAQ sections that answer pricing, setup, export, and channel quality questions directly',
      ],
      checks: [
        {
          id: 'demo-seo-keywords',
          label: 'Keyword coverage',
          status: 'pass',
          detail: 'Commercial and informational clusters cover launch kits, channel copy, SEO, and outreach.',
        },
        {
          id: 'demo-seo-proof',
          label: 'Proof signals',
          status: 'pass',
          detail: 'The dashboard itself demonstrates the generated outputs and exports.',
        },
        {
          id: 'demo-seo-llm',
          label: 'LLM answer readiness',
          status: 'pass',
          detail: 'The product has direct entity statements, feature lists, and answer-friendly workflow language.',
        },
      ],
      llmReadinessNotes: [
        'Use direct answer blocks that define Launch Kit in one or two sentences.',
        'Add tables comparing channel expectations and generated output types.',
        'Keep product naming consistent across page titles, headings, examples, and CTAs.',
      ],
    },
    blogStrategy: [
      {
        id: 'demo-blog-1',
        dayOffset: 0,
        keywordClusterId: 'cluster-launch-kit-generator',
        keywordTopic: 'Launch kit generator',
        title: 'What Is a Product Launch Kit? A Practical Guide for SaaS Founders',
        intent: 'informational',
        targetKeywords: ['product launch kit', 'launch kit generator', 'startup launch content generator'],
        tableIdeas: [
          'Launch asset, purpose, channel, owner',
          'Manual workflow vs. Launch Kit workflow',
        ],
        outline: [
          'Direct definition of a product launch kit',
          'Core assets founders need before launch day',
          'How one URL becomes a reusable source brief',
          'Checklist for publishing and exporting assets',
        ],
        llmNotes: [
          'Open with a concise answer block.',
          'Include a table of launch assets by channel.',
        ],
        cta: 'Try Launch Kit with your product URL',
      },
      {
        id: 'demo-blog-2',
        dayOffset: 4,
        keywordClusterId: 'cluster-channel-launch-copy',
        keywordTopic: 'Channel-specific launch copy',
        title: 'How to Rewrite One Product Story for Product Hunt, HN, Reddit, and LinkedIn',
        intent: 'informational',
        targetKeywords: ['product hunt launch copy', 'hacker news launch post', 'reddit launch post'],
        tableIdeas: [
          'Channel, expected tone, what to avoid, best CTA',
          'Original product message vs. adapted channel draft',
        ],
        outline: [
          'Why one generic announcement underperforms',
          'Social contract differences by platform',
          'Rewrite examples from one Launch Kit brief',
          'Quality checks before posting',
        ],
        llmNotes: [
          'Use descriptive H2s for each platform.',
          'Add concrete examples rather than abstract advice.',
        ],
        cta: 'Open the sample Launch Kit dashboard',
      },
      {
        id: 'demo-blog-3',
        dayOffset: 8,
        keywordClusterId: 'cluster-launch-seo',
        keywordTopic: 'SEO strategy for product launches',
        title: 'A 4-Day Blog Cadence for Product Launch SEO',
        intent: 'commercial',
        targetKeywords: ['product launch SEO strategy', 'startup blog strategy', 'SEO launch checklist'],
        tableIdeas: [
          'Publish day, target keyword, intent, CTA',
          'Post type, table idea, LLM-friendly section',
        ],
        outline: [
          'Why SEO should start before launch day',
          'Choosing clusters from the product brief',
          'Publishing every four days without filler',
          'Pairing posts with backlink outreach',
        ],
        llmNotes: [
          'Include a cadence table.',
          'Answer common launch SEO questions directly.',
        ],
        cta: 'Generate a launch SEO plan',
      },
    ],
    freeTools: [
      {
        id: 'demo-tool-search-console',
        category: 'Indexing',
        title: 'Google Search Console',
        url: 'https://search.google.com/search-console',
        workflow: 'Verify the app domain, submit the sitemap, and monitor launch keyword impressions.',
      },
      {
        id: 'demo-tool-pagespeed',
        category: 'Technical SEO',
        title: 'PageSpeed Insights',
        url: 'https://pagespeed.web.dev',
        workflow: 'Test the landing page and dashboard demo before launch announcements drive traffic.',
      },
      {
        id: 'demo-tool-rich-results',
        category: 'Structured Data',
        title: 'Rich Results Test',
        url: 'https://search.google.com/test/rich-results',
        workflow: 'Validate article, FAQ, and product markup for SEO pages created from the blog strategy.',
      },
    ],
    backlinkProspects: [
      {
        id: 'demo-backlink-saasworthy',
        website: 'https://www.saasworthy.com',
        domain: 'saasworthy.com',
        title: 'SaaS Worthy',
        contactName: 'Listings Team',
        contactEmail: 'partners@saasworthy.com',
        scrapedSummary: 'SaaS comparison directory with product categories and software listing pages.',
        relevanceReason:
          'Launch Kit fits a product launch, marketing workflow, and founder tooling category.',
        backlinkAngle: 'Directory listing for launch copy and founder marketing workflows',
        costToList: null,
        estimatedTraffic: 140000,
        relevanceScore: 88,
        trafficScore: 93,
        authorityScore: 76,
        contactabilityScore: 90,
        costScore: 50,
        valueScore: 83,
        status: 'first_contact',
        listIds: ['demo-list-high-value'],
        customizedEmailSubject: 'Launch Kit for SaaS Worthy',
        customizedEmailBody:
          'Hi Listings Team,\n\nI came across SaaS Worthy while researching launch and marketing workflow directories. Launch Kit helps founders turn one product URL into channel-ready launch assets, press kits, SEO strategy, and outreach workflows.\n\nThe most relevant angle for your readers is a launch copy and founder marketing workflow listing.\n\nIf useful, I can send a concise listing blurb, screenshots, and category details.',
        source: 'demo-seed',
        discoveredAt: DEMO_TIMESTAMP,
        lastContactedAt: DEMO_TIMESTAMP,
      },
      {
        id: 'demo-backlink-growthmentor',
        website: 'https://www.growthmentor.com/blog',
        domain: 'growthmentor.com',
        title: 'GrowthMentor Blog',
        contactName: 'Content Team',
        contactEmail: 'content@growthmentor.com',
        scrapedSummary: 'Growth and marketing blog covering acquisition, SEO, and startup workflows.',
        relevanceReason:
          'Launch Kit can contribute a practical launch workflow article with SEO and outreach examples.',
        backlinkAngle: 'Guest post on turning launch messaging into a repeatable growth workflow',
        costToList: null,
        estimatedTraffic: 74000,
        relevanceScore: 84,
        trafficScore: 88,
        authorityScore: 70,
        contactabilityScore: 90,
        costScore: 50,
        valueScore: 79,
        status: 'new',
        listIds: ['demo-list-high-value'],
        customizedEmailSubject: 'Practical launch workflow idea for GrowthMentor',
        customizedEmailBody:
          'Hi Content Team,\n\nI found GrowthMentor while researching startup growth workflows. Launch Kit turns one product URL into launch assets, SEO content strategy, and outreach controls for lean teams.\n\nA practical guest article could show how founders adapt one product story for Product Hunt, HN, Reddit, LinkedIn, SEO, and backlinks.\n\nHappy to send a tight outline.',
        source: 'demo-seed',
        discoveredAt: DEMO_TIMESTAMP,
        lastContactedAt: '',
      },
    ],
    prospectLists: [
      {
        id: 'demo-list-high-value',
        name: 'High value launch backlinks',
        description: 'Best-fit publications and directories for launch-focused backlinks.',
        prospectIds: ['demo-backlink-saasworthy', 'demo-backlink-growthmentor'],
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
      },
    ],
    backlinkEmailJobs: [
      {
        id: 'demo-backlink-email-job-1',
        status: 'completed',
        prospectIds: ['demo-backlink-saasworthy'],
        subject: 'Launch Kit for SaaS Worthy',
        bodyPreview:
          'I came across SaaS Worthy while researching launch and marketing workflow directories. Launch Kit helps founders turn one product URL into channel-ready launch assets...',
        createdAt: DEMO_TIMESTAMP,
        completedAt: DEMO_TIMESTAMP,
      },
    ],
    lastAnalyzedAt: DEMO_TIMESTAMP,
    lastBlogStrategyAt: DEMO_TIMESTAMP,
    lastBacklinkScrapeAt: DEMO_TIMESTAMP,
    lastBacklinkEmailAt: DEMO_TIMESTAMP,
  }
}

function buildDemoKit(sourceUrl: string): LaunchKit {
  return {
    generatedAt: DEMO_TIMESTAMP,
    language: 'en',
    platformBlocks: DEMO_BLOCKS,
    mediaKit: {
      founderCompanyBio:
        'Launch Kit is built for founders and small teams that need a practical launch workflow without assembling copy docs, media assets, SEO planning, and outreach tools by hand.',
      productOneLiner:
        'Launch Kit turns one product URL into platform-tailored launch content, a media kit, SEO strategy, and outreach controls.',
      boilerplate:
        'Launch Kit is a launch-content and growth workspace for founders and lean startup teams. It extracts a structured brief from a product URL, generates channel-native launch copy, creates press-ready assets, and supports SEO and outreach planning from the same source narrative.',
      pressRelease:
        'Launch Kit today introduced a guided workflow that converts a single product URL into a complete multi-channel launch system. The app generates platform-specific copy for Product Hunt, Hacker News, Reddit, Indie Hackers, LinkedIn, short-form video, and email, plus a media kit, SEO blog strategy, backlink prospecting, and exportable launch materials.',
      keyVisualsChecklist: [
        'Dashboard screenshot with generated output tabs',
        'Brief extraction and editing workflow',
        'SEO and backlink workspace screenshot',
        'Press pack export preview',
        'Logo and social preview image',
        'Example launch channel collage',
      ],
      screenshotsAndLogos:
        'Use dashboard screenshots, output tab previews, SEO workspace captures, and the Launch Kit sparkle mark for launch submissions and press coverage.',
      contactDetails:
        `Website: ${sourceUrl}\nContact details: Not detected in the source website evidence.`,
    },
    assetLibrary: {
      templates: DEFAULT_LAUNCH_ASSET_TEMPLATES,
      generatedAssets: [],
    },
    growthAssets: {
      generatedAt: DEMO_TIMESTAMP,
      linkedinOutreach: {
        channel: 'linkedin',
        notes: 'Use concise workflow framing with a founder-to-founder tone.',
        personalizationTemplate:
          'Hi {{firstName}} - noticed {{company}} is preparing launches in {{category}}. Launch Kit turns one product URL into channel-ready launch assets.',
        variants: [
          {
            id: 'linkedin-v1',
            title: 'Founder workflow',
            message:
              'Hi {{firstName}}, Launch Kit helps founders turn one product URL into Product Hunt, HN, Reddit, LinkedIn, video, email, press, SEO, and outreach assets from one brief.',
            cta: 'Want a sample kit for your product page?',
          },
          {
            id: 'linkedin-v2',
            title: 'Launch prep pain',
            message:
              'Most teams lose time rewriting the same launch story for every channel. Launch Kit keeps one source narrative and adapts it to each platform.',
            cta: 'Open to a quick walkthrough?',
          },
          {
            id: 'linkedin-v3',
            title: 'Growth workflow angle',
            message:
              'Launch Kit now combines launch copy, press assets, SEO strategy, backlink prospecting, and simulated outreach controls in one dashboard.',
            cta: 'Should I send the sample dashboard?',
          },
        ],
      },
      xOutreach: {
        channel: 'x',
        notes: 'Short, direct founder DM style.',
        personalizationTemplate:
          'Hey {{firstName}} - Launch Kit turns one URL into launch copy, media assets, SEO strategy, and outreach workflows.',
        variants: [
          {
            id: 'x-v1',
            title: 'Direct DM',
            message:
              'Hey {{firstName}} - if launch prep keeps turning into copy chaos, Launch Kit turns one URL into channel-ready launch assets.',
            cta: 'Want a sample run?',
          },
          {
            id: 'x-v2',
            title: 'Demo angle',
            message:
              'I made the sample dashboard self-hosted: Product Hunt, HN, Reddit, LinkedIn, video, email, press, SEO, and backlinks from one Launch Kit brief.',
            cta: 'Want the link?',
          },
          {
            id: 'x-v3',
            title: 'Outcome angle',
            message:
              'One product URL -> one editable brief -> every launch channel and growth asset. That is the Launch Kit workflow.',
            cta: 'Can I run it on your product page?',
          },
        ],
      },
      emailOutreach: {
        channel: 'email',
        notes: 'Personalized first line plus a concrete sample-dashboard ask.',
        personalizationTemplate:
          'Subject: Quick launch workflow idea for {{company}}\n\nHi {{firstName}},\n\nSaw what you are building at {{company}}.',
        variants: [
          {
            id: 'email-v1',
            title: 'Concise intro',
            subject: 'One URL to a complete launch kit',
            message:
              'Hi {{firstName}},\n\nLaunch Kit helps founders generate Product Hunt, HN, Reddit, LinkedIn, video, email, press, SEO, and outreach assets from one product URL.',
            cta: 'Want me to generate a sample kit for your product page?',
          },
          {
            id: 'email-v2',
            title: 'Pain-point opener',
            subject: 'If launch copy is slowing the release',
            message:
              'Hi {{firstName}},\n\nMany teams lose momentum rewriting the same product story for every channel. Launch Kit extracts one brief, then adapts copy and growth assets for each destination.',
            cta: 'Open to a quick walkthrough this week?',
          },
          {
            id: 'email-v3',
            title: 'SEO growth opener',
            subject: 'Launch content plus SEO/backlink planning',
            message:
              'Hi {{firstName}},\n\nLaunch Kit pairs launch-channel copy with SEO analysis, blog strategy, backlink prospects, and simulated outreach controls so the launch story can keep compounding after launch day.',
            cta: 'Should I send the sample dashboard?',
          },
        ],
      },
      seoPostPacks: [
        {
          id: 'seo-pack-1',
          keywordClusterId: 'cluster-launch-kit-generator',
          keywordTopic: 'Launch kit generator',
          title: 'What Is a Product Launch Kit? A Practical Guide for Founders',
          metaDescription:
            'Learn what belongs in a product launch kit and how Launch Kit creates channel-ready assets from one product URL.',
          outline: [
            'What a product launch kit includes',
            'Why one source brief matters',
            'Channel-specific assets founders need',
            'How to export and reuse the kit',
          ],
          draft:
            'A product launch kit is the working set of copy, media, SEO, and outreach assets a team needs before announcing a product. Launch Kit builds that system from one URL and one editable brief.',
          cta: 'Try Launch Kit with your product URL.',
        },
        {
          id: 'seo-pack-2',
          keywordClusterId: 'cluster-channel-launch-copy',
          keywordTopic: 'Channel-specific launch copy',
          title: 'How to Adapt One Product Launch Story for Every Channel',
          metaDescription:
            'A practical guide to rewriting one product narrative for Product Hunt, HN, Reddit, LinkedIn, video, email, and press.',
          outline: [
            'Why generic launch copy underperforms',
            'Social contracts by channel',
            'Examples from the same source brief',
            'Final review checklist',
          ],
          draft:
            'Each launch channel rewards a different style. Launch Kit keeps the product story consistent while changing the structure, tone, proof, and CTA for each destination.',
          cta: 'Open the sample Launch Kit dashboard.',
        },
      ],
      followUpSequences: [
        {
          day: 'Day 0',
          message: 'Share the sample dashboard and the specific launch workflow angle.',
        },
        {
          day: 'Day 3',
          message: 'Follow up with one proof point and a generated sample block.',
        },
        {
          day: 'Day 7',
          message: 'Close with a lighter ask: run Launch Kit on their product URL.',
        },
      ],
    },
    prospecting: {
      queryHints: [
        'launch kit generator for founders',
        'product launch workflow for indie hackers',
        'startup launch content tools',
      ],
      leads: [],
      personalizedOutreach: [],
      actionRuns: [],
      emailJobs: [],
      lastScrapeAt: '',
      lastEmailBuildAt: '',
    },
    seoGrowth: buildDemoSeoGrowth(),
  }
}

export const DEMO_KIT: LaunchKit = buildDemoKit(DEMO_SOURCE_URL)

export function createDemoSnapshot(sourceUrl = DEMO_SOURCE_URL): LaunchProjectSnapshot {
  const brief = buildDemoBrief(sourceUrl)
  const kit = buildDemoKit(sourceUrl)

  return {
    id: 'demo-launch-kit',
    name: 'Launch Kit Sample Project',
    sourceUrl,
    language: brief.language,
    brief,
    kit,
    createdAt: DEMO_TIMESTAMP,
    updatedAt: DEMO_TIMESTAMP,
  }
}

export function getDemoPreviewBlocks(): PlatformBlock[] {
  const previewOrder: PlatformBlockId[] = [
    'hacker_news',
    'reddit',
    'linkedin',
    'tiktok',
  ]

  return previewOrder.map((blockId) => DEMO_KIT.platformBlocks[blockId])
}

export function getDemoBlockIds(): PlatformBlockId[] {
  return [...PLATFORM_IDS]
}
