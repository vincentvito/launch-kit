import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { runReplicatePrediction } from '../lib/launch-kit/replicate'

type AssetJob = {
  kind: 'image' | 'video'
  fileName: string
  model: string
  input: Record<string, unknown>
  waitSeconds: number
  pollTimeoutMs: number
  cancelAfter: string
  imageAd?: 'problem-solution' | 'before-after' | 'feature-benefit'
}

const outputDir = join(process.cwd(), 'public', 'waitlist', 'sample-assets')
const imageModel = process.env.REPLICATE_IMAGE_MODEL || 'google/imagen-4-fast'
const videoModel = process.env.REPLICATE_VIDEO_MODEL || 'google/veo-3.1-fast'

const jobs: AssetJob[] = [
  {
    kind: 'image',
    fileName: 'problem-solution.png',
    model: imageModel,
    input: {
      prompt:
        'Text-free premium background for a ShipDaddy product ad. Dark navy startup UI atmosphere, clean geometric panels, subtle connector lines, one central URL input shape flowing into multiple output card shapes. No words, no letters, no fake text, no logos, no tiny interface labels, no people. High contrast navy, violet, and mint, crisp product-marketing composition, lots of empty space for clear overlay text.',
      aspect_ratio: '1:1',
      output_format: 'png',
      safety_filter_level: 'block_only_high',
    },
    waitSeconds: 10,
    pollTimeoutMs: 480000,
    cancelAfter: '10m',
    imageAd: 'problem-solution',
  },
  {
    kind: 'image',
    fileName: 'before-after.png',
    model: imageModel,
    input: {
      prompt:
        'Text-free vertical transformation background for a ShipDaddy ad. Split-screen feel: left side chaotic blank document shapes, right side calm organized generated output card shapes, with a strong central arrow path. No words, no letters, no fake text, no logos, no tiny UI labels, no people. Dark navy cinematic interface, violet and mint signal colors, clear before-after contrast, empty center space for readable overlay text.',
      aspect_ratio: '9:16',
      output_format: 'png',
      safety_filter_level: 'block_only_high',
    },
    waitSeconds: 10,
    pollTimeoutMs: 480000,
    cancelAfter: '10m',
    imageAd: 'before-after',
  },
  {
    kind: 'image',
    fileName: 'feature-benefit.png',
    model: imageModel,
    input: {
      prompt:
        'Text-free wide product demo background for a ShipDaddy ad. One central product URL input shape branches into a clean output tree of large card shapes and one video/demo preview shape. No words, no letters, no fake text, no logos, no tiny UI labels, no people. Premium dark navy dashboard atmosphere, violet and mint highlights, clear central focal point, empty space for readable overlay text.',
      aspect_ratio: '16:9',
      output_format: 'png',
      safety_filter_level: 'block_only_high',
    },
    waitSeconds: 10,
    pollTimeoutMs: 480000,
    cancelAfter: '10m',
    imageAd: 'feature-benefit',
  },
  {
    kind: 'video',
    fileName: 'vertical-hook.mp4',
    model: videoModel,
    input: {
      prompt:
        'Create an 8-second vertical 9:16 video ad for ShipDaddy. Beat 1: founder pastes shipdaddy.ai and blank cards appear for X, Reddit, Subreddits, SEO, Prospects Agent, Outreach, and Product Demo. Beat 2: the cards fill with visibly different structures: concise X, context-first Reddit, subreddit recommendations, SEO actions, scraped prospects, podcast and investor pitch cards, demo walkthrough beats. Beat 3: outputs light up as one product URL becomes a launch system. Premium product motion, navy violet mint palette, modern sound design, no fake logos, no unreadable text, no unsupported claims.',
      aspect_ratio: '9:16',
      duration: 8,
      resolution: '720p',
      generate_audio: true,
      negative_prompt: 'blurry UI, distorted text, fake logos, watermark, unreadable overlays',
    },
    waitSeconds: 5,
    pollTimeoutMs: 900000,
    cancelAfter: '15m',
  },
  {
    kind: 'video',
    fileName: 'walkthrough.mp4',
    model: videoModel,
    input: {
      prompt:
        'Create an 8-second horizontal 16:9 product walkthrough video for ShipDaddy. Show a polished dashboard where one URL becomes a generated launch map: X posts, Reddit drafts, subreddit recommendations, SEO actions, Prospects Agent lead scraping, personalized outreach pitches for email, LinkedIn, podcast, investors, and a Product Demo script. The pacing should feel practical and founder-led, not generic AI hype. Premium product-marketing motion, dark navy interface, violet and mint highlights, calm confident pacing, no fake logos, no unreadable text.',
      aspect_ratio: '16:9',
      duration: 8,
      resolution: '720p',
      generate_audio: true,
      negative_prompt: 'blurry UI, distorted text, fake logos, watermark, unreadable overlays',
    },
    waitSeconds: 5,
    pollTimeoutMs: 900000,
    cancelAfter: '15m',
  },
]

