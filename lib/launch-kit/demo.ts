import {
  PLATFORM_IDS,
  PLATFORM_LABELS,
  type ExtractedBrief,
  type LaunchKit,
  type LaunchProjectSnapshot,
  type PlatformBlock,
  type PlatformBlockId,
} from '@/lib/launch-kit/types'

export const DEMO_SOURCE_URL = 'https://loopcue.app'

export const DEMO_BRIEF: ExtractedBrief = {
  sourceUrl: DEMO_SOURCE_URL,
  productName: 'LoopCue',
  positioning:
    'LoopCue helps solo SaaS founders turn one product URL into launch-ready copy for every channel in under 20 minutes.',
  targetUsers: [
    'Solo SaaS founders launching without a marketing team',
    'Indie hackers shipping weekly product updates',
    'Small startup teams coordinating multi-channel launches',
  ],
  icp:
    'Founders and small product teams with limited marketing bandwidth who launch often and need channel-specific messaging quickly.',
  painPoints: [
    'Rewriting the same launch story 8 to 10 times for different platforms',
    'Sounding too promotional on Hacker News or too dry on social channels',
    'Losing launch-day momentum because copy and media assets live in different places',
  ],
  valueProps: [
    'Extracts a structured launch brief from one URL and core notes',
    'Generates platform-native posts aligned to each channel social contract',
    'Builds a press-ready media kit in the same flow with exportable assets',
  ],
  keyClaims: [
    'From URL to full launch kit in minutes',
    'Platform voice constraints baked into every output block',
    'One-click markdown export plus print-ready press pack output',
  ],
  proofPoints: [
    'Beta founders reduced launch prep from half-day sessions to under 30 minutes',
    'Produces 8 channel blocks plus a complete media kit from one brief',
    'Per-block regenerate controls help teams tighten weak drafts quickly',
  ],
  cta: 'Try Launch Kit with your product URL',
  language: 'en',
  sourceHighlights: [
    'One URL becomes channel-specific launch copy and a media kit.',
    'Each platform receives a tailored voice, not a recycled post.',
    'Export markdown and open a print-friendly press pack page.',
  ],
  detectedImageUrls: [
    'https://loopcue.app/og/brief-preview.png',
    'https://loopcue.app/og/launch-cards.png',
  ],
  crawlPages: [
    'https://loopcue.app',
    'https://loopcue.app/features',
    'https://loopcue.app/pricing',
    'https://loopcue.app/press',
  ],
  keywordResearch: {
    generatedAt: '2026-05-21T08:00:00.000Z',
    notes: 'Clustered from launch narrative and ICP cues.',
    clusters: [
      {
        id: 'cluster-launch-copy',
        topic: 'Launch copy generator',
        intent: 'commercial',
        priority: 'high',
        keywords: ['launch copy generator', 'product launch copy', 'launch day content'],
        contentAngles: [
          'How founders reduce launch-day writing overhead',
          'Channel-specific launch storytelling patterns',
        ],
      },
      {
        id: 'cluster-platform-voice',
        topic: 'Platform-specific launch messaging',
        intent: 'informational',
        priority: 'high',
        keywords: ['hacker news launch post', 'reddit launch post', 'indie hackers launch strategy'],
        contentAngles: [
          'Why each launch community has a different social contract',
          'Examples of voice adaptation by platform',
        ],
      },
      {
        id: 'cluster-press-kit',
        topic: 'Media kit for startup launch',
        intent: 'commercial',
        priority: 'medium',
        keywords: ['startup media kit template', 'press pack for product launch', 'launch press release kit'],
        contentAngles: [
          'What journalists need in a launch-ready press pack',
          'Checklist for visuals, logos, and contacts',
        ],
      },
    ],
  },
}

