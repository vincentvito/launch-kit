import {
  PLATFORM_IDS,
  PLATFORM_LABELS,
  type LaunchProjectSnapshot,
  type RedditRecommendations,
  type SubredditRecommendation,
} from '@/lib/launch-kit/types'

export function renderLaunchKitMarkdown(project: LaunchProjectSnapshot): string {
  const lines: string[] = []
  lines.push(`# Launch Kit: ${project.name}`)
  lines.push('')
  lines.push(`- Source URL: ${project.sourceUrl}`)
  lines.push(`- Language: ${project.language}`)
  lines.push(`- Updated: ${new Date(project.updatedAt).toISOString()}`)
  lines.push('')

  lines.push('## Product Brief')
  lines.push('')
  lines.push(`**Product**: ${project.brief.productName}`)
  lines.push('')
  lines.push(`**Positioning**: ${project.brief.positioning}`)
  lines.push('')
  lines.push(`**ICP**: ${project.brief.icp}`)
  lines.push('')
  lines.push('**Pain Points**')
  for (const value of project.brief.painPoints) {
    lines.push(`- ${value}`)
  }
  lines.push('')

  lines.push('**Value Props**')
  for (const value of project.brief.valueProps) {
    lines.push(`- ${value}`)
  }
  lines.push('')

  lines.push('**Target Users**')
  for (const value of project.brief.targetUsers) {
    lines.push(`- ${value}`)
  }
  lines.push('')

  lines.push('**Proof Points**')
  for (const value of project.brief.proofPoints) {
    lines.push(`- ${value}`)
  }
  lines.push('')

  lines.push('**Primary CTA**')
  lines.push(project.brief.cta)
  lines.push('')

  lines.push('## Keyword Research')
  lines.push('')
  lines.push(project.brief.keywordResearch.notes || 'No notes provided.')
  lines.push('')
  for (const cluster of project.brief.keywordResearch.clusters) {
    lines.push(`### ${cluster.topic}`)
    lines.push(`- Intent: ${cluster.intent}`)
    lines.push(`- Priority: ${cluster.priority}`)
    lines.push('- Keywords:')
    for (const keyword of cluster.keywords) {
      lines.push(`  - ${keyword}`)
    }
    lines.push('- Content Angles:')
    for (const angle of cluster.contentAngles) {
      lines.push(`  - ${angle}`)
    }
    lines.push('')
  }

  lines.push('## Platform Blocks')
  lines.push('')

  for (const blockId of PLATFORM_IDS) {
    const block = project.kit.platformBlocks[blockId]
    lines.push(`### ${PLATFORM_LABELS[blockId]}`)
    lines.push('')
    lines.push(`**Title**: ${block.title}`)
    lines.push('')
    lines.push(block.body)
    lines.push('')
    lines.push(`**CTA**: ${block.cta}`)
    lines.push('')
    lines.push(`**Notes**: ${block.notes}`)
    lines.push('')

    if (blockId === 'reddit' && block.redditRecommendations) {
      appendRedditRecommendationsMarkdown(lines, block.redditRecommendations)
    }
  }

  lines.push('## Media Kit')
  lines.push('')
  lines.push(`**Founder/Company Bio**\n\n${project.kit.mediaKit.founderCompanyBio}`)
  lines.push('')
  lines.push(`**Product One-liner**\n\n${project.kit.mediaKit.productOneLiner}`)
  lines.push('')
  lines.push(`**Boilerplate**\n\n${project.kit.mediaKit.boilerplate}`)
  lines.push('')
  lines.push(`**Press Release**\n\n${project.kit.mediaKit.pressRelease}`)
  lines.push('')
  lines.push('**Key Visuals / Assets Checklist**')
  for (const item of project.kit.mediaKit.keyVisualsChecklist) {
    lines.push(`- ${item}`)
  }
  lines.push('')
  lines.push(`**Screenshots & Logos**\n\n${project.kit.mediaKit.screenshotsAndLogos}`)
  lines.push('')
  lines.push(`**Contact Details**\n\n${project.kit.mediaKit.contactDetails}`)
  lines.push('')

  lines.push('## Growth Assets')
  lines.push('')
  lines.push('### LinkedIn Outreach Variants')
  lines.push(project.kit.growthAssets.linkedinOutreach.notes || '')
  lines.push('')
  for (const variant of project.kit.growthAssets.linkedinOutreach.variants) {
    lines.push(`- ${variant.title}: ${variant.message}`)
    lines.push(`  CTA: ${variant.cta}`)
  }
  lines.push('')

  lines.push('### X Outreach Variants')
  lines.push(project.kit.growthAssets.xOutreach.notes || '')
  lines.push('')
  for (const variant of project.kit.growthAssets.xOutreach.variants) {
    lines.push(`- ${variant.title}: ${variant.message}`)
    lines.push(`  CTA: ${variant.cta}`)
  }
  lines.push('')

  lines.push('### Cold Email Variants')
  lines.push(project.kit.growthAssets.emailOutreach.notes || '')
  lines.push('')
  for (const variant of project.kit.growthAssets.emailOutreach.variants) {
    lines.push(`- ${variant.title} | Subject: ${variant.subject || ''}`)
    lines.push(`  ${variant.message}`)
    lines.push(`  CTA: ${variant.cta}`)
  }
  lines.push('')

  lines.push('### SEO Blog Packs')
  lines.push('')
  for (const pack of project.kit.growthAssets.seoPostPacks) {
    lines.push(`- ${pack.title}`)
    lines.push(`  Cluster: ${pack.keywordTopic}`)
    lines.push(`  Meta: ${pack.metaDescription}`)
  }
  lines.push('')

  lines.push('## Prospecting')
  lines.push('')
  lines.push(`- Leads: ${project.kit.prospecting.leads.length}`)
  lines.push(`- Personalized outreach items: ${project.kit.prospecting.personalizedOutreach.length}`)
  lines.push(`- Email jobs (stub): ${project.kit.prospecting.emailJobs.length}`)
  lines.push(`- Last scrape at: ${project.kit.prospecting.lastScrapeAt || 'N/A'}`)
  lines.push(`- Last email build at: ${project.kit.prospecting.lastEmailBuildAt || 'N/A'}`)
  lines.push('')

  lines.push('## SEO Growth')
  lines.push('')
  if (project.kit.seoGrowth.websiteAnalysis) {
    lines.push('### Website SEO Analysis')
    lines.push(`- Score: ${project.kit.seoGrowth.websiteAnalysis.score}/100`)
    lines.push(project.kit.seoGrowth.websiteAnalysis.summary)
    lines.push('')
  }

  lines.push('### Blog Strategy')
  for (const post of project.kit.seoGrowth.blogStrategy) {
    lines.push(`- Day ${post.dayOffset + 1}: ${post.title}`)
    lines.push(`  Cluster: ${post.keywordTopic}`)
    lines.push(`  Tables: ${post.tableIdeas.join(' | ')}`)
  }
  lines.push('')

  lines.push('### Free Tool Suggestions')
  for (const tool of project.kit.seoGrowth.freeTools) {
    lines.push(`- ${tool.title}: ${tool.url}`)
  }
  lines.push('')

  lines.push('### Backlink Prospects')
  for (const prospect of project.kit.seoGrowth.backlinkProspects) {
    lines.push(`- ${prospect.title} (${prospect.domain})`)
    lines.push(`  Value score: ${prospect.valueScore}`)
    lines.push(`  Status: ${prospect.status}`)
    lines.push(`  Cost: ${prospect.costToList ?? 'unknown'}`)
    lines.push(`  Estimated traffic: ${prospect.estimatedTraffic ?? 'unknown'}`)
  }
  lines.push('')

  return lines.join('\n')
}