async function main() {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error('Set REPLICATE_API_TOKEN before running npm run sample:assets.')
  }

  await mkdir(outputDir, { recursive: true })

  const selectedJobs = filterJobs()

  for (const job of selectedJobs) {
    console.log(`Generating ${job.fileName}...`)
    const result = await runReplicatePrediction(job)

    if (!result || result.status !== 'succeeded' || !result.outputUrl) {
      throw new Error(`Replicate failed for ${job.fileName}: ${result?.error || 'no output URL'}`)
    }

    const response = await fetch(result.outputUrl)
    if (!response.ok) {
      throw new Error(`Could not download ${job.fileName}: ${response.status}`)
    }

    const downloaded = Buffer.from(await response.arrayBuffer())
    const buffer = job.imageAd ? await composeImageAd(job.imageAd, downloaded) : downloaded
    await writeFile(join(outputDir, job.fileName), buffer)
    console.log(`Saved ${job.fileName}`)
  }
}

function filterJobs() {
  const requestedKind = process.env.SAMPLE_ASSET_KIND
  const requestedFiles = (process.env.SAMPLE_ASSET_FILES || '')
    .split(',')
    .map((file) => file.trim())
    .filter(Boolean)

  const selected = jobs.filter((job) => {
    if (requestedKind && job.kind !== requestedKind) {
      return false
    }
    if (requestedFiles.length > 0 && !requestedFiles.includes(job.fileName)) {
      return false
    }
    return true
  })

  if (selected.length === 0) {
    throw new Error('No sample asset jobs matched the requested filters.')
  }

  return selected
}

async function composeImageAd(
  imageAd: NonNullable<AssetJob['imageAd']>,
  background: Buffer,
) {
  const sharp = (await import('sharp')).default
  const specs = createImageAdSpec(imageAd)
  const overlay = Buffer.from(createImageAdSvg(specs))

  return sharp(background)
    .resize(specs.width, specs.height, { fit: 'cover' })
    .modulate({ brightness: 0.42, saturation: 0.9 })
    .blur(1.2)
    .composite([{ input: overlay, left: 0, top: 0 }])
    .png()
    .toBuffer()
}

type ImageAdSpec = {
  width: number
  height: number
  title: string
  subtitle: string
  layout: 'problem-solution' | 'before-after' | 'feature-benefit'
}

function createImageAdSpec(imageAd: NonNullable<AssetJob['imageAd']>): ImageAdSpec {
  if (imageAd === 'before-after') {
    return {
      width: 768,
      height: 1408,
      title: 'From blank docs',
      subtitle: 'to launch-ready outputs',
      layout: imageAd,
    }
  }

  if (imageAd === 'feature-benefit') {
    return {
      width: 1408,
      height: 768,
      title: 'One URL becomes launch content',
      subtitle: 'X, Reddit, SEO, prospects, outreach, and Product Demo',
      layout: imageAd,
    }
  }

  return {
    width: 1024,
    height: 1024,
    title: 'shipdaddy.ai',
    subtitle: 'Input URL → generated launch content',
    layout: imageAd,
  }
}