const DEMO_BLOCKS: Record<PlatformBlockId, PlatformBlock> = {
  product_hunt: {
    id: 'product_hunt',
    label: PLATFORM_LABELS.product_hunt,
    title: 'LoopCue - Launch once, speak every platform language',
    body:
      'LoopCue converts one product URL into launch-ready copy for Product Hunt, HN, Reddit, LinkedIn, and short-form video scripts.\n\nInstead of rewriting your launch story all day, you review one brief, tune it, and export your full launch kit in markdown.',
    cta: 'See our Product Hunt launch draft',
    notes: 'Outcome-led, maker-friendly tone with clear workflow proof.',
  },
  hacker_news: {
    id: 'hacker_news',
    label: PLATFORM_LABELS.hacker_news,
    title: 'Show HN: LoopCue - URL to launch kit for indie founders',
    body:
      'I built LoopCue after burning too many launch days rewriting copy channel by channel.\n\nCurrent flow: paste a URL, edit extracted ICP/pains/value props, then generate HN/Reddit/LinkedIn/video/email drafts and a media kit.\n\nWould appreciate blunt feedback on the extraction quality and the HN voice settings.',
    cta: 'Try it and roast the output quality',
    notes: 'Humble technical framing, invites critique, avoids hype words.',
  },
  reddit: {
    id: 'reddit',
    label: PLATFORM_LABELS.reddit,
    title: 'Built a launch copy tool that adapts to each platform voice',
    body:
      'I kept running into the same launch problem: one product story, totally different social norms per community.\n\nLoopCue takes a URL and builds drafts tuned for each platform style, plus a media kit for press outreach.\n\nIf you launch often, what part of this workflow would you trust least?',
    cta: 'Share your honest feedback',
    notes: 'Conversation-first, transparency, direct question for comments.',
  },
  indie_hackers: {
    id: 'indie_hackers',
    label: PLATFORM_LABELS.indie_hackers,
    title: 'How I stopped launch-day copy thrash with one structured brief',
    body:
      'Today I launched LoopCue.\n\nProblem: I was rewriting identical launch context for every channel.\nWhat changed: now I lock one brief (ICP, pains, value props, proof, CTA) then generate per-platform drafts.\nEarly signal: beta users report cutting launch prep from half-day to under 30 minutes.\n\nNext milestone: improve extraction on sparse landing pages.',
    cta: 'Follow the build-in-public updates',
    notes: 'Build-in-public structure: problem, change, signal, next step.',
  },
  linkedin: {
    id: 'linkedin',
    label: PLATFORM_LABELS.linkedin,
    title: 'Launch Kit now turns one URL into a complete cross-platform launch narrative',
    body:
      'Founders do not need more blank pages on launch day.\n\nLaunch Kit helps teams extract a clear brief from one product URL and translate it into channel-native messaging for Product Hunt, HN, Reddit, Indie Hackers, LinkedIn, and short-form video.\n\nResult: faster launches, tighter positioning, and fewer context-switching mistakes.',
    cta: 'Try it on your next launch',
    notes: 'Professional and outcome-oriented while staying human.',
  },
  tiktok: {
    id: 'tiktok',
    label: PLATFORM_LABELS.tiktok,
    title: 'TikTok Script: From URL to launch kit in 20 minutes',
    body:
      'Hook (0-2s): Still rewriting launch posts for every app?\nRetention beat (3-7s): I paste one URL into Launch Kit and it extracts my ICP, pains, value props, and proof points.\nStory beat (8-18s): Then it drafts channel-specific posts for HN, Reddit, LinkedIn, and even short-form scripts.\nClose (19-24s): One brief. Many voices. No launch-day copy chaos.',
    cta: 'Try with your URL and compare outputs',
    notes: 'Short high-contrast beats with an explicit hook and close.',
  },
  youtube_shorts: {
    id: 'youtube_shorts',
    label: PLATFORM_LABELS.youtube_shorts,
    title: 'YouTube Shorts Script: The anti-copy-chaos launch workflow',
    body:
      'Open: Your product story is one thing, but each platform expects a different tone.\nMiddle: Launch Kit ingests your URL, builds a structured brief, and outputs platform-native drafts plus a media kit.\nProof beat: Founders in beta cut launch prep from hours to under 30 minutes.\nEnd: Ship faster without sounding generic everywhere.',
    cta: 'Generate your own launch kit',
    notes: 'Narrative rhythm designed for 20-30 second delivery.',
  },
  email_announcement: {
    id: 'email_announcement',
    label: PLATFORM_LABELS.email_announcement,
    title: 'Subject: One URL. Complete launch kit.',
    body:
      'Hi there,\n\nWe built Launch Kit for founders who want to launch without spending the day rewriting copy.\n\nPaste your product URL, confirm the extracted brief, and generate channel-ready drafts for Product Hunt, HN, Reddit, Indie Hackers, LinkedIn, TikTok, YouTube Shorts, and email, plus a media kit for press.\n\nIf launch day usually feels fragmented, this gives you one clear narrative system.',
    cta: 'Try Launch Kit with your URL',
    notes: 'Clear value summary with a practical workflow and direct CTA.',
  },
}

