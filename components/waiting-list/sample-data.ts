export type SampleChannel = {
  id: string
  label: string
  eyebrow: string
  title: string
  body: string
  cta: string
  notes: string
}

export type SampleSubreddit = {
  name: string
  angle: string
  guidance: string
}

export type SampleProspect = {
  name: string
  segment: string
  fit: string
  outreachAngle: string
}

export type SampleProductDemo = {
  title: string
  format: string
  draft: string
}

export type SampleCreativeAsset = {
  id: string
  title: string
  label: string
  format: string
  prompt: string
}

export type SampleBriefSignal = {
  label: string
  value: string
}

export const SAMPLE_BRIEF_SIGNALS: SampleBriefSignal[] = [
  {
    label: 'Positioning',
    value:
      'Shipdaddy turns one product URL into launch copy, subreddit guidance, an email announcement, and a light media kit.',
  },
  {
    label: 'Best audience',
    value:
      'Solo founders, indie hackers, and lean SaaS teams who have a product ready but do not want launch prep scattered across blank docs.',
  },
  {
    label: 'Proof to use',
    value:
      'The app extracts a focused brief, generates core launch channels, keeps review in the dashboard, and separates premium growth work until the launch story is clear.',
  },
]

export const SAMPLE_CHANNELS: SampleChannel[] = [
  {
    id: 'product-hunt',
    label: 'Product Hunt',
    eyebrow: 'Launch platform',
    title: 'Shipdaddy - one product URL to a focused launch kit',
    body:
      'Shipdaddy turns a product URL into the launch work founders need first: Product Hunt copy, Show HN, Reddit drafts, X posts, LinkedIn copy, an email announcement, subreddit guidance, and a lightweight media kit.\n\nIt is built for the moment when the product is ready but the launch story is still split across empty documents, old notes, and channel-specific guesses.\n\nPaste the URL, review the extracted brief, generate the launch kit, then edit and publish the pieces that are ready.',
    cta: 'Try the sample launch kit',
    notes:
      'Clear promise, concrete outputs, and a review-before-publishing workflow.',
  },
  {
    id: 'hacker-news',
    label: 'Hacker News',
    eyebrow: 'Show HN',
    title: 'Show HN: Shipdaddy - URL to launch drafts for founders',
    body:
      'I am building Shipdaddy because launch prep keeps turning into repetitive rewriting work.\n\nThe flow is simple: paste a product URL, confirm the extracted brief, then generate the first launch kit: Product Hunt, Show HN, Reddit, X, LinkedIn, email, subreddit recommendations, and a lightweight media kit. Premium adds SEO, backlinks, outreach, demo beats, and creative prompts from the same brief.\n\nIt does not post for you. The goal is to give founders a strong first pass that respects each channel, so the human work becomes review, editing, and judgment.\n\nI would appreciate feedback on which generated output you would trust least and what would make it publishable.',
    cta: 'Open the sample and critique one block',
    notes:
      'Specific, transparent about product boundaries, and appropriate for HN feedback.',
  },
  {
    id: 'reddit',
    label: 'Reddit',
    eyebrow: 'Community post',
    title: 'I built a tool that turns one product URL into launch copy',
    body:
      'I like shipping products. I do not like writing the same launch story eight different ways, then guessing which subreddit will tolerate the post.\n\nShipdaddy is my attempt to make that first pass less chaotic. You paste a product URL, review the brief, and get channel-specific drafts plus subreddit recommendations. The free kit handles the basic launch content. Premium adds SEO, backlinks, outreach, demo beats, and creative once the story is worth scaling.\n\nThe point is not to spray generic AI posts everywhere. The point is to start with a draft and a place that actually fit the channel, then edit like a human before publishing.\n\nIf you launch side projects, what is worse: writing the post, finding where to post, or making it not sound like an ad?',
    cta: 'Ask for launch-workflow feedback',
    notes:
      'Leads with the founder pain and asks for useful discussion instead of dropping a pitch.',
  },
  {
    id: 'x',
    label: 'X',
    eyebrow: 'Social thread',
    title: 'X thread: Launch prep should not start from ten blank docs',
    body:
      '1/ Launch prep should not start from ten blank docs.\n\n2/ Shipdaddy reads one product URL and gives you the first pass: Product Hunt copy, Show HN, Reddit, X, LinkedIn, email, subreddit guidance, and a media kit.\n\n3/ The hard part is not only writing. It is knowing what angle belongs where. Reddit wants context. X needs a clean hook. LinkedIn needs the business case.\n\n4/ Shipdaddy gives you a channel map and drafts to review. You still decide what gets published.\n\n5/ One URL in. A focused launch kit out.',
    cta: 'Post the thread',
    notes:
      'Skimmable hook, clear pain, concrete output list, and a human review boundary.',
  },
  {
    id: 'indie-hackers',
    label: 'Indie Hackers',
    eyebrow: 'Build in public',
    title: 'Turning launch prep into a product workflow',
    body:
      'The pattern I keep seeing: the product is ready, but distribution starts from a blank page.\n\nShipdaddy starts with one URL and creates the first pass of the launch kit: Product Hunt copy, Reddit post, X thread, subreddit recommendations, LinkedIn copy, announcement email, and media kit.\n\nThe opinion: founders should spend launch week choosing, editing, and publishing, not rebuilding the same narrative in ten tabs.\n\nCurrent focus: making the generated work sharp enough that the next edit is obvious.',
    cta: 'Follow the generated launch workflow',
    notes:
      'Founder story, product thesis, and a clear build-in-public update.',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    eyebrow: 'Professional social',
    title: 'Founders should not launch from blank documents',
    body:
      'Most product launches need the same first pieces: Product Hunt copy, Show HN, Reddit, X, LinkedIn, email, subreddit guidance, and a media kit.\n\nShipdaddy creates those pieces from one product URL.\n\nIt keeps one product narrative consistent while adapting the delivery for each launch channel.\n\nThe founder stays in control. Shipdaddy removes the blank-page work and keeps premium growth work separate until the launch story is clear.',
    cta: 'Open the Shipdaddy sample',
    notes:
      'Executive-readable and precise about the launch jobs Shipdaddy handles.',
  },
  {
    id: 'email',
    label: 'Email',
    eyebrow: 'Announcement',
    title: 'Subject: Shipdaddy turns your product URL into launch drafts',
    body:
      'Hi there,\n\nShipdaddy is built for founders who can ship the product, but do not want launch distribution to start from scratch.\n\nPaste your product URL and Shipdaddy generates the first launch kit: Product Hunt copy, Show HN, Reddit draft, X post, subreddit recommendations, LinkedIn post, email announcement, and a media kit ready to review.\n\nYou stay in charge of what gets published. Shipdaddy gives you the first complete pass.\n\nThe sample shows how one product URL becomes channel-specific launch work.',
    cta: 'View the Shipdaddy sample',
    notes:
      'Direct, practical, and clear that the user reviews before publishing.',
  },
]