function createImageAdSvg(spec: ImageAdSpec) {
  const content =
    spec.layout === 'before-after'
      ? beforeAfterSvg()
      : spec.layout === 'feature-benefit'
        ? featureBenefitSvg()
        : problemSolutionSvg()

  return `
<svg width="${spec.width}" height="${spec.height}" viewBox="0 0 ${spec.width} ${spec.height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#2d245b" stop-opacity="0.94"/>
      <stop offset="1" stop-color="#121627" stop-opacity="0.96"/>
    </linearGradient>
    <linearGradient id="mint" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#9ff7db"/>
      <stop offset="1" stop-color="#7c5cff"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#000000" flood-opacity="0.36"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="#080b16" fill-opacity="0.56"/>
  <text x="${spec.width / 2}" y="${spec.layout === 'before-after' ? 130 : 86}" text-anchor="middle" fill="#f7f7fb" font-size="${spec.layout === 'feature-benefit' ? 54 : 56}" font-weight="800" font-family="Arial, Helvetica, sans-serif">${escapeXml(spec.title)}</text>
  <text x="${spec.width / 2}" y="${spec.layout === 'before-after' ? 184 : 136}" text-anchor="middle" fill="#cfc2ff" font-size="${spec.layout === 'feature-benefit' ? 26 : 28}" font-weight="700" font-family="Arial, Helvetica, sans-serif">${escapeXml(spec.subtitle)}</text>
  ${content}
</svg>`
}

function problemSolutionSvg() {
  const cards: Array<[string, number, number]> = [
    ['X posts', 568, 318],
    ['Reddit post', 568, 394],
    ['Subreddits', 568, 470],
    ['SEO', 568, 546],
    ['Prospects Agent', 568, 622],
    ['Product Demo', 568, 698],
  ]

  return `
  <g filter="url(#shadow)">
    <rect x="72" y="250" width="360" height="268" rx="34" fill="url(#panel)" stroke="#6d5cff" stroke-width="3"/>
    <text x="112" y="316" fill="#a7f3d0" font-size="24" font-weight="800" font-family="Arial, Helvetica, sans-serif">INPUT URL</text>
    <text x="112" y="390" fill="#ffffff" font-size="48" font-weight="900" font-family="Arial, Helvetica, sans-serif">shipdaddy.ai</text>
    <rect x="112" y="430" width="250" height="34" rx="17" fill="#ffffff" fill-opacity="0.08"/>
    <rect x="112" y="480" width="190" height="26" rx="13" fill="#9ff7db" fill-opacity="0.26"/>
    <circle cx="500" cy="512" r="52" fill="#102034" stroke="#9ff7db" stroke-width="3"/>
    <text x="500" y="530" text-anchor="middle" fill="#9ff7db" font-size="64" font-weight="900" font-family="Arial, Helvetica, sans-serif">→</text>
    <rect x="542" y="222" width="410" height="560" rx="36" fill="url(#panel)" stroke="#9ff7db" stroke-width="3"/>
    <text x="582" y="282" fill="#ffffff" font-size="32" font-weight="900" font-family="Arial, Helvetica, sans-serif">Generated outputs</text>
    ${cards.map(([label, x, y]) => `
      <rect x="${x}" y="${y}" width="318" height="70" rx="20" fill="#ffffff" fill-opacity="0.09" stroke="#ffffff" stroke-opacity="0.16"/>
      <circle cx="${Number(x) + 36}" cy="${Number(y) + 35}" r="15" fill="url(#mint)"/>
      <text x="${Number(x) + 72}" y="${Number(y) + 44}" fill="#f7f7fb" font-size="28" font-weight="800" font-family="Arial, Helvetica, sans-serif">${label}</text>
    `).join('')}
  </g>`
}