export const DEMO_KIT: LaunchKit = {
  generatedAt: '2026-05-21T08:00:00.000Z',
  language: 'en',
  platformBlocks: DEMO_BLOCKS,
  mediaKit: {
    founderCompanyBio:
      'Luca Rinaldi is the founder of LoopCue, a lean launch-ops tool for founders shipping without a full marketing team. LoopCue helps teams keep one message while adapting tone across communities.',
    productOneLiner:
      'Launch Kit turns one product URL into platform-tailored launch content and a complete media kit.',
    boilerplate:
      'Launch Kit is a launch-content generator for founders and small teams. It extracts a structured brief from a product URL, generates channel-native launch copy, and produces press-ready media assets from the same source narrative.',
    pressRelease:
      'Launch Kit today announced its public launch, introducing a result-first workflow that converts a single product URL into channel-specific launch assets for Product Hunt, Hacker News, Reddit, Indie Hackers, LinkedIn, short-form video, and email. The product also includes a built-in media kit creator for journalists and partners.',
    keyVisualsChecklist: [
      'Product UI hero screenshot (desktop)',
      'Brief extraction screen capture',
      'Platform output card collage',
      'Founder headshot and short bio',
      'Logo pack (SVG + PNG, light and dark)',
      'Social preview image (1200x630)',
    ],
    screenshotsAndLogos:
      'Include 3 to 5 annotated screenshots, transparent logo files, and one square icon for listing platforms. Name files consistently for media reuse.',
    contactDetails:
      'Press contact: Luca Rinaldi\nEmail: press@loopcue.app\nWebsite: https://loopcue.app\nLinkedIn: linkedin.com/in/lucarinaldi',
  },
  growthAssets: {
    generatedAt: '2026-05-21T08:00:00.000Z',
    linkedinOutreach: {
      channel: 'linkedin',
      notes: 'Use proof-first framing and a short direct ask.',
      personalizationTemplate:
        'Hi {{firstName}} - saw {{company}} is shipping in {{category}}. We built Launch Kit for teams who need one story adapted across Product Hunt, HN, Reddit, and LinkedIn.',
      variants: [
        {
          id: 'linkedin-v1',
          title: 'Founder-to-founder',
          message:
            'Hi {{firstName}}, we built Launch Kit to turn one product URL into platform-specific launch copy. Curious if this would help your next launch sprint.',
          cta: 'Open to a 10-minute walkthrough?',
        },
        {
          id: 'linkedin-v2',
          title: 'Problem-led',
          message:
            'Most teams lose launch-day momentum rewriting posts for every channel. Launch Kit extracts one brief and drafts tailored copy for each platform voice.',
          cta: 'Want me to send a sample kit?',
        },
        {
          id: 'linkedin-v3',
          title: 'Proof-led',
          message:
            'Beta founders are using Launch Kit to cut launch prep from hours to under 30 minutes by keeping one source narrative and adapting delivery per channel.',
          cta: 'Should I generate one for your current launch?',
        },
      ],
    },
    xOutreach: {
      channel: 'x',
      notes: 'Short, punchy, conversational.',
      personalizationTemplate:
        'Hey {{firstName}} - noticed {{company}} is building in public. Launch Kit turns one product URL into launch-ready copy for HN, Reddit, LinkedIn + more.',
      variants: [
        {
          id: 'x-v1',
          title: 'Direct DM',
          message:
            'Hey {{firstName}} - if launch copy keeps eating your day, we built Launch Kit to generate platform-tailored drafts from one URL.',
          cta: 'Want a sample run?',
        },
        {
          id: 'x-v2',
          title: 'Build-in-public angle',
          message:
            'Made something for builders who launch in public: one brief in, HN/Reddit/LinkedIn/TikTok copy out + press kit.',
          cta: 'Can I run it on your product page?',
        },
        {
          id: 'x-v3',
          title: 'Outcome angle',
          message:
            'Founders are using Launch Kit to skip channel-by-channel rewrites and keep their launch story consistent.',
          cta: 'Want the workflow?',
        },
      ],
    },
    emailOutreach: {
      channel: 'email',
      notes: 'Personalized first line + concise value proof.',
      personalizationTemplate:
        'Subject: Quick idea for {{company}} launch workflow\n\nHi {{firstName}},\n\nSaw what you are building at {{company}}.',
      variants: [
        {
          id: 'email-v1',
          title: 'Concise intro',
          subject: 'One URL to full launch kit',
          message:
            'Hi {{firstName}},\n\nWe built Launch Kit to help founders generate platform-specific launch copy from one product URL. Teams use it for Product Hunt, HN, Reddit, LinkedIn, short-form video, and media kits.',
          cta: 'Want me to generate a sample kit for your current product page?',
        },
        {
          id: 'email-v2',
          title: 'Pain-point opener',
          subject: 'If launch copy is slowing your release',
          message:
            'Hi {{firstName}},\n\nMany teams lose launch momentum rewriting the same story for different platforms. Launch Kit extracts one structured brief, then drafts each channel in its native voice.',
          cta: 'Open to a quick walkthrough this week?',
        },
        {
          id: 'email-v3',
          title: 'Proof-led opener',
          subject: 'How founders cut launch prep time',
          message:
            'Hi {{firstName}},\n\nEarly users report cutting launch prep to under 30 minutes by centralizing their narrative in Launch Kit, then regenerating per platform as needed.',
          cta: 'Should I send over a sample output?',
        },
      ],
    },
    seoPostPacks: [
      {
        id: 'seo-pack-1',
        keywordClusterId: 'cluster-launch-copy',
        keywordTopic: 'Launch copy generator',
        title: 'How to Generate Launch Copy for Every Platform from One Source Brief',
        metaDescription:
          'Learn a repeatable launch workflow to create Product Hunt, HN, Reddit, LinkedIn, and email copy from one product narrative.',
        outline: [
          'Why launch-day copy gets fragmented',
          'The source-brief method',
          'Adapting tone for each platform',
          'Checklist before you publish',
        ],
        draft:
          'Launching a product is rarely blocked by product work. It is blocked by distribution friction. The source-brief method solves that by translating one narrative into multiple platform-native outputs.',
        cta: 'Try Launch Kit with your product URL.',
      },
      {
        id: 'seo-pack-2',
        keywordClusterId: 'cluster-platform-voice',
        keywordTopic: 'Platform-specific launch messaging',
        title: 'Platform Social Contracts: Writing Better Launch Posts for HN, Reddit, and LinkedIn',
        metaDescription:
          'A practical guide to adapting launch messages to each platform social contract without losing product clarity.',
        outline: [
          'What social contract means in launch contexts',
          'HN humility vs Reddit transparency',
          'LinkedIn outcome framing',
          'Examples and rewrite patterns',
        ],
        draft:
          'Each launch channel rewards a different style. The teams that win distribution are not louder, they are better adapted to community expectations.',
        cta: 'Generate your own platform-specific launch kit.',
      },
    ],
    followUpSequences: [
      {
        day: 'Day 0',
        message: 'Quick intro with clear value prop and one ask.',
      },
      {
        day: 'Day 3',
        message: 'Follow-up with proof point and short recap.',
      },
      {
        day: 'Day 7',
        message: 'Final follow-up with alternate CTA and soft close.',
      },
    ],
  },
  prospecting: {
    queryHints: ['launch copy generator for founders', 'product launch workflow for indie hackers'],
    leads: [],
    personalizedOutreach: [],
    actionRuns: [],
    emailJobs: [],
    lastScrapeAt: '',
    lastEmailBuildAt: '',
  },
}

export function createDemoSnapshot(): LaunchProjectSnapshot {
  return {
    id: 'demo-loopcue',
    name: 'LoopCue Sample Launch',
    sourceUrl: DEMO_BRIEF.sourceUrl,
    language: DEMO_BRIEF.language,
    brief: DEMO_BRIEF,
    kit: DEMO_KIT,
    createdAt: '2026-05-21T08:00:00.000Z',
    updatedAt: '2026-05-21T08:00:00.000Z',
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