export const SAMPLE_SUBREDDITS: SampleSubreddit[] = [
  {
    name: 'r/SaaS',
    angle:
      'Founder workflow feedback from SaaS builders who understand launch copy and channel-fit pain.',
    guidance:
      'Ask for critique on the workflow and generated output quality. Avoid a pure product announcement.',
  },
  {
    name: 'r/SideProject',
    angle:
      'A lighter maker post showing the one-URL-to-launch-content transformation.',
    guidance:
      'Lead with what you built, show the sample, and ask which output would save the most time.',
  },
  {
    name: 'r/AlphaandBetaUsers',
    angle:
      'Early testers who can try generated launch copy and subreddit recommendations from their own URL.',
    guidance:
      'Be explicit that it is early access and ask for founders willing to test generated launch content.',
  },
  {
    name: 'r/GrowthHacking',
    angle:
      'Distribution workflow angle: launch content, subreddit targeting, and a clear premium growth path.',
    guidance:
      'Frame it as a focused launch workflow first, not a sprawling growth product.',
  },
  {
    name: 'r/startups',
    angle:
      'Founder launch discussion for teams trying to turn a finished product into early traction.',
    guidance:
      'Ask for feedback on the launch workflow and first generated outputs. Keep the post practical.',
  },
  {
    name: 'r/EntrepreneurRideAlong',
    angle:
      'Build-in-public audience that responds to concrete before-and-after launch workflows.',
    guidance:
      'Share the one-URL input, generated output map, and what you would manually edit before posting.',
  },
]