function beforeAfterSvg() {
  return `
  <g filter="url(#shadow)">
    <rect x="58" y="305" width="300" height="620" rx="34" fill="#191628" stroke="#ff8cae" stroke-opacity="0.62" stroke-width="3"/>
    <text x="92" y="375" fill="#ffb4c8" font-size="30" font-weight="900" font-family="Arial, Helvetica, sans-serif">BEFORE</text>
    <text x="92" y="430" fill="#ffffff" font-size="38" font-weight="900" font-family="Arial, Helvetica, sans-serif">Blank launch</text>
    <text x="92" y="474" fill="#ffffff" font-size="38" font-weight="900" font-family="Arial, Helvetica, sans-serif">work</text>
    ${['X post', 'Reddit', 'SEO', 'Prospects', 'Outreach', 'Demo'].map((label, index) => `
      <rect x="92" y="${530 + index * 58}" width="${index % 2 === 0 ? 190 : 230}" height="34" rx="17" fill="#ffffff" fill-opacity="0.12"/>
      <text x="110" y="${554 + index * 58}" fill="#d7d5e8" font-size="20" font-weight="700" font-family="Arial, Helvetica, sans-serif">${label}</text>
    `).join('')}
    <circle cx="384" cy="616" r="54" fill="#102034" stroke="#9ff7db" stroke-width="4"/>
    <text x="384" y="635" text-anchor="middle" fill="#9ff7db" font-size="66" font-weight="900" font-family="Arial, Helvetica, sans-serif">→</text>
    <rect x="410" y="305" width="300" height="620" rx="34" fill="url(#panel)" stroke="#9ff7db" stroke-width="3"/>
    <text x="444" y="375" fill="#a7f3d0" font-size="30" font-weight="900" font-family="Arial, Helvetica, sans-serif">AFTER</text>
    <text x="444" y="430" fill="#ffffff" font-size="38" font-weight="900" font-family="Arial, Helvetica, sans-serif">Ready-to-use</text>
    <text x="444" y="474" fill="#ffffff" font-size="38" font-weight="900" font-family="Arial, Helvetica, sans-serif">output cards</text>
    ${['X posts', 'Subreddits', 'SEO', 'Prospects Agent', 'Outreach', 'Product Demo'].map((label, index) => `
      <rect x="444" y="${530 + index * 58}" width="218" height="38" rx="19" fill="#9ff7db" fill-opacity="0.14" stroke="#9ff7db" stroke-opacity="0.34"/>
      <text x="464" y="${556 + index * 58}" fill="#f7f7fb" font-size="${label.length > 13 ? 18 : 21}" font-weight="800" font-family="Arial, Helvetica, sans-serif">${label}</text>
    `).join('')}
  </g>`
}

function featureBenefitSvg() {
  const cards: Array<[string, number, number]> = [
    ['X', 560, 300],
    ['Reddit', 720, 300],
    ['Subreddits', 880, 300],
    ['SEO', 1040, 300],
    ['Prospects Agent', 590, 438],
    ['Outreach', 805, 438],
    ['Product Demo', 1020, 438],
  ]

  return `
  <g filter="url(#shadow)">
    <rect x="234" y="292" width="270" height="170" rx="30" fill="url(#panel)" stroke="#6d5cff" stroke-width="3"/>
    <text x="266" y="352" fill="#a7f3d0" font-size="22" font-weight="900" font-family="Arial, Helvetica, sans-serif">INPUT URL</text>
    <text x="266" y="408" fill="#ffffff" font-size="34" font-weight="900" font-family="Arial, Helvetica, sans-serif">shipdaddy.ai</text>
    <path d="M526 376 C552 376 558 376 584 376" stroke="#9ff7db" stroke-width="8" stroke-linecap="round"/>
    <path d="M568 348 L602 376 L568 404" stroke="#9ff7db" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="530" y="236" width="760" height="370" rx="36" fill="url(#panel)" stroke="#9ff7db" stroke-width="3"/>
    <text x="570" y="282" fill="#ffffff" font-size="30" font-weight="900" font-family="Arial, Helvetica, sans-serif">Generated launch system</text>
    ${cards.map(([label, x, y]) => `
      <rect x="${x}" y="${y}" width="${label.length > 10 ? 190 : 150}" height="92" rx="22" fill="#ffffff" fill-opacity="0.09" stroke="#ffffff" stroke-opacity="0.16"/>
      <circle cx="${Number(x) + 30}" cy="${Number(y) + 32}" r="14" fill="url(#mint)"/>
      <text x="${Number(x) + 24}" y="${Number(y) + 68}" fill="#f7f7fb" font-size="${label.length > 12 ? 20 : 24}" font-weight="850" font-family="Arial, Helvetica, sans-serif">${label}</text>
    `).join('')}
    <text x="704" y="670" text-anchor="middle" fill="#cfc2ff" font-size="28" font-weight="800" font-family="Arial, Helvetica, sans-serif">Review it. Post it. Launch everywhere.</text>
  </g>`
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