function appendRedditRecommendationsMarkdown(
  lines: string[],
  recommendations: RedditRecommendations,
) {
  appendSubredditRecommendationMarkdown(
    lines,
    'Relevant Subreddits to Engage In',
    recommendations.engagementSubreddits,
  )
  appendSubredditRecommendationMarkdown(
    lines,
    'Self-Promotion Candidate Subreddits',
    recommendations.selfPromotionSubreddits,
  )
}

function appendSubredditRecommendationMarkdown(
  lines: string[],
  title: string,
  recommendations: SubredditRecommendation[],
) {
  if (!recommendations.length) {
    return
  }

  lines.push(`#### ${title}`)
  for (const recommendation of recommendations) {
    lines.push(`- ${recommendation.name}: ${recommendation.url}`)
    lines.push(`  Reason: ${recommendation.reason}`)
    lines.push(`  Posting guidance: ${recommendation.postingGuidance}`)
  }
  lines.push('')
}

export function renderPressPackHtml(project: LaunchProjectSnapshot): string {
  const media = project.kit.mediaKit
  const now = new Date(project.updatedAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const list = media.keyVisualsChecklist.map((item) => `<li>${escapeHtml(item)}</li>`).join('')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(project.name)} - Press Pack</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "ui-serif", Georgia, Cambria, "Times New Roman", Times, serif;
      }
      body {
        margin: 0;
        background: #f6f8fb;
        color: #18212f;
      }
      .page {
        max-width: 840px;
        margin: 32px auto;
        background: #ffffff;
        border: 1px solid #d7deea;
        border-radius: 18px;
        padding: 40px;
        box-shadow: 0 20px 45px rgba(20, 28, 45, 0.08);
      }
      h1, h2 {
        margin: 0 0 10px;
        line-height: 1.2;
      }
      h1 {
        font-size: 38px;
      }
      h2 {
        margin-top: 28px;
        font-size: 20px;
      }
      p {
        margin: 0 0 12px;
        line-height: 1.62;
        white-space: pre-wrap;
      }
      ul {
        margin: 10px 0 0;
      }
      .meta {
        color: #536176;
        font-size: 14px;
      }
      .divider {
        height: 1px;
        background: #d7deea;
        margin: 24px 0;
      }
      @media print {
        body {
          background: #ffffff;
        }
        .page {
          margin: 0;
          border: none;
          box-shadow: none;
          max-width: none;
          border-radius: 0;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <h1>${escapeHtml(project.name)} Press Pack</h1>
      <p class="meta">Source: ${escapeHtml(project.sourceUrl)}<br/>Updated: ${escapeHtml(now)}</p>
      <div class="divider"></div>

      <h2>Founder / Company Bio</h2>
      <p>${escapeHtml(media.founderCompanyBio)}</p>

      <h2>Product One-liner</h2>
      <p>${escapeHtml(media.productOneLiner)}</p>

      <h2>Boilerplate</h2>
      <p>${escapeHtml(media.boilerplate)}</p>

      <h2>Press Release</h2>
      <p>${escapeHtml(media.pressRelease)}</p>

      <h2>Key Visuals / Assets Checklist</h2>
      <ul>${list}</ul>

      <h2>Screenshots & Logos</h2>
      <p>${escapeHtml(media.screenshotsAndLogos)}</p>

      <h2>Contact Details</h2>
      <p>${escapeHtml(media.contactDetails)}</p>
    </main>
  </body>
</html>`
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