export const SAMPLE_SEO_PLAN = [
  {
    title: 'AI launch copy generator',
    intent: 'Keyword research',
    angle:
      'Primary commercial query for founders looking to turn one product URL into launch copy.',
  },
  {
    title: 'Product launch kit generator',
    intent: 'Keyword research',
    angle:
      'Commercial page angle around creating Product Hunt, HN, Reddit, X, LinkedIn, email, and media-kit assets.',
  },
  {
    title: 'How to launch on Reddit without sounding like an ad',
    intent: 'Content generation',
    angle:
      'Evergreen guide that turns subreddit recommendations and Reddit social-contract notes into searchable content.',
  },
  {
    title: 'Product Hunt launch copy examples',
    intent: 'Content generation',
    angle:
      'Examples-led post showing how one brief becomes Product Hunt tagline, description, maker comment, and CTA.',
  },
  {
    title: 'Startup directories and launch lists',
    intent: 'Backlink ideas',
    angle:
      'Find relevant startup directories where Shipdaddy can reuse the confirmed launch brief for listings.',
  },
  {
    title: 'Founder tool roundups',
    intent: 'GEO readiness',
    angle:
      'Build comparison and mention angles for AI launch tools, founder workflow tools, and launch-planning roundups.',
  },
]

export const SAMPLE_OUTREACH = [
  {
    title: 'Founder email draft',
    body:
      'Subject: Quick launch workflow idea for {{company}}\n\nHi {{firstName}},\n\nI noticed {{company}} is preparing product work. Shipdaddy turns one URL into the core launch kit first, then premium can prepare SEO, backlink, and outreach drafts from the same brief.\n\nWant me to send the sample generated from shipdaddy.ai?',
    cta: 'Ready to review',
  },
  {
    title: 'LinkedIn DM',
    body:
      'Hey {{firstName}} - noticed {{company}} is working on launch or growth. Shipdaddy creates the first launch kit from one URL, then prepares premium outreach you can review before sending.\n\nWant me to send the sample?',
    cta: 'Send after review',
  },
  {
    title: 'X DM',
    body:
      'Hey {{firstName}} - saw you talking about launch distribution. I am building Shipdaddy: one URL to the core launch kit, with premium SEO, outreach, backlinks, demos, and creative once the story is clear.\n\nWorth sending the sample?',
    cta: 'Send after review',
  },
  {
    title: 'Follow-up email',
    body:
      'Subject: Re: launch workflow idea\n\nHi {{firstName}},\n\nQuick follow-up. The useful part of Shipdaddy is starting simple: Product Hunt, HN, Reddit, X, LinkedIn, email, subreddit guidance, and a light media kit from one URL.\n\nHappy to send the sample if useful.',
    cta: 'Ready to review',
  },
]

