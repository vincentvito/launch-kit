export type SampleChannel = {
  id: string
  label: string
  eyebrow: string
  title: string
  body: string
  cta: string
  notes: string
}

export type SampleMediaAsset = {
  id: string
  type: 'image' | 'video'
  title: string
  label: string
  src: string
  aspectRatio: string
  width: number
  height: number
  poster?: string
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

export const SAMPLE_CHANNELS: SampleChannel[] = [
  {
    id: 'product-hunt',
    label: 'Product Hunt',
    eyebrow: 'Launch platform',
    title: 'ShipDaddy - one URL to a focused launch kit',
    body:
      'ShipDaddy turns your product URL into launch work you can actually use: Product Hunt copy, Show HN, Reddit posts, X launch threads, subreddit recommendations, Indie Hackers updates, LinkedIn posts, email announcements, and a lightweight media kit.\n\nIt is built for founders who have the product ready but do not want to lose a week guessing what to say, which subreddit will tolerate a post, or how to explain the same product in every launch room.\n\nPaste the URL. Review the free kit. Post what is ready.',
    cta: 'View the ShipDaddy sample',
    notes: 'Clear promise, concrete outputs, and the painful guessing work it removes.',
  },
  {
    id: 'hacker-news',
    label: 'Hacker News',
    eyebrow: 'Show HN',
    title: 'Show HN: ShipDaddy - URL to launch drafts',
    body:
      'I am building ShipDaddy because launching a product keeps turning into the same chore: rewrite the announcement for every community and figure out where the story fits.\n\nThe first version reads a product URL and generates Product Hunt copy, Show HN, Reddit drafts, X posts, suggested subreddits, LinkedIn copy, an email announcement, and a basic media kit. SEO, backlinks, outreach, product demos, and creative assets are Premium because they are higher-leverage growth work.\n\nIt does not post for you. The goal is to give founders a high-quality first pass so they can review, edit, and publish faster.\n\nI would love feedback on the generated outputs: which channel would you trust least, and what would make it usable?',
    cta: 'Try the sample and critique the output',
    notes: 'Specific, technical, and honest about the workflow boundary.',
  },
  {
    id: 'reddit',
    label: 'Reddit',
    eyebrow: 'Community post',
    title: 'I built a tool that turns one product URL into launch copy',
    body:
      'I like building products. I do not like writing the same launch story eight different ways, then guessing which subreddit will ban me for sounding too promotional.\n\nShipDaddy is my attempt to fix that. You paste a product URL, and it creates Reddit-ready drafts plus subreddit picks like r/SaaS for founder workflow feedback, r/SideProject for a lighter maker post, and r/AlphaandBetaUsers for early testers.\n\nThe point is not to spray generic AI posts everywhere. The point is to start with a post and a place that already fit the channel, then edit like a human before publishing.\n\nIf you launch side projects, what is worse: writing the post, finding the right subreddit, or making it not sound like an ad?',
    cta: 'Reply with your worst launch chore',
    notes: 'Shows both the Reddit draft and where to post it, which is the real time sink.',
  },
  {
    id: 'x',
    label: 'X',
    eyebrow: 'Social thread',
    title: 'X thread: ShipDaddy turns one URL into launch distribution',
    body:
      '1/ Launching should not mean opening ten blank docs.\n\n2/ ShipDaddy reads your product URL and gives you the first pass: Product Hunt copy, Show HN, Reddit post, X post/thread, subreddit picks, LinkedIn copy, email announcement, and a media kit.\n\n3/ The pain is not just writing. It is knowing what angle belongs where. Reddit wants context. X needs a sharp hook. LinkedIn needs a business case.\n\n4/ ShipDaddy handles the first draft and channel map. You review, tighten, and publish.\n\n5/ One URL in. Launch kit out.',
    cta: 'Post the X thread',
    notes: 'Makes the value skimmable: hook, pain, output list, and review-before-posting workflow.',
  },
  {
    id: 'indie-hackers',
    label: 'Indie Hackers',
    eyebrow: 'Build in public',
    title: 'Turning my launch checklist into ShipDaddy',
    body:
      'The pattern I keep seeing: the product is ready, but distribution starts from a blank page.\n\nShipDaddy starts with one URL and creates the first pass of the launch kit: Product Hunt copy, Reddit post, X thread, subreddit recommendations, LinkedIn copy, announcement email, and media kit.\n\nThe opinion: founders should spend launch week choosing, editing, and publishing, not rebuilding the same narrative in ten tabs.\n\nCurrent focus: making the generated work feel sharp enough that the founder immediately knows what to post next.',
    cta: 'Follow the generated launch workflow',
    notes: 'Founder story, product thesis, and a clear build-in-public update.',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    eyebrow: 'Professional social',
    title: 'Founders should not launch from blank documents',
    body:
      'Most product launches need the same first pieces: Product Hunt copy, Show HN, Reddit, X, LinkedIn, email, subreddit guidance, and a media kit.\n\nShipDaddy creates those pieces from one product URL.\n\nIt gives founders the launch copy and where-to-post guidance that usually gets scattered across tabs.\n\nThe founder stays in control. ShipDaddy removes the blank-page work and keeps Premium growth work separate until the launch story is clear.',
    cta: 'Open the ShipDaddy sample',
    notes: 'Executive-readable and precise about the jobs ShipDaddy handles.',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    eyebrow: 'Premium short-form',
    title: 'TikTok Script: Turn the launch brief into a video hook',
    body:
      '0-2s Hook: Your product is ready. Your launch story is still scattered across tabs.\n\n3-7s Problem: Product Hunt, HN, Reddit, X, LinkedIn, email, and press all need a different angle.\n\n8-16s Reveal: ShipDaddy starts with the free launch kit, then Premium turns the confirmed story into short-form video beats.\n\n17-23s Payoff: Record from the brief that already works instead of inventing a new pitch.\n\n24s CTA: View the sample launch kit.',
    cta: 'Unlock the video script',
    notes: 'Keeps short-form useful without making video the core free product.',
  },
  {
    id: 'youtube-shorts',
    label: 'YouTube Shorts',
    eyebrow: 'Premium walkthrough',
    title: 'YouTube Shorts Script: Free launch kit to demo beats',
    body:
      'Open: One product URL gives you the launch story first.\n\nMiddle: Show the free kit: Product Hunt, HN, Reddit, X, LinkedIn, Email, and Media Kit from shipdaddy.ai.\n\nPremium beat: Turn the confirmed story into walkthrough scenes, hooks, and ad variations.\n\nClose: Review the kit, publish the strongest copy, then reuse the same brief for creative.',
    cta: 'Unlock walkthrough beats',
    notes: 'Simple upgrade path: prove the message, then make media from it.',
  },
  {
    id: 'email',
    label: 'Email',
    eyebrow: 'Announcement',
    title: 'Subject: ShipDaddy turns your product URL into a launch engine',
    body:
      'Hi there,\n\nShipDaddy is built for founders who can ship the product, but do not want launch distribution to start from scratch.\n\nPaste your product URL and ShipDaddy generates the free launch kit: Product Hunt copy, Reddit post, X post, subreddit recommendations, LinkedIn post, email announcement, and a media kit ready to review.\n\nYou stay in charge of what gets published. ShipDaddy gives you the first complete pass.\n\nThe sample shows what ShipDaddy generated from shipdaddy.ai.',
    cta: 'View the ShipDaddy sample',
    notes: 'Direct, useful, and clear that the user reviews before publishing.',
  },
]

export const SAMPLE_SUBREDDITS: SampleSubreddit[] = [
  {
    name: 'r/SaaS',
    angle: 'Founder workflow feedback from SaaS builders who understand launch copy and channel-fit pain.',
    guidance: 'Ask for critique on the workflow and generated output quality. Avoid a pure product announcement.',
  },
  {
    name: 'r/SideProject',
    angle: 'A lighter maker post showing the one-URL-to-launch-content transformation.',
    guidance: 'Lead with what you built, show the sample, and ask which output would save the most time.',
  },
  {
    name: 'r/AlphaandBetaUsers',
    angle: 'Early testers who can try generated launch copy and subreddit recommendations from their own URL.',
    guidance: 'Be explicit that it is early access and ask for founders willing to test generated launch content.',
  },
  {
    name: 'r/GrowthHacking',
    angle: 'Distribution workflow angle: launch content, subreddit targeting, and a clear Premium growth path.',
    guidance: 'Frame it as a focused launch workflow first, not a sprawling growth product.',
  },
  {
    name: 'r/startups',
    angle: 'Founder launch discussion for teams trying to turn a finished product into early traction.',
    guidance: 'Ask for feedback on the launch workflow and the first generated outputs. Keep the post practical, not promotional.',
  },
  {
    name: 'r/EntrepreneurRideAlong',
    angle: 'Build-in-public audience that responds to concrete before-and-after launch workflows.',
    guidance: 'Share the one-URL input, the generated output map, and what you would manually edit before posting.',
  },
]

export const SAMPLE_MEDIA_ASSETS: SampleMediaAsset[] = [
  {
    id: 'problem-solution',
    type: 'image',
    title: 'Problem / Solution',
    label: '1:1 image ad',
    src: '/waitlist/sample-assets/problem-solution.png',
    aspectRatio: '1 / 1',
    width: 1024,
    height: 1024,
  },
  {
    id: 'before-after',
    type: 'image',
    title: 'Before / After',
    label: '9:16 image ad',
    src: '/waitlist/sample-assets/before-after.png',
    aspectRatio: '9 / 16',
    width: 768,
    height: 1408,
  },
  {
    id: 'feature-benefit',
    type: 'image',
    title: 'Feature / Benefit',
    label: '16:9 image ad',
    src: '/waitlist/sample-assets/feature-benefit.png',
    aspectRatio: '16 / 9',
    width: 1408,
    height: 768,
  },
  {
    id: 'vertical-hook',
    type: 'video',
    title: 'Hook / Problem / Fix',
    label: '9:16 video ad',
    src: '/waitlist/sample-assets/vertical-hook.mp4',
    aspectRatio: '9 / 16',
    width: 720,
    height: 1280,
    poster: '/waitlist/sample-assets/problem-solution.png',
  },
  {
    id: 'walkthrough',
    type: 'video',
    title: 'Product Walkthrough',
    label: '16:9 video ad',
    src: '/waitlist/sample-assets/walkthrough.mp4',
    aspectRatio: '16 / 9',
    width: 1280,
    height: 720,
    poster: '/waitlist/sample-assets/feature-benefit.png',
  },
]

export const SAMPLE_SEO_PLAN = [
  {
    title: 'AI launch content generator',
    intent: 'Keyword research',
    angle: 'Primary commercial keyword for founders looking to turn one product URL into launch copy.',
  },
  {
    title: 'Best subreddits to launch a SaaS product',
    intent: 'Keyword research',
    angle: 'High-intent query that connects subreddit discovery with launch planning and founder distribution.',
  },
  {
    title: 'Product launch SEO checklist',
    intent: 'Content generation',
    angle: 'Generate a practical checklist covering technical fixes, keyword pages, content cadence, and launch-day search prep.',
  },
  {
    title: 'How to launch on Reddit without sounding like an ad',
    intent: 'Content generation',
    angle: 'Draft an article that turns the Reddit sample and subreddit recommendations into evergreen search content.',
  },
  {
    title: 'Startup directories and launch lists',
    intent: 'Backlink ideas',
    angle: 'Find relevant directories where ShipDaddy can submit a concise listing and reuse the confirmed launch brief.',
  },
  {
    title: 'Founder tool roundups',
    intent: 'Backlink ideas',
    angle: 'Build backlink angles for SaaS tool roundups that mention launch workflows and founder distribution.',
  },
]

export const SAMPLE_OUTREACH = [
  {
    title: 'Founder email draft',
    body:
      'Subject: Quick launch workflow idea for {{company}}\n\nHi {{firstName}},\n\nI noticed {{company}} is preparing new product work. ShipDaddy turns one URL into a focused launch kit first, then Premium can prepare SEO, backlink, and outreach drafts from the same brief.\n\nWant me to send the sample generated from shipdaddy.ai?',
    cta: 'Ready to review',
  },
  {
    title: 'LinkedIn DM',
    body:
      'Hey {{firstName}} - noticed {{company}} is launching new product work. ShipDaddy creates the free launch kit from one URL, then Premium prepares personalized outreach you can review before sending.\n\nWant me to send the sample generated from shipdaddy.ai?',
    cta: 'Send after review',
  },
  {
    title: 'X DM',
    body:
      'Hey {{firstName}} - saw you talking about launch distribution. I am building ShipDaddy: one URL to the core launch kit, with Premium for SEO, backlinks, outreach, and creative once the story is clear.\n\nWorth sending the sample?',
    cta: 'Send after review',
  },
  {
    title: 'Follow-up email',
    body:
      'Subject: Re: launch workflow idea\n\nHi {{firstName}},\n\nQuick follow-up. The useful part of ShipDaddy is starting simple: Product Hunt, HN, Reddit, X, LinkedIn, email, subreddit guidance, and a light media kit from one URL. Premium only kicks in when you want SEO, backlinks, outreach, demo, and creative assets from that same brief.\n\nHappy to send the sample if useful.',
    cta: 'Ready to review',
  },
]

export const SAMPLE_PROSPECTS: SampleProspect[] = [
  {
    name: 'Micro-SaaS founder shipping a new feature',
    segment: 'Scraped potential customer',
    fit: 'Found on a public launch discussion and matched to ShipDaddy because they need Product Hunt, Reddit, X, and outreach help.',
    outreachAngle: 'Premium prepares an email draft offering a sample launch run from their product URL.',
  },
  {
    name: 'Founder tool curator',
    segment: 'Scraped distribution lead',
    fit: 'Found from a public tool roundup covering launch workflows, founder tools, SEO, and early acquisition.',
    outreachAngle: 'Premium prepares a partnership email with the ShipDaddy sample and a practical launch teardown angle.',
  },
  {
    name: 'Startup tools directory',
    segment: 'Scraped listing opportunity',
    fit: 'Found from public directory pages that list launch, marketing, and founder productivity tools.',
    outreachAngle: 'Premium prepares a listing request with a concise blurb, category fit, and optional creative assets.',
  },
]

export const SAMPLE_PRODUCT_DEMO: SampleProductDemo[] = [
  {
    title: '30-second product walkthrough',
    format: 'Demo script',
    draft:
      'Open on shipdaddy.ai. Paste the product URL. Show the free launch kit: Product Hunt, HN, Reddit, X, LinkedIn, email, subreddit picks, and media kit. Then show Premium turning the confirmed story into SEO, backlinks, outreach, demo beats, and creative assets.',
  },
  {
    title: 'Founder voiceover',
    format: 'Narration',
    draft:
      'I do not need another blank document. I paste one URL into ShipDaddy and get the launch copy, where-to-post plan, announcement email, and light media kit ready to review. When the story works, Premium turns it into growth work.',
  },
  {
    title: 'Screen recording checklist',
    format: 'Shot list',
    draft:
      '1. URL input with shipdaddy.ai. 2. Generated output tree. 3. X post and Reddit draft cards. 4. Six subreddit recommendation cards. 5. Email announcement and media kit. 6. Premium product demo script. 7. Premium creative asset row.',
  },
]

export const SAMPLE_MEDIA_KIT = {
  oneLiner:
    'ShipDaddy turns one product URL into focused launch copy, subreddit guidance, an email announcement, and a lightweight media kit founders can review and publish.',
  boilerplate:
    'ShipDaddy is a focused launch kit workspace for founders. It reads a product URL, extracts the positioning, and generates platform-native launch copy, subreddit recommendations, an email announcement, and a lightweight media kit. Premium adds SEO growth, backlink planning, reviewed outreach drafts, product demo beats, and creative assets from the same brief.',
  pressHook:
    'ShipDaddy targets the blank-page work that slows launches: rewriting for each channel, guessing where to post, and turning a finished product into a launch kit before expanding into Premium growth work.',
}
