import {
  CHANNEL_PACK_LABELS,
  DEFAULT_LAUNCH_ASSET_TEMPLATES,
  PLATFORM_IDS,
  PLATFORM_LABELS,
  type ChannelCard,
  type ChannelCardStage,
  type ChannelPack,
  type ChannelPackId,
  type ExtractedBrief,
  type LaunchKit,
  type LaunchProjectSnapshot,
  type PlatformBlock,
  type PlatformBlockId,
  type SeoGrowthState,
} from '@/lib/launch-kit/types'

const LOCAL_DEMO_SOURCE_URL = 'http://localhost:3000'

export function getDemoSourceUrl(value = process.env.NEXT_PUBLIC_APP_URL): string {
  try {
    const url = new URL(value || LOCAL_DEMO_SOURCE_URL)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return LOCAL_DEMO_SOURCE_URL
    }
    return url.origin
  } catch {
    return LOCAL_DEMO_SOURCE_URL
  }
}

export const DEMO_SOURCE_URL = getDemoSourceUrl()
const DEMO_TIMESTAMP = '2026-05-21T08:00:00.000Z'

function buildDemoBrief(sourceUrl: string): ExtractedBrief {
  return {
    sourceUrl,
    productName: 'Launch Kit',
    positioning:
      'Launch Kit turns one product URL into focused launch copy, subreddit guidance, an email announcement, and a lightweight media kit, with Premium growth work available from the same brief.',
    targetUsers: [
      'Solo SaaS founders preparing a public launch',
      'Indie hackers shipping frequent product updates',
      'Small startup teams coordinating launch copy, email, and press basics',
    ],
    icp:
      'Founders and lean product teams who need a repeatable launch workflow that keeps one narrative consistent while adapting delivery across launch communities and social channels.',
    painPoints: [
      'Rewriting the same product story for every launch channel',
      'Losing voice quality when one generic post is reused everywhere',
      'Scattering launch copy, subreddit research, email drafts, and press basics across too many tabs',
    ],
    valueProps: [
      'Extracts an editable product brief from one URL',
      'Generates core launch copy for Product Hunt, HN, Reddit, X, LinkedIn, Indie Hackers, and email',
      'Keeps copy blocks, markdown export, and press pack export in one focused dashboard',
    ],
    keyClaims: [
      'One URL becomes a useful free launch kit',
      'Every output respects the social contract of its destination channel',
      'Premium unlocks SEO, backlinks, outreach, product demo beats, and creative assets from the same brief',
    ],
    proofPoints: [
      'Generates core launch channels plus a lightweight media kit from one structured brief',
      'Includes per-tab regenerate controls, markdown export, and print-ready press pack output',
      'Ships with zero-config fallbacks so a fresh clone can demo the workflow without external services',
    ],
    voiceGuide:
      'Use a founder-to-founder voice that is sharp, practical, and candid about launch work. Keep the writing specific to the channel, avoid generic AI phrases and inflated proof, and make every output feel like it was written by someone who understands each community.',
    cta: 'Try Launch Kit with your product URL',
    language: 'en',
    sourceHighlights: [
      'One URL, one focused launch kit.',
      'Review generated content, regenerate tabs, and export your kit.',
      'Premium growth surfaces stay separate until the launch story is clear.',
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

function demoCard(
  id: string,
  stage: ChannelCardStage,
  format: string,
  title: string,
  body: string,
  cta: string,
  socialContractNote: string,
  proofPoint = 'Launch Kit demo generates core launch copy, subreddit guidance, and media kit assets from one source brief.',
): ChannelCard {
  return {
    id,
    stage,
    format,
    title,
    body,
    cta,
    proofPoint,
    socialContractNote,
    qualityChecks: [
      'Use only sourced proof or clearly mark proof to add.',
      'Keep the founder role transparent.',
      'Avoid fake metrics and generic launch hype.',
    ],
  }
}

const DEMO_BLOCKS: Record<PlatformBlockId, PlatformBlock> = {
  product_hunt: {
    id: 'product_hunt',
    label: PLATFORM_LABELS.product_hunt,
    title: 'Launch Kit - One URL to a focused launch kit',
    body:
      'Launch Kit turns one product URL into the launch work founders need first: Product Hunt copy, Show HN, Reddit, X, LinkedIn, Indie Hackers, an email announcement, subreddit guidance, and a lightweight media kit.\n\nPremium unlocks SEO, backlinks, outreach, product demo beats, and creative assets once the launch story is clear.',
    cta: 'Try Launch Kit with your product URL',
    notes: 'Maker-friendly and outcome-led, with the full workflow visible.',
  },
  hacker_news: {
    id: 'hacker_news',
    label: PLATFORM_LABELS.hacker_news,
    title: 'Show HN: Launch Kit - URL to launch assets for founders',
    body:
      'I built Launch Kit because launch prep kept turning into repetitive rewriting work.\n\nThe flow is intentionally simple: paste a product URL, review the extracted brief, then generate the core launch kit: Product Hunt, HN, Reddit, X, LinkedIn, Indie Hackers, email, subreddit recommendations, and a lightweight media kit.\n\nSEO, backlinks, outreach, product demo beats, and creative assets are Premium because they are higher-leverage growth work.\n\nWould appreciate feedback on the extraction quality and per-channel voice.',
    cta: 'Try it and share blunt feedback',
    notes: 'Humble, specific, and feedback-oriented for HN.',
  },
  reddit: {
    id: 'reddit',
    label: PLATFORM_LABELS.reddit,
    title: 'Built a launch dashboard that rewrites one product URL for each channel',
    body:
      'I kept seeing the same launch problem: the product story is one thing, but every community expects a different style.\n\nLaunch Kit extracts a brief from a URL and generates the core launch copy founders usually need first: Product Hunt, Show HN, Reddit, X, LinkedIn, Indie Hackers, email, subreddit recommendations, and a light media kit.\n\nThe goal is not to spam every channel. It is to stop pretending one generic announcement fits everywhere.\n\nIf you launch products, which output would you trust least: HN, Reddit, LinkedIn, or email?',
    cta: 'Share what would make this more useful',
    notes: 'Transparent and discussion-first, with a direct community question.',
    redditRecommendations: {
      strategyNotes:
        'Lead with subreddit fit and risk. Use r/SaaS for discussion-first workflow critique, r/SideProject for a more direct show-and-ask post, and verify current rules/flairs before posting any link.',
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
      subredditPostPacks: [
        {
          subreddit: 'r/SideProject',
          url: 'https://www.reddit.com/r/SideProject/',
          audienceFit: 'Makers who are open to early tools, rough demos, and specific feedback asks.',
          ruleSnapshot:
            'Unverified rule snapshot. Check current sidebar rules, flair options, and pinned posts before sharing a link.',
          promotionPolicy: 'self_promo_limited',
          activitySignal: 'medium',
          suggestedFlair: 'Showcase or Feedback, if available',
          bestPostType: 'Transparent build/share post with a focused critique request.',
          whyItFits:
            'Launch Kit can be framed as a side-project workflow and a request for other builders to critique generated launch output.',
          riskNotes: [
            'Ask for concrete feedback, not only traffic.',
            'Avoid reposting the same direct pitch across similar project subreddits.',
            'Remove the link if current rules are stricter than expected.',
          ],
          variants: [
            {
              id: 'sideproject-conservative',
              mode: 'conservative',
              title: 'How do you adapt launch copy for different communities?',
              body:
                'I am trying to understand how other builders handle launch copy across different communities.\n\nThe product story may be one thing, but HN, Reddit, LinkedIn, Product Hunt, and email all punish different kinds of laziness.\n\nI am building Launch Kit around this problem, but I am more interested in the workflow question: what parts of a launch story should stay consistent, and what should change by channel?',
              cta: 'Ask for launch workflow feedback; omit the link unless rules allow it.',
              riskLevel: 'low',
              positioningNote:
                'Discussion-first and link-optional. Best when the community is sensitive to promotion.',
              prePostChecklist: [
                'Check current flair and self-promotion rules.',
                'Disclose that you are the builder if you mention Launch Kit.',
                'Make the question useful even if no one clicks a link.',
              ],
            },
            {
              id: 'sideproject-self-promo-soft',
              mode: 'self_promo',
              title: 'I built Launch Kit: one product URL to channel-native launch drafts',
              body:
                'I built Launch Kit because launch prep kept turning into the same story rewritten for too many rooms.\n\nPaste one product URL, review the extracted brief, then get drafts for Product Hunt, Show HN, Reddit, X, LinkedIn, Indie Hackers, email, subreddit guidance, and a light media kit.\n\nI am the builder, so this is self-promotion if links are allowed here. I would value blunt feedback on which generated output feels least publishable and what would make it better.',
              cta: 'Try the sample and critique one output',
              riskLevel: 'medium',
              positioningNote:
                'Direct product mention with a critique ask. Use only where project sharing is currently allowed.',
              prePostChecklist: [
                'Use the required showcase or feedback flair.',
                'Mention that links can be removed if not allowed.',
                'Do not reuse this exact post across multiple subreddits.',
              ],
            },
            {
              id: 'sideproject-self-promo-direct',
              mode: 'self_promo',
              title: 'Launch Kit turns one product URL into a focused launch kit',
              body:
                'I am the builder of Launch Kit. It is made for founders who have a product ready, but still need Product Hunt copy, Show HN, Reddit drafts, X posts, LinkedIn copy, email, subreddit guidance, and media kit basics.\n\nThe goal is not to auto-post. It is to create a better first draft for each channel so the founder can review and edit with the right social contract in mind.\n\nIf self-promotion is allowed here, I would appreciate product feedback more than praise.',
              cta: 'Open the sample Launch Kit dashboard',
              riskLevel: 'high',
              positioningNote:
                'Most promotional variant. Save it for communities that clearly allow launch/showcase posts.',
              prePostChecklist: [
                'Verify self-promotion is allowed today.',
                'Use the correct flair and disclose builder status.',
                'Add a screenshot or demo proof if the community expects it.',
              ],
            },
          ],
        },
        {
          subreddit: 'r/SaaS',
          url: 'https://www.reddit.com/r/SaaS/',
          audienceFit:
            'SaaS founders and operators who discuss positioning, launch channels, onboarding, pricing, and early growth.',
          ruleSnapshot:
            'Unverified rule snapshot. Treat direct self-promotion as risky unless current rules, pinned posts, or flairs explicitly allow it.',
          promotionPolicy: 'discussion_only',
          activitySignal: 'medium',
          suggestedFlair: 'Feedback or Discussion, if available',
          bestPostType: 'Problem-first SaaS workflow discussion with product context after the question.',
          whyItFits:
            'Launch Kit fits if the post is about SaaS launch workflow quality, not a bare launch announcement.',
          riskNotes: [
            'Lead with a SaaS launch lesson or workflow question.',
            'Avoid a direct link unless current rules allow it.',
            'Make the product mention secondary to the discussion.',
          ],
          variants: [
            {
              id: 'saas-conservative',
              mode: 'conservative',
              title: 'How do you keep SaaS launch copy from becoming generic?',
              body:
                'I am curious how other SaaS founders keep launch copy useful when the same product story has to show up in different places.\n\nProduct Hunt needs a crisp promise. HN wants humility. Reddit wants context. LinkedIn needs the operator lesson. Email needs relevance fast.\n\nI am building around this problem, but the bigger question is process: do you start with one source narrative and adapt it, or write each channel from scratch?',
              cta: 'Ask for SaaS launch process feedback',
              riskLevel: 'low',
              positioningNote: 'Safest r/SaaS angle because the post can stand without a product link.',
              prePostChecklist: [
                'Check whether product links are allowed.',
                'Keep the SaaS workflow question above the product mention.',
                'Use only sourced proof if adding examples.',
              ],
            },
            {
              id: 'saas-self-promo-soft',
              mode: 'self_promo',
              title: 'I built a SaaS launch-copy workflow and want feedback on the approach',
              body:
                'I built Launch Kit for founders who are ready to launch but still have to turn one product story into Product Hunt, HN, Reddit, X, LinkedIn, email, and media kit copy.\n\nThe workflow is: paste URL, review extracted brief, generate channel-native drafts, then edit before publishing.\n\nI am the builder. If feedback posts are allowed here, I would value critique on the approach: is the useful part the writing, the channel-specific guidance, or the exportable launch kit?',
              cta: 'Critique the sample workflow',
              riskLevel: 'high',
              positioningNote:
                'Contains direct product context. Use only if r/SaaS current rules allow feedback/self-promo posts.',
              prePostChecklist: [
                'Verify current r/SaaS self-promotion and flair rules.',
                'Ask for critique on the launch workflow, not only product signups.',
                'Be ready to remove the link and keep discussion in the comments.',
              ],
            },
          ],
        },
      ],
    },
  },
  indie_hackers: {
    id: 'indie_hackers',
    label: PLATFORM_LABELS.indie_hackers,
    title: 'I turned my launch checklist into a URL-to-launch-kit workflow',
    body:
      'Launch Kit is my attempt to make launch prep less fragmented.\n\nWhat it does: extracts a product brief from a URL, generates the core launch copy, recommends Reddit angles, and creates a lightweight media kit.\n\nThe opinion: founders should keep one source narrative, then adapt the delivery to each launch room instead of rewriting from scratch.\n\nNext experiment: keeping Premium growth work useful without making the free launch kit feel heavy.',
    cta: 'Follow the build and test the sample kit',
    notes: 'Build-in-public structure with product opinion and next experiment.',
  },
  linkedin: {
    id: 'linkedin',
    label: PLATFORM_LABELS.linkedin,
    title: 'Launch Kit helps founders turn one product URL into a focused launch kit',
    body:
      'Launch day should not be eight blank documents and a scattered asset folder.\n\nLaunch Kit extracts one structured product brief, then generates the core launch kit: Product Hunt, HN, Reddit, X, LinkedIn, Indie Hackers, email, subreddit guidance, and a lightweight media kit.\n\nThe result: one narrative, adapted to each channel, with exports in the same dashboard. Premium adds SEO, backlinks, outreach, demo beats, and creative when the story is ready.',
    cta: 'Try it on your next product launch',
    notes: 'Professional and systems-oriented for LinkedIn.',
  },
  tiktok: {
    id: 'tiktok',
    label: PLATFORM_LABELS.tiktok,
    title: 'TikTok Script: Premium video beats from the launch brief',
    body:
      'Hook (0-2s): Launching should not mean rewriting your story ten times.\nRetention beat (3-7s): First, Launch Kit turns one URL into the core launch kit.\nStory beat (8-18s): Premium then turns the confirmed story into short-form hooks, scenes, and creative beats.\nClose (19-24s): Prove the message first. Make the media second.',
    cta: 'Unlock Premium video beats',
    notes: 'Fast visual beats with a clear upgrade path.',
  },
  youtube_shorts: {
    id: 'youtube_shorts',
    label: PLATFORM_LABELS.youtube_shorts,
    title: 'YouTube Shorts Script: Free launch kit to walkthrough beats',
    body:
      'Open: Most product launches start with the same problem: one story, too many channels.\nMiddle: Launch Kit reads your product URL, builds an editable brief, and turns it into launch copy, subreddit guidance, email, and media kit basics.\nPremium beat: Reuse that confirmed story for walkthrough scenes and ad-ready creative.\nEnd: Start with one URL. Leave with a launch kit.',
    cta: 'Open the sample Launch Kit dashboard',
    notes: 'Narrative rhythm designed for a concise product walkthrough.',
  },
  email_announcement: {
    id: 'email_announcement',
    label: PLATFORM_LABELS.email_announcement,
    title: 'Subject: Launch Kit turns one URL into a focused launch kit',
    body:
      'Hi there,\n\nLaunch Kit is built for founders who want launch day to feel organized instead of fragmented.\n\nPaste your product URL, confirm the extracted brief, then generate the core launch kit: Product Hunt, HN, Reddit, X, LinkedIn, Indie Hackers, email, subreddit recommendations, and media kit basics.\n\nIf you usually rewrite the same story channel by channel, this gives you one narrative system and a real dashboard to work from.',
    cta: 'Try Launch Kit with your product URL',
    notes: 'Clear value summary with workflow and low-friction CTA.',
  },
}

const DEMO_CHANNEL_PACKS: Record<ChannelPackId, ChannelPack> = {
  x: {
    id: 'x',
    label: CHANNEL_PACK_LABELS.x,
    notes: 'Public X content for build-in-public, launch, lessons, threads, and replies. DMs stay in outbound outreach.',
    cards: [
      demoCard(
        'x-build-in-public',
        'pre_launch',
        'Build-in-public update',
        'Building Launch Kit in public',
        'I thought Launch Kit would mostly be a copy generator.\n\nThe harder problem was messier: founders usually have one true product story, but every launch channel punishes a different kind of laziness.\n\nSo the product now starts with one URL, turns it into an editable brief, then adapts the story for each room.',
        'Follow the build or try the sample dashboard',
        'X works best when the post feels like a lived build, launch, or distribution lesson.',
      ),
      demoCard(
        'x-launch-post',
        'launch_day',
        'Launch post',
        'Launch Kit is live',
        'I got tired of launch prep turning into eight blank docs and a half-remembered product story.\n\nSo I built Launch Kit.\n\nPaste one product URL, review the extracted brief, then generate native drafts for Product Hunt, HN, Reddit, X, LinkedIn, Indie Hackers, email, subreddit guidance, and a media kit.\n\nThe goal is not more posts. It is fewer lazy translations.',
        'Try Launch Kit with your product URL',
        'Keep the launch direct and useful without pretending one post fits every channel.',
      ),
      demoCard(
        'x-lesson-post',
        'evergreen',
        'Lesson post',
        'The lesson behind Launch Kit',
        'Launch lesson: the same message can be true and still feel wrong in the wrong room.\n\nHN wants humility. Reddit wants context. LinkedIn wants the operator lesson. X wants the sharp public learning.\n\nLaunch Kit exists because distribution is translation, not copy-paste.',
        'Share the channel you distrust most',
        'A useful X lesson should make the audience want to reply with their own experience.',
      ),
      demoCard(
        'x-short-thread',
        'launch_day',
        'Short thread',
        'Why I built Launch Kit',
        '1/ I used to think launches failed because the announcement was weak.\n\n2/ Now I think a lot of them fail because the same story gets pasted into rooms with different rules.\n\n3/ HN wants humility. Reddit wants context. LinkedIn wants the operator lesson. X wants the sharp public learning.\n\n4/ I built Launch Kit around that idea: keep one narrative, adapt the delivery.\n\n5/ The part I am still testing is where automation helps and where the founder has to stay close to the story.',
        'Open the sample launch kit',
        'Threads should build a clear argument with each post earning the next one.',
      ),
      demoCard(
        'x-reply-prompts',
        'follow_up',
        'Reply prompts',
        'X reply prompts',
        'Reply prompts:\n- Which launch channel would you trust least with template-generated copy?\n- What proof would make a launch-content tool credible?\n- Where does your launch prep usually get messy?\n- Would you rather get one polished draft or five rough options?',
        'Reply with the channel you distrust most',
        'Reply prompts should invite useful disagreement, not engagement bait.',
      ),
    ],
  },
  linkedin: {
    id: 'linkedin',
    label: CHANNEL_PACK_LABELS.linkedin,
    notes: 'Founder-led professional posts with lessons, proof, and practical operator framing.',
    cards: [
      demoCard(
        'linkedin-founder-launch',
        'launch_day',
        'Founder launch post',
        'Launch Kit turns one URL into a focused launch kit',
        DEMO_BLOCKS.linkedin.body,
        'Try it on your next product launch',
        'LinkedIn expects a professional but human post with a clear operator lesson.',
      ),
      demoCard(
        'linkedin-lesson',
        'evergreen',
        'Lesson post',
        'One story, different rooms',
        'A launch message can be accurate and still fail because it ignores the room.\n\nProduct Hunt needs a crisp promise. HN needs humility. Reddit needs context. LinkedIn needs the business reason it matters.\n\nLaunch Kit is built around that constraint: one source narrative, different delivery by channel.',
        'Tell me which channel is hardest to write for',
        'Use a practical insight instead of a polished announcement.',
      ),
      demoCard(
        'linkedin-proof',
        'follow_up',
        'Proof post',
        'What the Launch Kit demo includes',
        'The current Launch Kit demo generates the core launch channels, subreddit guidance, a media kit, markdown export, and press pack export from one structured brief.\n\nThe next quality bar is sharper channel-native output: X timeline posts, cautious Reddit variants, and a clearer Premium path for growth assets.',
        'Open the sample dashboard',
        'Proof should stay specific to observed product capabilities, not invented traction.',
      ),
      demoCard(
        'linkedin-follow-up',
        'follow_up',
        'Follow-up post',
        'The next Launch Kit experiment',
        'Next experiment for Launch Kit: make the generated content less like generic launch copy and more like a real founder showing up in each channel.\n\nThat means build-in-public posts for X, discussion-first Reddit drafts, visual creative briefs for Instagram, and scripts that work for short video.',
        'Share the output you would improve first',
        'Follow-up posts should show what changed and invite concrete feedback.',
      ),
    ],
  },
  threads: {
    id: 'threads',
    label: CHANNEL_PACK_LABELS.threads,
    notes: 'Casual, conversational posts that feel easy to reply to.',
    cards: [
      demoCard('threads-launch-story', 'launch_day', 'Casual launch story', 'Launch Kit on Threads', 'Launch prep kept turning into too many docs, so I built Launch Kit.\n\nOne URL becomes an editable brief, then channel-native launch drafts, subreddit guidance, email copy, and a media kit.\n\nThe useful part is not writing more. It is writing for the room.', 'Try it with your product URL', 'Threads should feel conversational and low-pressure.'),
      demoCard('threads-build-note', 'pre_launch', 'Build note', 'What changed in Launch Kit', 'Working on making Launch Kit less generic by giving each social channel its own content pack.\n\nX gets build-in-public posts. Reddit gets cautious and self-promo versions. Instagram and short video get creative briefs, not just captions.', 'Follow the next build note', 'Build notes should sound like progress, not a press release.'),
      demoCard('threads-question', 'follow_up', 'Reply-driving question', 'Which channel is hardest?', 'Question for anyone who has launched a product: which channel is hardest to write for without sounding awkward?\n\nFor me it is Reddit, because the difference between useful context and self-promo is very real.', 'Reply with the hardest channel', 'Threads posts should leave an obvious opening for replies.'),
      demoCard('threads-follow-up', 'follow_up', 'Follow-up post', 'What I learned from launch copy', 'The more I test launch drafts, the more convinced I am that the product narrative should be stable and the delivery should change.\n\nSame story. Different room. Different proof. Different ask.', 'Try the sample launch kit', 'Keep follow-up posts short and grounded in learning.'),
    ],
  },
  reddit: {
    id: 'reddit',
    label: CHANNEL_PACK_LABELS.reddit,
    notes: 'Use the cautious version for discussion-first communities and the self-promo version only where rules explicitly allow it.',
    cards: [
      demoCard(
        'reddit-cautious-discussion',
        'pre_launch',
        'Cautious discussion post',
        'How do you adapt launch copy without sounding generic?',
        'I am trying to understand how other founders handle launch copy across different communities.\n\nThe product story may be the same, but HN, Reddit, LinkedIn, Product Hunt, and short video all seem to expect a different tone and level of proof.\n\nI am building a tool around this problem, but I am more interested in the workflow question: how do you decide what changes by channel, and what should stay consistent?',
        'Share your launch-copy workflow',
        'Lead with the discussion and avoid dropping a link unless it is explicitly allowed.',
      ),
      demoCard(
        'reddit-self-promo-launch',
        'launch_day',
        'Self-promo launch post',
        'I built Launch Kit: one product URL to channel-native launch assets',
        DEMO_BLOCKS.reddit.body,
        'Try it and tell me which output feels weakest',
        'Use only in communities that allow self-promotion; disclose that you built it.',
      ),
    ],
    redditRecommendations: DEMO_BLOCKS.reddit.redditRecommendations,
  },
  indie_hackers: {
    id: 'indie_hackers',
    label: CHANNEL_PACK_LABELS.indie_hackers,
    notes: 'Build-in-public posts with tradeoffs, experiments, proof, and next steps.',
    cards: [
      demoCard('indie-hackers-founder-launch', 'launch_day', 'Founder launch story', DEMO_BLOCKS.indie_hackers.title, DEMO_BLOCKS.indie_hackers.body, DEMO_BLOCKS.indie_hackers.cta, 'Indie Hackers rewards transparent founder context and next experiments.'),
      demoCard('indie-hackers-lesson', 'evergreen', 'Build lesson', 'The build lesson behind Launch Kit', 'The lesson so far: launch copy is less about writing one perfect announcement and more about translating the same narrative for different trust norms.\n\nI am now treating each platform as a separate product surface.', 'Follow the next experiment', 'Share a real build lesson, not just product positioning.'),
      demoCard('indie-hackers-proof', 'follow_up', 'Proof and learnings', 'Early proof from the Launch Kit demo', 'The demo now creates core launch channels, subreddit guidance, media kit, markdown export, and press pack export from one brief.\n\nThe open question is quality: which generated output would founders actually trust enough to publish?', 'Try the sample and critique one tab', 'Use product proof only; do not invent traction.'),
      demoCard('indie-hackers-next-experiment', 'follow_up', 'Next experiment', 'Next experiment: native channel packs', 'Next experiment: replacing single generic social drafts with full native channel packs.\n\nX gets build-in-public. Reddit gets cautious and self-promo versions. Instagram and short video get creative briefs. Outreach moves to its own area.', 'Tell me which channel to improve first', 'Make the experiment specific enough for other builders to react.'),
    ],
  },
  instagram: {
    id: 'instagram',
    label: CHANNEL_PACK_LABELS.instagram,
    notes: 'Visual-first captions and creative briefs; no actual media is generated in this pass.',
    cards: [
      demoCard('instagram-carousel-brief', 'launch_day', 'Carousel creative brief', 'Launch Kit carousel', 'Slide 1: Launch day should not be eight blank docs.\nSlide 2: Paste one product URL.\nSlide 3: Review the extracted brief.\nSlide 4: Generate native drafts for each channel.\nSlide 5: Export the kit and keep iterating.\nCaption: Built for founders who want launch prep to feel organized.', 'Try Launch Kit with your URL', 'Instagram needs visual structure before caption polish.'),
      demoCard('instagram-caption', 'launch_day', 'Launch caption', 'Launch Kit caption', 'Launch Kit turns one product URL into platform-native launch copy, subreddit guidance, email, and a media kit.\n\nPremium can turn the confirmed story into visual-first creative later.', 'Open the sample dashboard', 'Caption should support real screenshots or founder footage.'),
      demoCard('instagram-story-sequence', 'follow_up', 'Story sequence', 'Launch Kit stories', 'Story 1: Poll - which launch channel is hardest?\nStory 2: Show the URL to brief workflow.\nStory 3: Show generated channel tabs.\nStory 4: Ask for one output to critique.', 'Vote in the poll or try the sample', 'Stories should invite lightweight interaction.'),
      demoCard('instagram-reel-brief', 'evergreen', 'Reel creative brief', 'Launch Kit Reel brief', 'Hook overlay: Launch copy should not start from eight blank pages.\nShot 1: Founder opening the product URL.\nShot 2: Brief extraction.\nShot 3: Channel cards.\nShot 4: Export/share moment.', 'Try it with your product URL', 'Reels need a visible workflow and a clear first beat.'),
    ],
  },
  tiktok: {
    id: 'tiktok',
    label: CHANNEL_PACK_LABELS.tiktok,
    notes: 'Founder-led short-video scripts with hook, beats, proof slot, and comment prompt.',
    cards: [
      demoCard('tiktok-founder-script', 'launch_day', 'Founder video script', DEMO_BLOCKS.tiktok.title, DEMO_BLOCKS.tiktok.body, DEMO_BLOCKS.tiktok.cta, 'TikTok needs a fast hook and visible transformation.'),
      demoCard('tiktok-problem-script', 'evergreen', 'Problem to fix script', 'TikTok: one story, too many channels', 'Hook: Your launch copy is probably not one post.\nBeat 1: Show Product Hunt, HN, Reddit, LinkedIn, and email tabs.\nBeat 2: Explain that each channel has a different social contract.\nBeat 3: Show Launch Kit turning one URL into adapted drafts.\nClose: Try it with your URL.', 'Comment with the hardest channel', 'Short video scripts need a concrete visual sequence.'),
      demoCard('tiktok-comment-prompt', 'follow_up', 'Comment prompt', 'TikTok comment prompt', 'Comment prompt: Which launch channel would you never trust a generic draft for?\n\nI am using the answers to improve Launch Kit channel packs.', 'Comment with the channel', 'Comment prompts should gather useful product feedback.'),
    ],
  },
  youtube_shorts: {
    id: 'youtube_shorts',
    label: CHANNEL_PACK_LABELS.youtube_shorts,
    notes: 'Concise Shorts scripts with product-motion beats and evidence-only claims.',
    cards: [
      demoCard('youtube-shorts-founder-script', 'launch_day', 'Founder Shorts script', DEMO_BLOCKS.youtube_shorts.title, DEMO_BLOCKS.youtube_shorts.body, DEMO_BLOCKS.youtube_shorts.cta, 'Shorts need a direct hook, clear middle, and visible product moment.'),
      demoCard('youtube-shorts-demo-script', 'evergreen', 'Product demo script', 'YouTube Shorts product demo', 'Open: I wanted launch prep in one workspace.\nMiddle: Paste a URL, confirm the brief, then review channel-native cards, subreddit guidance, email, and media kit basics.\nProof beat: The sample dashboard includes export and per-tab regeneration.\nEnd: One URL. Focused launch kit.', 'Open the sample dashboard', 'Product demos should show the workflow, not just describe it.'),
      demoCard('youtube-shorts-follow-up', 'follow_up', 'Follow-up Shorts script', 'YouTube Shorts follow-up', 'Open: The first version wrote one draft per channel.\nMiddle: The next version turns social channels into full native content packs.\nProof beat: X, Reddit, LinkedIn, Instagram, TikTok, and Shorts now each get their own formats.\nEnd: Better drafts for the actual room.', 'Try the updated demo', 'Follow-up videos should show what changed.'),
    ],
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
          'Hi Content Team,\n\nI found GrowthMentor while researching startup growth workflows. Launch Kit turns one product URL into a focused launch kit, then Premium adds SEO content strategy, backlink planning, and reviewed outreach drafts for lean teams.\n\nA practical guest article could show how founders adapt one product story for Product Hunt, HN, Reddit, LinkedIn, SEO, and backlinks.\n\nHappy to send a tight outline.',
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
    channelPacks: DEMO_CHANNEL_PACKS,
    mediaKit: {
      founderCompanyBio:
        'Launch Kit is built for founders and small teams that need a practical launch workflow without assembling copy docs, subreddit research, email drafts, and press basics by hand.',
      productOneLiner:
        'Launch Kit turns one product URL into platform-tailored launch content, subreddit guidance, email, and a lightweight media kit.',
      boilerplate:
        'Launch Kit is a focused launch-content workspace for founders and lean startup teams. It extracts a structured brief from a product URL, generates channel-native launch copy, recommends subreddit angles, creates an email announcement, and packages a lightweight media kit. Premium adds SEO, backlinks, outreach, product demo beats, and creative assets from the same source narrative.',
      pressRelease:
        'Launch Kit today introduced a guided workflow that converts a single product URL into a focused launch kit. The app generates platform-specific copy for Product Hunt, Hacker News, Reddit, X, Indie Hackers, LinkedIn, and email, plus subreddit recommendations, a lightweight media kit, markdown export, and press pack export.',
      keyVisualsChecklist: [
        'Dashboard screenshot with generated output tabs',
        'Brief extraction and editing workflow',
        'Subreddit recommendation cards',
        'Press pack export preview',
        'Logo and social preview image',
        'Example launch channel collage',
      ],
      screenshotsAndLogos:
        'Use dashboard screenshots, output tab previews, subreddit recommendation cards, and the Launch Kit sparkle mark for launch submissions and press coverage.',
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
          'Hi {{firstName}} - noticed {{company}} is preparing launches in {{category}}. Launch Kit turns one product URL into a focused launch kit.',
        variants: [
          {
            id: 'linkedin-v1',
            title: 'Founder workflow',
            message:
              'Hi {{firstName}}, Launch Kit helps founders turn one product URL into Product Hunt, HN, Reddit, X, LinkedIn, email, subreddit guidance, and media kit basics from one brief.',
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
              'Launch Kit starts with the free launch kit, then Premium adds SEO, backlink planning, outreach drafts, demo beats, and creative assets from the same brief.',
            cta: 'Should I send the sample dashboard?',
          },
        ],
      },
      xOutreach: {
        channel: 'x',
        notes: 'Short, direct founder DM style.',
        personalizationTemplate:
          'Hey {{firstName}} - Launch Kit turns one URL into a focused launch kit, with Premium growth assets when ready.',
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
              'I made the sample dashboard self-hosted: Product Hunt, HN, Reddit, X, LinkedIn, email, subreddit guidance, and media kit from one Launch Kit brief.',
            cta: 'Want the link?',
          },
          {
            id: 'x-v3',
            title: 'Outcome angle',
            message:
              'One product URL -> one editable brief -> core launch copy first, Premium growth assets later. That is the Launch Kit workflow.',
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
            subject: 'One URL to a focused launch kit',
            message:
              'Hi {{firstName}},\n\nLaunch Kit helps founders generate Product Hunt, HN, Reddit, X, LinkedIn, email, subreddit guidance, and media kit basics from one product URL.',
            cta: 'Want me to generate a sample kit for your product page?',
          },
          {
            id: 'email-v2',
            title: 'Pain-point opener',
            subject: 'If launch copy is slowing the release',
            message:
              'Hi {{firstName}},\n\nMany teams lose momentum rewriting the same product story for every channel. Launch Kit extracts one brief, adapts the core launch copy, and keeps Premium growth work separate until the message is clear.',
            cta: 'Open to a quick walkthrough this week?',
          },
          {
            id: 'email-v3',
            title: 'SEO growth opener',
            subject: 'Launch content plus SEO/backlink planning',
            message:
              'Hi {{firstName}},\n\nLaunch Kit pairs a focused free launch kit with Premium SEO analysis, blog strategy, backlink prospects, and reviewed outreach drafts so the launch story can keep compounding after launch day.',
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
            'A product launch kit is the working set of copy, subreddit guidance, email, press basics, and exportable materials a team needs before announcing a product. Launch Kit builds that kit from one URL and one editable brief.',
          cta: 'Try Launch Kit with your product URL.',
        },
        {
          id: 'seo-pack-2',
          keywordClusterId: 'cluster-channel-launch-copy',
          keywordTopic: 'Channel-specific launch copy',
          title: 'How to Adapt One Product Launch Story for Every Channel',
          metaDescription:
            'A practical guide to rewriting one product narrative for Product Hunt, HN, Reddit, X, LinkedIn, email, and press.',
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
    'product_hunt',
    'hacker_news',
    'reddit',
    'linkedin',
  ]

  return previewOrder.map((blockId) => DEMO_KIT.platformBlocks[blockId])
}

export function getDemoBlockIds(): PlatformBlockId[] {
  return [...PLATFORM_IDS]
}