export const SAMPLE_PROSPECTS: SampleProspect[] = [
  {
    name: 'Micro-SaaS founder shipping a new feature',
    segment: 'Potential customer',
    fit:
      'Founders preparing public launches often need Product Hunt, Reddit, X, email, and outreach help at the same time.',
    outreachAngle:
      'Offer a sample launch kit generated from their product URL and ask which block is closest to publishable.',
  },
  {
    name: 'Founder tool curator',
    segment: 'Distribution partner',
    fit:
      'Tool curators and founder-resource newsletters cover launch workflows, AI writing, SEO, and early acquisition.',
    outreachAngle:
      'Pitch Shipdaddy as a narrow launch-prep tool with a concrete sample dashboard.',
  },
  {
    name: 'Startup tools directory',
    segment: 'Backlink prospect',
    fit:
      'Directories that list launch, marketing, and founder productivity tools can reuse a concise Shipdaddy listing.',
    outreachAngle:
      'Prepare a listing request with category fit, short blurb, and generated media-kit copy.',
  },
]

export const SAMPLE_PRODUCT_DEMO: SampleProductDemo[] = [
  {
    title: '30-second walkthrough',
    format: 'Demo script',
    draft:
      'Open on shipdaddy.ai. Paste a product URL. Show the extracted brief. Generate Product Hunt, Show HN, Reddit, X, LinkedIn, email, subreddit guidance, and media kit. Then show premium SEO, outreach, demo beats, and creative prompts from the same brief.',
  },
  {
    title: 'Founder voiceover',
    format: 'Narration',
    draft:
      'I do not need another blank document. I paste one URL into Shipdaddy and get the launch copy, where-to-post plan, announcement email, and light media kit ready to review. When the story works, premium turns it into growth work.',
  },
  {
    title: 'Screen recording checklist',
    format: 'Shot list',
    draft:
      '1. URL input. 2. Extracted product brief. 3. Generated dashboard. 4. X thread and Reddit draft. 5. Subreddit recommendation cards. 6. Email announcement. 7. Premium SEO and outreach panels. 8. Creative prompt cards.',
  },
]

export const SAMPLE_CREATIVE_ASSETS: SampleCreativeAsset[] = [
  {
    id: 'problem-solution',
    title: 'Problem / Solution',
    label: 'Image ad prompt',
    format: '1:1',
    prompt:
      'Premium dashboard-style ad for Shipdaddy showing a messy set of launch tabs and blank docs turning into one organized launch kit. Violet and mint accents, clear central URL input, no fake text.',
  },
  {
    id: 'before-after',
    title: 'Before / After',
    label: 'Image ad prompt',
    format: '4:5',
    prompt:
      'Before: scattered docs for Product Hunt, HN, Reddit, X, LinkedIn, email, and SEO. After: one clean Shipdaddy dashboard with reviewed launch blocks. Product-led, founder-focused, no invented metrics.',
  },
  {
    id: 'feature-benefit',
    title: 'Feature / Benefit',
    label: 'Image ad prompt',
    format: '16:9',
    prompt:
      'Show one product URL flowing into channel-native launch copy cards, subreddit recommendations, and premium growth panels. Calm SaaS dashboard style, violet accents, crisp hierarchy.',
  },
  {
    id: 'video-hook',
    title: 'URL to launch kit',
    label: 'Video script',
    format: '9:16',
    prompt:
      '0-2s: "Your product is ready. Your launch docs are empty." 3-7s: paste URL. 8-15s: generated brief and channel cards. 16-22s: premium SEO and outreach preview. End: One URL. Focused launch kit.',
  },
]

export const SAMPLE_MEDIA_KIT = {
  oneLiner:
    'Shipdaddy turns one product URL into focused launch copy, subreddit guidance, an email announcement, and a lightweight media kit founders can review and publish.',
  boilerplate:
    'Shipdaddy is a launch-prep workspace for founders. It extracts a structured brief from a product URL and generates platform-native launch copy, subreddit recommendations, email announcements, and media-kit basics. Premium adds SEO growth, backlink planning, reviewed outreach drafts, product demo beats, and creative prompts from the same brief.',
  pressHook:
    'Shipdaddy targets the blank-page work that slows launches: rewriting for each channel, guessing where to post, and turning one product story into a launch kit before expanding into premium growth work.',
}
