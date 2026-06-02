'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import {
  BarChart3,
  BookOpenText,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  ImageIcon,
  Layers3,
  Link2,
  ListPlus,
  Lock,
  Mail,
  MessageSquareText,
  Monitor,
  Search,
  Send,
  Video,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  type BacklinkProspectStatus,
  type ChannelCard,
  type ChannelPackId,
  type ExtractedBrief,
  type GeneratedLaunchAsset,
  type GrowthBlockId,
  type LaunchAssetFormat,
  type LaunchAssetKind,
  type LaunchKit,
  type PlatformBlockId,
  type SubredditRecommendation,
} from '@/lib/launch-kit/types'
import {
  ASSET_NAV_ITEMS,
  BACKLINK_STATUS_OPTIONS,
  DEFAULT_OPEN_TRAFFIC_GROUPS,
  MARKETPLACE_CHANNEL_URLS,
  TRAFFIC_CHANNEL_GROUPS,
  isPremiumAssetKind,
  isPremiumTrafficChannel,
  type ResultBrowserSection,
  type TrafficChannelGroupId,
  type TrafficChannelId,
} from './dashboard-config'
import { editorialSerif } from './dashboard-fonts'
import { FilterField, MediaField } from './dashboard-ui'
import {
  formatCost,
  formatTraffic,
  getChannelPackIdForTrafficChannel,
  getGrowthBlockIdForTrafficChannel,
  getPlatformBlockIdForTrafficChannel,
  isPlaybookChannel,
} from './dashboard-utils'

// react-doctor-disable-next-line react-doctor/no-giant-component
export function ResultAssetBrowser({
  brief,
  kit,
  activeSection,
  activeChannel,
  activeAssetKind,
  onChannelChange,
  onAssetKindChange,
  onGenerateAsset,
  generatingAssetKey,
  onCopyChannelCard,
  onUpdateChannelCard,
  onRegenerateChannelCard,
  onCopyPlatformBlock,
  onRegeneratePlatformBlock,
  onCopyGrowthBlock,
  onRegenerateGrowthBlock,
  onExportMarkdown,
  onOpenPressPack,
  isGenerating,
  feedbackText,
  filteredProspects,
  selectedProspectIds,
  backlinkSearch,
  backlinkListFilter,
  backlinkMaxCost,
  backlinkMinTraffic,
  backlinkMinValue,
  backlinkListName,
  isSeoActionRunning,
  onBacklinkSearchChange,
  onBacklinkListFilterChange,
  onBacklinkMaxCostChange,
  onBacklinkMinTrafficChange,
  onBacklinkMinValueChange,
  onBacklinkListNameChange,
  onRunSeoAnalysis,
  onRunBlogStrategy,
  onRunBacklinkProspects,
  onToggleProspect,
  onAddToList,
  onBacklinkStatusChange,
  onPersonalizeBacklinkEmails,
  onSendBacklinkEmails,
  onExportBacklinks,
  selectedLeadIds,
  onToggleLead,
  emailImportText,
  onEmailImportTextChange,
  isEmailActionRunning,
  onScrapeEmailContacts,
  onBuildEmailList,
  onImportEmailList,
  onPersonalizeEmailOutreach,
  onSendOutreachEmail,
  labels,
  t,
}: {
  brief: ExtractedBrief | null
  kit: LaunchKit
  activeSection: ResultBrowserSection
  activeChannel: TrafficChannelId
  activeAssetKind: LaunchAssetKind
  onChannelChange: (channelId: TrafficChannelId) => void
  onAssetKindChange: (assetKind: LaunchAssetKind) => void
  onGenerateAsset: (templateId: string, format: LaunchAssetFormat) => void
  generatingAssetKey: string
  onCopyChannelCard: (channelId: ChannelPackId, cardId: string) => void
  onUpdateChannelCard: (
    channelId: ChannelPackId,
    cardId: string,
    changes: Pick<ChannelCard, 'title' | 'body' | 'cta'>,
  ) => void
  onRegenerateChannelCard: (channelId: ChannelPackId, cardId: string) => void
  onCopyPlatformBlock: (blockId: PlatformBlockId) => void
  onRegeneratePlatformBlock: (blockId: PlatformBlockId) => void
  onCopyGrowthBlock: (blockId: GrowthBlockId) => void
  onRegenerateGrowthBlock: (blockId: GrowthBlockId) => void
  onExportMarkdown: () => void
  onOpenPressPack: () => void
  isGenerating: boolean
  feedbackText: string
  filteredProspects: LaunchKit['seoGrowth']['backlinkProspects']
  selectedProspectIds: string[]
  backlinkSearch: string
  backlinkListFilter: string
  backlinkMaxCost: string
  backlinkMinTraffic: string
  backlinkMinValue: string
  backlinkListName: string
  isSeoActionRunning: boolean
  onBacklinkSearchChange: (value: string) => void
  onBacklinkListFilterChange: (value: string) => void
  onBacklinkMaxCostChange: (value: string) => void
  onBacklinkMinTrafficChange: (value: string) => void
  onBacklinkMinValueChange: (value: string) => void
  onBacklinkListNameChange: (value: string) => void
  onRunSeoAnalysis: () => void
  onRunBlogStrategy: () => void
  onRunBacklinkProspects: () => void
  onToggleProspect: (prospectId: string) => void
  onAddToList: () => void
  onBacklinkStatusChange: (prospectId: string, status: BacklinkProspectStatus) => void
  onPersonalizeBacklinkEmails: () => void
  onSendBacklinkEmails: () => void
  onExportBacklinks: () => void
  selectedLeadIds: string[]
  onToggleLead: (leadId: string) => void
  emailImportText: string
  onEmailImportTextChange: (value: string) => void
  isEmailActionRunning: boolean
  onScrapeEmailContacts: () => void
  onBuildEmailList: () => void
  onImportEmailList: () => void
  onPersonalizeEmailOutreach: () => void
  onSendOutreachEmail: () => void
  labels: {
    title: string
    subtitle: string
    mediaKit: {
      title: string
      exportMarkdown: string
      openPressPack: string
      fields: {
        bio: string
        oneLiner: string
        boilerplate: string
        pressRelease: string
        checklist: string
        screenshots: string
        contact: string
      }
    }
    output: {
      copy: string
      regenerate: string
      title: string
      body: string
      cta: string
      notes: string
      subject: string
      outline: string
      format: string
      stage: string
      proofPoint: string
      socialContract: string
      emptyChannelPack: string
      redditEngagement: string
      redditSelfPromotion: string
      redditReason: string
      redditPostingGuidance: string
      emptyOutreach: string
      emptySeo: string
    }
  }
  t: (key: string, values?: Record<string, string | number>) => string
}) {
  const [openGroups, setOpenGroups] = useState<Record<TrafficChannelGroupId, boolean>>(
    DEFAULT_OPEN_TRAFFIC_GROUPS,
  )
  const channelPackId = getChannelPackIdForTrafficChannel(activeChannel)
  const platformBlockId = getPlatformBlockIdForTrafficChannel(activeChannel)
  const growthBlockId = getGrowthBlockIdForTrafficChannel(activeChannel)
  const activeChannelTitle = t(`results.channels.${activeChannel}.title`)
  const activeChannelIsPremium = isPremiumTrafficChannel(activeChannel)
  const activeAssetIsPremium = isPremiumAssetKind(activeAssetKind)

  const toggleGroup = (groupId: TrafficChannelGroupId) => {
    setOpenGroups((current) => ({ ...current, [groupId]: !current[groupId] }))
  }

  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-3 shadow-sm">
      <div className="grid gap-3 md:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-violet-100 bg-violet-50/45 p-3 md:sticky md:top-24 md:max-h-[calc(100vh-7rem)] md:overflow-y-auto">
          <div className="mb-3">
            <h3 className={`${editorialSerif.className} text-xl leading-tight text-zinc-900`}>
              {labels.title}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600">{labels.subtitle}</p>
          </div>

          <div className="space-y-2">
            <div className="rounded-lg border border-violet-100 bg-white/70 p-2">
              <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                {t('results.sidebar.channels')}
              </p>
              <div className="space-y-2">
                {TRAFFIC_CHANNEL_GROUPS.map((group) => {
                  const isOpen = openGroups[group.id]

                  return (
                    <div key={group.id} className="rounded-lg border border-violet-100 bg-white/75">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.id)}
                        className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left"
                      >
                        <span>
                          <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                            {t(`results.channelGroups.${group.id}.title`)}
                          </span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">
                            {t(`results.channelGroups.${group.id}.description`)}
                          </span>
                        </span>
                        {isOpen ? (
                          <ChevronUp className="mt-0.5 size-4 shrink-0 text-violet-600" />
                        ) : (
                          <ChevronDown className="mt-0.5 size-4 shrink-0 text-violet-600" />
                        )}
                      </button>

                      {isOpen ? (
                        <div className="space-y-1.5 border-t border-violet-100 p-2">
                          {group.channels.map((channelId) => {
                            const isActive = activeSection === 'channels' && activeChannel === channelId
                            const isPremium = isPremiumTrafficChannel(channelId)

                            return (
                              <button
                                key={channelId}
                                type="button"
                                onClick={() => onChannelChange(channelId)}
                                aria-current={isActive ? 'page' : undefined}
                                className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
                                  isActive
                                    ? 'border-violet-500 bg-violet-600 text-white shadow-sm shadow-violet-500/20'
                                    : 'border-violet-100 bg-white text-zinc-700 hover:border-violet-300 hover:bg-violet-50'
                                }`}
                              >
                                <span className={isActive ? 'text-white' : 'text-violet-600'}>
                                  <TrafficChannelIcon channelId={channelId} />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate">{t(`results.channels.${channelId}.title`)}</span>
                                  <span className={`block truncate text-[11px] ${isActive ? 'text-violet-100' : 'text-zinc-500'}`}>
                                    {t(`results.channels.${channelId}.description`)}
                                  </span>
                                </span>
                                {isPremium ? (
                                  <span
                                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                                      isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {t('plans.badges.premium')}
                                  </span>
                                ) : null}
                              </button>
                            )
                          })}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-lg border border-violet-100 bg-white/70 p-2">
              <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                {t('results.sidebar.assets')}
              </p>
              <div className="space-y-1.5">
                {ASSET_NAV_ITEMS.map((assetKind) => {
                  const isActive = activeSection === 'assets' && activeAssetKind === assetKind
                  const isPremium = isPremiumAssetKind(assetKind)

                  return (
                    <button
                      key={assetKind}
                      type="button"
                      onClick={() => onAssetKindChange(assetKind)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
                        isActive
                          ? 'border-violet-500 bg-violet-600 text-white shadow-sm shadow-violet-500/20'
                          : 'border-violet-100 bg-white text-zinc-700 hover:border-violet-300 hover:bg-violet-50'
                      }`}
                    >
                      <span className={isActive ? 'text-white' : 'text-violet-600'}>
                        <AssetKindIcon assetKind={assetKind} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{t(`results.assets.kinds.${assetKind}.title`)}</span>
                        <span className={`block truncate text-[11px] ${isActive ? 'text-violet-100' : 'text-zinc-500'}`}>
                          {t(`results.assets.kinds.${assetKind}.description`)}
                        </span>
                      </span>
                      {isPremium ? (
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
                            isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t('plans.badges.premium')}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 rounded-xl border border-violet-100 bg-violet-50/30 p-3">
          {activeSection === 'channels' && activeChannelIsPremium ? (
            <PremiumGatePanel
              title={activeChannelTitle}
              description={t('plans.paywall.channelDescription', { feature: activeChannelTitle })}
              bullets={[
                t('plans.paywall.bullets.seo'),
                t('plans.paywall.bullets.outreach'),
                t('plans.paywall.bullets.assets'),
              ]}
              t={t}
            />
          ) : activeSection === 'channels' ? (
            <>
              {channelPackId ? (
                <ChannelPackPanel
                  pack={kit.channelPacks[channelPackId]}
                  onCopyCard={(cardId) => onCopyChannelCard(channelPackId, cardId)}
                  onUpdateCard={(cardId, changes) => onUpdateChannelCard(channelPackId, cardId, changes)}
                  onRegenerateCard={(cardId) => onRegenerateChannelCard(channelPackId, cardId)}
                  isGenerating={isGenerating}
                  feedbackText={feedbackText}
                  labels={labels.output}
                />
              ) : null}

              {!channelPackId && platformBlockId ? (
                <PlatformBlockPanel
                  displayLabel={activeChannelTitle}
                  block={kit.platformBlocks[platformBlockId]}
                  onCopy={() => onCopyPlatformBlock(platformBlockId)}
                  onRegenerate={() => onRegeneratePlatformBlock(platformBlockId)}
                  isGenerating={isGenerating}
                  feedbackText={feedbackText}
                  labels={labels.output}
                />
              ) : null}

          {growthBlockId ? (
            <GrowthBlockPanel
              displayLabel={activeChannelTitle}
              blockId={growthBlockId}
              kit={kit}
              onCopy={() => onCopyGrowthBlock(growthBlockId)}
              onRegenerate={() => onRegenerateGrowthBlock(growthBlockId)}
              isGenerating={isGenerating}
              feedbackText={feedbackText}
              labels={labels.output}
            />
          ) : null}

          {activeChannel === 'website_seo' ? (
            <SeoAnalysisChannelPanel
              kit={kit}
              onRunSeoAnalysis={onRunSeoAnalysis}
              isSeoActionRunning={isSeoActionRunning}
              t={t}
            />
          ) : null}

          {activeChannel === 'keyword_research' ? (
            <KeywordResearchChannelPanel brief={brief} t={t} />
          ) : null}

          {activeChannel === 'blog_cadence' ? (
            <BlogCadenceChannelPanel
              kit={kit}
              isSeoActionRunning={isSeoActionRunning}
              onRunBlogStrategy={onRunBlogStrategy}
              onCopySeoPosts={() => onCopyGrowthBlock('seo_posts')}
              onRegenerateSeoPosts={() => onRegenerateGrowthBlock('seo_posts')}
              isGenerating={isGenerating}
              feedbackText={feedbackText}
              outputLabels={labels.output}
              t={t}
            />
          ) : null}

          {activeChannel === 'geo_llm_visibility' ? (
            <GeoVisibilityChannelPanel kit={kit} brief={brief} onRunSeoAnalysis={onRunSeoAnalysis} t={t} />
          ) : null}

          {activeChannel === 'email_scrape_contacts' ? (
            <EmailContactsChannelPanel
              kit={kit}
              selectedLeadIds={selectedLeadIds}
              onToggleLead={onToggleLead}
              onScrapeEmailContacts={onScrapeEmailContacts}
              onBuildEmailList={onBuildEmailList}
              isEmailActionRunning={isEmailActionRunning}
              t={t}
            />
          ) : null}

          {activeChannel === 'email_import_list' ? (
            <EmailImportChannelPanel
              value={emailImportText}
              onChange={onEmailImportTextChange}
              onImport={onImportEmailList}
              isEmailActionRunning={isEmailActionRunning}
              t={t}
            />
          ) : null}

          {activeChannel === 'email_automation' ? (
            <EmailAutomationChannelPanel
              kit={kit}
              selectedLeadIds={selectedLeadIds}
              onPersonalizeEmailOutreach={onPersonalizeEmailOutreach}
              onSendOutreachEmail={onSendOutreachEmail}
              isEmailActionRunning={isEmailActionRunning}
              outputLabels={labels.output}
              onCopyAnnouncement={() => onCopyPlatformBlock('email_announcement')}
              onRegenerateAnnouncement={() => onRegeneratePlatformBlock('email_announcement')}
              onCopyColdEmail={() => onCopyGrowthBlock('cold_email_outreach')}
              onRegenerateColdEmail={() => onRegenerateGrowthBlock('cold_email_outreach')}
              isGenerating={isGenerating}
              feedbackText={feedbackText}
              t={t}
            />
          ) : null}

          {activeChannel === 'backlink_building' ? (
            <BacklinkChannelPanel
              kit={kit}
              filteredProspects={filteredProspects}
              selectedProspectIds={selectedProspectIds}
              search={backlinkSearch}
              listFilter={backlinkListFilter}
              maxCost={backlinkMaxCost}
              minTraffic={backlinkMinTraffic}
              minValue={backlinkMinValue}
              listName={backlinkListName}
              isSeoActionRunning={isSeoActionRunning}
              onSearchChange={onBacklinkSearchChange}
              onListFilterChange={onBacklinkListFilterChange}
              onMaxCostChange={onBacklinkMaxCostChange}
              onMinTrafficChange={onBacklinkMinTrafficChange}
              onMinValueChange={onBacklinkMinValueChange}
              onListNameChange={onBacklinkListNameChange}
              onRunBacklinkProspects={onRunBacklinkProspects}
              onToggleProspect={onToggleProspect}
              onAddToList={onAddToList}
              onStatusChange={onBacklinkStatusChange}
              onPersonalizeEmails={onPersonalizeBacklinkEmails}
              onSendEmails={onSendBacklinkEmails}
              onExportBacklinks={onExportBacklinks}
              t={t}
            />
          ) : null}

          {activeChannel === 'media_kit' ? (
            <MediaKitChannelPanel
              kit={kit}
              labels={labels.mediaKit}
              onExportMarkdown={onExportMarkdown}
              onOpenPressPack={onOpenPressPack}
            />
          ) : null}

              {isPlaybookChannel(activeChannel) ? (
                <TrafficPlaybookPanel
                  channelId={activeChannel}
                  brief={brief}
                  kit={kit}
                  websiteUrl={MARKETPLACE_CHANNEL_URLS[activeChannel]}
                  t={t}
                />
              ) : null}
            </>
          ) : activeAssetIsPremium ? (
            <PremiumGatePanel
              title={t(`results.assets.kinds.${activeAssetKind}.title`)}
              description={t('plans.paywall.assetDescription', {
                feature: t(`results.assets.kinds.${activeAssetKind}.title`),
              })}
              bullets={[
                t('plans.paywall.bullets.creative'),
                t('plans.paywall.bullets.demo'),
                t('plans.paywall.bullets.exports'),
              ]}
              t={t}
            />
          ) : (
            <AssetLibraryPanel
              brief={brief}
              kit={kit}
              activeAssetKind={activeAssetKind}
              onGenerateAsset={onGenerateAsset}
              generatingAssetKey={generatingAssetKey}
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function TrafficChannelIcon({ channelId }: { channelId: TrafficChannelId }) {
  if (channelId === 'trustmrr' || channelId === 'acquire_com' || channelId === 'flippa') {
    return <BarChart3 className="size-4" />
  }

  if (
    channelId === 'website_seo' ||
    channelId === 'keyword_research' ||
    channelId === 'blog_cadence' ||
    channelId === 'geo_llm_visibility' ||
    channelId === 'comparison_alternatives'
  ) {
    return <Search className="size-4" />
  }

  if (
    channelId === 'email_scrape_contacts' ||
    channelId === 'email_import_list' ||
    channelId === 'email_automation' ||
    channelId === 'email_announcement' ||
    channelId === 'linkedin_outreach' ||
    channelId === 'x_outreach' ||
    channelId === 'cold_email_outreach' ||
    channelId === 'newsletter_partnerships'
  ) {
    return <Mail className="size-4" />
  }

  if (
    channelId === 'backlink_building' ||
    channelId === 'guest_posts' ||
    channelId === 'partner_pages' ||
    channelId === 'directory_outreach'
  ) {
    return <Link2 className="size-4" />
  }

  if (channelId === 'media_kit' || channelId === 'pr_pitch' || channelId === 'podcast_pitch') {
    return <FileSpreadsheet className="size-4" />
  }

  return <Layers3 className="size-4" />
}

function AssetKindIcon({ assetKind }: { assetKind: LaunchAssetKind }) {
  if (assetKind === 'screenshots') {
    return <Monitor className="size-4" />
  }

  if (assetKind === 'image_ads') {
    return <ImageIcon className="size-4" />
  }

  if (assetKind === 'video_ads') {
    return <Video className="size-4" />
  }

  return <MessageSquareText className="size-4" />
}

function PremiumGatePanel({
  title,
  description,
  bullets,
  t,
}: {
  title: string
  description: string
  bullets: string[]
  t: (key: string, values?: Record<string, string | number>) => string
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-amber-200 bg-white">
      <div className="border-b border-amber-100 bg-[linear-gradient(135deg,#fffbeb_0%,#fff_55%,#f5f3ff_100%)] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-1 rounded-xl border border-amber-200 bg-white p-2 text-amber-700 shadow-sm">
              <Lock className="size-4" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                {t('plans.badges.premium')}
              </p>
              <h3 className={`${editorialSerif.className} mt-1 text-2xl leading-tight text-zinc-900`}>
                {title}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">{description}</p>
            </div>
          </div>
          <Button
            asChild
            className="shrink-0 rounded-xl bg-zinc-900 text-white shadow-md shadow-zinc-900/20 hover:bg-zinc-800"
          >
            <Link href="/pricing">{t('plans.paywall.cta')}</Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-3">
        {bullets.map((bullet) => (
          <div key={bullet} className="rounded-xl border border-violet-100 bg-violet-50/45 p-3">
            <p className="text-sm leading-relaxed text-zinc-700">{bullet}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function AssetLibraryPanel({
  brief,
  kit,
  activeAssetKind,
  onGenerateAsset,
  generatingAssetKey,
  t,
}: {
  brief: ExtractedBrief | null
  kit: LaunchKit
  activeAssetKind: LaunchAssetKind
  onGenerateAsset: (templateId: string, format: LaunchAssetFormat) => void
  generatingAssetKey: string
  t: (key: string, values?: Record<string, string | number>) => string
}) {
  const [selectedFormats, setSelectedFormats] = useState<Record<string, LaunchAssetFormat>>({})
  const [copiedKey, setCopiedKey] = useState('')
  const templates = kit.assetLibrary.templates.filter((template) => template.kind === activeAssetKind)

  const copyValue = async (key: string, value: string) => {
    if (!value) {
      return
    }

    await navigator.clipboard.writeText(value)
    setCopiedKey(key)
    window.setTimeout(() => setCopiedKey(''), 1400)
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-violet-100 bg-white p-4">
        <div className="flex items-start gap-3">
          <span className="mt-1 rounded-lg border border-violet-100 bg-violet-50 p-2 text-violet-700">
            <AssetKindIcon assetKind={activeAssetKind} />
          </span>
          <div>
            <h3 className={`${editorialSerif.className} text-xl leading-tight text-zinc-900`}>
              {t(`results.assets.kinds.${activeAssetKind}.title`)}
            </h3>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-zinc-600">
              {t(`results.assets.kinds.${activeAssetKind}.description`)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {templates.map((template) => {
          const selectedFormat =
            selectedFormats[template.id] || template.recommendedFormats[0] || template.formats[0]
          const generatedAsset = findGeneratedAsset(
            kit.assetLibrary.generatedAssets,
            template.id,
            selectedFormat,
          )
          const assetKey = `${template.id}:${selectedFormat}`
          const isGeneratingAsset = generatingAssetKey === assetKey

          return (
            <div key={template.id} className="rounded-xl border border-violet-100 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-zinc-900">
                    {t(`results.assets.templates.${template.id}.title`)}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                    {t(`results.assets.templates.${template.id}.description`)}
                  </p>
                </div>
                <span className="shrink-0 rounded-lg border border-violet-100 bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-700">
                  {selectedFormat}
                </span>
              </div>

              {template.formats.length > 1 ? (
                <div className="mt-3 flex flex-wrap gap-1.5" aria-label={t('results.assets.labels.formats')}>
                  {template.formats.map((format) => {
                    const isSelected = selectedFormat === format

                    return (
                      <button
                        key={format}
                        type="button"
                        onClick={() =>
                          setSelectedFormats((current) => ({ ...current, [template.id]: format }))
                        }
                        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                          isSelected
                            ? 'border-violet-500 bg-violet-600 text-white'
                            : 'border-violet-100 bg-white text-zinc-600 hover:border-violet-300 hover:bg-violet-50'
                        }`}
                      >
                        {format}
                      </button>
                    )
                  })}
                </div>
              ) : null}

              <GeneratedAssetPreview asset={generatedAsset} t={t} />

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => onGenerateAsset(template.id, selectedFormat)}
                  disabled={!brief || Boolean(generatingAssetKey)}
                  className="rounded-xl bg-violet-600 text-white hover:bg-violet-700"
                >
                  <Wand2 className="mr-1.5 size-3.5" />
                  {isGeneratingAsset ? t('results.assets.actions.generating') : t('results.assets.actions.generate')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void copyValue(`${assetKey}:prompt`, generatedAsset?.prompt || '')}
                  disabled={!generatedAsset?.prompt}
                  className="border-violet-200 text-violet-700 hover:bg-violet-50"
                >
                  <Copy className="mr-1.5 size-3.5" />
                  {copiedKey === `${assetKey}:prompt`
                    ? t('results.assets.actions.copied')
                    : t('results.assets.actions.copyPrompt')}
                </Button>
                {generatedAsset?.outputText ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void copyValue(`${assetKey}:text`, generatedAsset.outputText)}
                    className="border-violet-200 text-violet-700 hover:bg-violet-50"
                  >
                    <Copy className="mr-1.5 size-3.5" />
                    {copiedKey === `${assetKey}:text`
                      ? t('results.assets.actions.copied')
                      : t('results.assets.actions.copyText')}
                  </Button>
                ) : null}
                {generatedAsset?.outputUrl ? (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-violet-200 text-violet-700 hover:bg-violet-50"
                  >
                    <a href={generatedAsset.outputUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-1.5 size-3.5" />
                      {t('results.assets.actions.openOutput')}
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GeneratedAssetPreview({
  asset,
  t,
}: {
  asset?: GeneratedLaunchAsset
  t: (key: string, values?: Record<string, string | number>) => string
}) {
  if (!asset) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-violet-200 bg-violet-50/50 px-3 py-6 text-center text-sm text-violet-700">
        {t('results.assets.labels.noGeneratedAsset')}
      </div>
    )
  }

  if (asset.status === 'failed') {
    return (
      <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
        {asset.error || t('results.assets.labels.failed')}
      </div>
    )
  }

  if (asset.mediaType === 'image' && asset.outputUrl) {
    return (
      <div className="mt-4 overflow-hidden rounded-xl border border-violet-100 bg-zinc-950">
        <Image
          src={asset.outputUrl}
          alt={asset.title}
          width={1200}
          height={675}
          sizes="(min-width: 1280px) 50vw, 100vw"
          unoptimized
          className="h-auto w-full object-cover"
        />
      </div>
    )
  }

  if (asset.mediaType === 'video' && asset.outputUrl) {
    return (
      <div className="mt-4 overflow-hidden rounded-xl border border-violet-100 bg-zinc-950">
        <video src={asset.outputUrl} controls className="h-auto w-full" aria-label={asset.title}>
          <track kind="captions" label="Captions" srcLang="en" />
        </video>
      </div>
    )
  }

  if (asset.mediaType === 'text' && asset.outputText) {
    return (
      <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/40 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-700">
          {asset.title}
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{asset.outputText}</p>
      </div>
    )
  }

  return (
    <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/40 p-3 text-sm text-violet-700">
      {t('results.assets.labels.generated')}
    </div>
  )
}

function findGeneratedAsset(
  assets: GeneratedLaunchAsset[],
  templateId: string,
  format: LaunchAssetFormat,
): GeneratedLaunchAsset | undefined {
  return assets.find((asset) => asset.templateId === templateId && asset.format === format)
}

function SeoAnalysisChannelPanel({
  kit,
  onRunSeoAnalysis,
  isSeoActionRunning,
  t,
}: {
  kit: LaunchKit
  onRunSeoAnalysis: () => void
  isSeoActionRunning: boolean
  t: (key: string, values?: Record<string, string | number>) => string
}) {
  const analysis = kit.seoGrowth.websiteAnalysis

  return (
    <div className="rounded-xl border border-violet-100 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className={`${editorialSerif.className} text-xl leading-tight text-zinc-900`}>
            {t('growth.seo.analysis.title')}
          </h3>
          <p className="mt-1 text-xs text-zinc-600">{t('results.focus.websiteSeo')}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRunSeoAnalysis}
          disabled={isSeoActionRunning}
          className="border-violet-200 text-violet-700 hover:bg-violet-50"
        >
          <BarChart3 className="mr-1.5 size-3.5" />
          {t('growth.seo.actions.analyze')}
        </Button>
      </div>

      {analysis ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm leading-relaxed text-zinc-700">{analysis.summary}</p>
              <span className="rounded-full border border-violet-200 bg-white px-3 py-1 text-sm font-semibold text-violet-700">
                {analysis.score}/100
              </span>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <SeoBulletList title={t('growth.seo.analysis.strengths')} items={analysis.strengths} />
            <SeoBulletList title={t('growth.seo.analysis.fixes')} items={analysis.fixes} />
          </div>
          <div className="grid gap-2 lg:grid-cols-2">
            {analysis.checks.map((check) => (
              <div key={check.id} className="rounded-lg border border-violet-100 bg-violet-50/35 p-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-zinc-900">{check.label}</p>
                  <span className="rounded-full border border-violet-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-violet-700">
                    {t(`growth.seo.analysis.status.${check.status}`)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-600">{check.detail}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2 text-sm text-violet-700">
          {t('growth.seo.analysis.empty')}
        </p>
      )}
    </div>
  )
}

function KeywordResearchChannelPanel({
  brief,
  t,
}: {
  brief: ExtractedBrief | null
  t: (key: string, values?: Record<string, string | number>) => string
}) {
  const clusters = brief?.keywordResearch.clusters || []

  return (
    <div className="rounded-xl border border-violet-100 bg-white p-4">
      <h3 className={`${editorialSerif.className} text-xl leading-tight text-zinc-900`}>
        {t('growth.keywordResearch.title')}
      </h3>
      <p className="mt-1 text-xs text-zinc-600">{brief?.keywordResearch.notes || t('growth.keywordResearch.description')}</p>
      {clusters.length > 0 ? (
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          {clusters.slice(0, 8).map((cluster) => (
            <div key={cluster.id} className="rounded-xl border border-violet-100 bg-violet-50/35 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-zinc-900">{cluster.topic}</p>
                <span className="rounded-full border border-violet-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-violet-700">
                  {t(`growth.keywordResearch.priorities.${cluster.priority}`)}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-600">{cluster.keywords.slice(0, 8).join(', ')}</p>
              <p className="mt-2 text-xs font-semibold text-violet-700">{t('growth.keywordResearch.contentAngles')}</p>
              <p className="mt-1 text-xs text-zinc-700">{cluster.contentAngles.slice(0, 3).join(' | ')}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2 text-sm text-violet-700">
          {t('growth.seo.keywordEmpty')}
        </p>
      )}
    </div>
  )
}

function BlogCadenceChannelPanel({
  kit,
  isSeoActionRunning,
  onRunBlogStrategy,
  onCopySeoPosts,
  onRegenerateSeoPosts,
  isGenerating,
  feedbackText,
  outputLabels,
  t,
}: {
  kit: LaunchKit
  isSeoActionRunning: boolean
  onRunBlogStrategy: () => void
  onCopySeoPosts: () => void
  onRegenerateSeoPosts: () => void
  isGenerating: boolean
  feedbackText: string
  outputLabels: {
    copy: string
    regenerate: string
    emptyOutreach: string
    emptySeo: string
    subject: string
    cta: string
    outline: string
  }
  t: (key: string, values?: Record<string, string | number>) => string
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-violet-100 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className={`${editorialSerif.className} text-xl leading-tight text-zinc-900`}>
              {t('growth.seo.blog.title')}
            </h3>
            <p className="mt-1 text-xs text-zinc-600">{t('growth.seo.blog.description')}</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRunBlogStrategy}
            disabled={isSeoActionRunning}
            className="border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            <BookOpenText className="mr-1.5 size-3.5" />
            {t('growth.seo.actions.blog')}
          </Button>
        </div>
        {kit.seoGrowth.blogStrategy.length > 0 ? (
          <div className="mt-3 grid gap-2 lg:grid-cols-2">
            {kit.seoGrowth.blogStrategy.slice(0, 8).map((post) => (
              <div key={post.id} className="rounded-xl border border-violet-100 bg-violet-50/35 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-700">
                  {t('growth.seo.blog.dayOffset', { day: post.dayOffset + 1 })}
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">{post.title}</p>
                <p className="mt-1 text-xs text-zinc-600">{post.targetKeywords.slice(0, 5).join(', ')}</p>
                <p className="mt-2 text-xs font-semibold text-violet-700">{t('growth.seo.blog.tables')}</p>
                <p className="mt-1 text-xs text-zinc-700">{post.tableIdeas.slice(0, 2).join(' | ')}</p>
                <p className="mt-2 text-xs font-semibold text-violet-700">{t('growth.seo.blog.llmNotes')}</p>
                <p className="mt-1 text-xs text-zinc-700">{post.llmNotes.slice(0, 2).join(' | ')}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2 text-sm text-violet-700">
            {t('growth.seo.blog.empty')}
          </p>
        )}
      </div>

      <GrowthBlockPanel
        displayLabel={t('growth.outputLabels.seo_posts')}
        blockId="seo_posts"
        kit={kit}
        onCopy={onCopySeoPosts}
        onRegenerate={onRegenerateSeoPosts}
        isGenerating={isGenerating}
        feedbackText={feedbackText}
        labels={outputLabels}
      />
    </div>
  )
}

function GeoVisibilityChannelPanel({
  kit,
  brief,
  onRunSeoAnalysis,
  t,
}: {
  kit: LaunchKit
  brief: ExtractedBrief | null
  onRunSeoAnalysis: () => void
  t: (key: string, values?: Record<string, string | number>) => string
}) {
  const notes = kit.seoGrowth.websiteAnalysis?.llmReadinessNotes || []

  return (
    <div className="rounded-xl border border-violet-100 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className={`${editorialSerif.className} text-xl leading-tight text-zinc-900`}>
            {t('results.channels.geo_llm_visibility.title')}
          </h3>
          <p className="mt-1 text-xs text-zinc-600">{t('results.focus.geo')}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRunSeoAnalysis}
          className="border-violet-200 text-violet-700 hover:bg-violet-50"
        >
          <BarChart3 className="mr-1.5 size-3.5" />
          {t('growth.seo.actions.analyze')}
        </Button>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-violet-100 bg-violet-50/35 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-700">
            {t('growth.seo.analysis.llmReadiness')}
          </p>
          {notes.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-zinc-700">
              {notes.map((note) => (
                <li key={note}>- {note}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-zinc-600">{t('growth.seo.analysis.empty')}</p>
          )}
        </div>
        <div className="rounded-xl border border-violet-100 bg-violet-50/35 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-700">
            {t('results.playbook.stepsLabel')}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-700">
            <li>{t('results.geo.steps.entities', { product: brief?.productName || 'Product' })}</li>
            <li>{t('results.geo.steps.answers')}</li>
            <li>{t('results.geo.steps.citations')}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function EmailContactsChannelPanel({
  kit,
  selectedLeadIds,
  onToggleLead,
  onScrapeEmailContacts,
  onBuildEmailList,
  isEmailActionRunning,
  t,
}: {
  kit: LaunchKit
  selectedLeadIds: string[]
  onToggleLead: (leadId: string) => void
  onScrapeEmailContacts: () => void
  onBuildEmailList: () => void
  isEmailActionRunning: boolean
  t: (key: string, values?: Record<string, string | number>) => string
}) {
  return (
    <div className="rounded-xl border border-violet-100 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className={`${editorialSerif.className} text-xl leading-tight text-zinc-900`}>
            {t('results.channels.email_scrape_contacts.title')}
          </h3>
          <p className="mt-1 text-xs text-zinc-600">{t('results.email.scrapeDescription')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onScrapeEmailContacts}
            disabled={isEmailActionRunning}
            className="border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            <Search className="mr-1.5 size-3.5" />
            {t('results.email.scrapeAction')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onBuildEmailList}
            disabled={isEmailActionRunning || kit.prospecting.leads.length === 0}
            className="border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            <Mail className="mr-1.5 size-3.5" />
            {t('results.email.buildListAction')}
          </Button>
        </div>
      </div>
      <LeadTable
        leads={kit.prospecting.leads}
        selectedLeadIds={selectedLeadIds}
        onToggleLead={onToggleLead}
        emptyMessage={t('results.email.noContacts')}
        t={t}
      />
    </div>
  )
}

function EmailImportChannelPanel({
  value,
  onChange,
  onImport,
  isEmailActionRunning,
  t,
}: {
  value: string
  onChange: (value: string) => void
  onImport: () => void
  isEmailActionRunning: boolean
  t: (key: string, values?: Record<string, string | number>) => string
}) {
  return (
    <div className="rounded-xl border border-violet-100 bg-white p-4">
      <h3 className={`${editorialSerif.className} text-xl leading-tight text-zinc-900`}>
        {t('results.channels.email_import_list.title')}
      </h3>
      <p className="mt-1 text-xs text-zinc-600">{t('results.email.importDescription')}</p>
      <textarea
        value={value}
        aria-label={t('results.channels.email_import_list.title')}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t('results.email.importPlaceholder')}
        rows={9}
        className="mt-3 w-full rounded-xl border border-violet-200 bg-violet-50/30 px-3 py-2 text-sm text-violet-950 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/40"
      />
      <div className="mt-3 flex justify-end">
        <Button
          type="button"
          onClick={onImport}
          disabled={isEmailActionRunning}
          className="rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/25 hover:bg-violet-700"
        >
          <ListPlus className="mr-2 size-4" />
          {t('results.email.importAction')}
        </Button>
      </div>
    </div>
  )
}

function EmailAutomationChannelPanel({
  kit,
  selectedLeadIds,
  onPersonalizeEmailOutreach,
  onSendOutreachEmail,
  isEmailActionRunning,
  outputLabels,
  onCopyAnnouncement,
  onRegenerateAnnouncement,
  onCopyColdEmail,
  onRegenerateColdEmail,
  isGenerating,
  feedbackText,
  t,
}: {
  kit: LaunchKit
  selectedLeadIds: string[]
  onPersonalizeEmailOutreach: () => void
  onSendOutreachEmail: () => void
  isEmailActionRunning: boolean
  outputLabels: {
    copy: string
    regenerate: string
    title: string
    body: string
    cta: string
    notes: string
    subject: string
    outline: string
    redditEngagement: string
    redditSelfPromotion: string
    redditReason: string
    redditPostingGuidance: string
    emptyOutreach: string
    emptySeo: string
  }
  onCopyAnnouncement: () => void
  onRegenerateAnnouncement: () => void
  onCopyColdEmail: () => void
  onRegenerateColdEmail: () => void
  isGenerating: boolean
  feedbackText: string
  t: (key: string, values?: Record<string, string | number>) => string
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-violet-100 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className={`${editorialSerif.className} text-xl leading-tight text-zinc-900`}>
              {t('results.channels.email_automation.title')}
            </h3>
            <p className="mt-1 text-xs text-zinc-600">{t('results.email.automationDescription')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onPersonalizeEmailOutreach}
              disabled={isEmailActionRunning || kit.prospecting.leads.length === 0}
              className="border-violet-200 text-violet-700 hover:bg-violet-50"
            >
              <Wand2 className="mr-1.5 size-3.5" />
              {t('results.email.personalizeAction')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onSendOutreachEmail}
              disabled={isEmailActionRunning || kit.prospecting.leads.length === 0}
              className="border-violet-200 text-violet-700 hover:bg-violet-50"
            >
              <Send className="mr-1.5 size-3.5" />
              {t('results.email.sendAction')}
            </Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {t('growth.prospecting.selectedLeads', { count: selectedLeadIds.length })}
        </p>
        {kit.prospecting.emailJobs.length > 0 ? (
          <div className="mt-3 grid gap-2 lg:grid-cols-2">
            {kit.prospecting.emailJobs.slice(0, 4).map((job) => (
              <div key={job.id} className="rounded-lg border border-violet-100 bg-violet-50/35 p-2">
                <p className="text-xs font-semibold text-zinc-900">{job.subject}</p>
                <p className="mt-1 text-xs text-zinc-600">{job.bodyPreview}</p>
                <p className="mt-1 text-[11px] text-violet-700">
                  {job.leadIds.length} {t('growth.seo.backlinks.prospects')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-sm text-violet-700">
            {t('results.email.noJobs')}
          </p>
        )}
      </div>

      <PlatformBlockPanel
        displayLabel={t('platformLabels.email_announcement')}
        block={kit.platformBlocks.email_announcement}
        onCopy={onCopyAnnouncement}
        onRegenerate={onRegenerateAnnouncement}
        isGenerating={isGenerating}
        feedbackText={feedbackText}
        labels={outputLabels}
      />

      <GrowthBlockPanel
        displayLabel={t('growth.outputLabels.cold_email_outreach')}
        blockId="cold_email_outreach"
        kit={kit}
        onCopy={onCopyColdEmail}
        onRegenerate={onRegenerateColdEmail}
        isGenerating={isGenerating}
        feedbackText={feedbackText}
        labels={outputLabels}
      />
    </div>
  )
}

function LeadTable({
  leads,
  selectedLeadIds,
  onToggleLead,
  emptyMessage,
  t,
}: {
  leads: LaunchKit['prospecting']['leads']
  selectedLeadIds: string[]
  onToggleLead: (leadId: string) => void
  emptyMessage: string
  t: (key: string, values?: Record<string, string | number>) => string
}) {
  if (!leads.length) {
    return (
      <p className="mt-3 rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2 text-sm text-violet-700">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-violet-100">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead className="bg-violet-50/70 text-left text-xs uppercase tracking-[0.12em] text-violet-700">
          <tr>
            <th className="px-3 py-2">{t('growth.prospecting.headers.select')}</th>
            <th className="px-3 py-2">{t('growth.prospecting.headers.contact')}</th>
            <th className="px-3 py-2">{t('growth.prospecting.headers.company')}</th>
            <th className="px-3 py-2">{t('growth.prospecting.headers.email')}</th>
            <th className="px-3 py-2">{t('growth.prospecting.headers.score')}</th>
            <th className="px-3 py-2">{t('growth.prospecting.headers.reason')}</th>
          </tr>
        </thead>
        <tbody>
          {leads.slice(0, 30).map((lead) => (
            <tr key={lead.id} className="border-t border-violet-100">
              <td className="px-3 py-2 align-top">
                <input
                  type="checkbox"
                  aria-label={`${t('growth.prospecting.headers.select')} ${lead.name || lead.company}`}
                  checked={selectedLeadIds.includes(lead.id)}
                  onChange={() => onToggleLead(lead.id)}
                  className="mt-1 size-4 rounded border-violet-300 text-violet-600"
                />
              </td>
              <td className="px-3 py-2 align-top">
                <p className="font-medium text-zinc-900">{lead.name}</p>
                <p className="text-xs text-zinc-600">{lead.role}</p>
              </td>
              <td className="px-3 py-2 align-top">
                <p className="font-medium text-zinc-900">{lead.company}</p>
                <p className="text-xs text-zinc-600">{lead.website}</p>
              </td>
              <td className="px-3 py-2 align-top text-xs text-zinc-700">
                {lead.email || t('growth.prospecting.noEmail')}
              </td>
              <td className="px-3 py-2 align-top">
                <p className="font-semibold text-zinc-900">{lead.score}</p>
                <p className="text-xs uppercase tracking-[0.1em] text-violet-700">{lead.tier}</p>
              </td>
              <td className="px-3 py-2 align-top text-xs text-zinc-600">{lead.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BacklinkChannelPanel({
  kit,
  filteredProspects,
  selectedProspectIds,
  search,
  listFilter,
  maxCost,
  minTraffic,
  minValue,
  listName,
  isSeoActionRunning,
  onSearchChange,
  onListFilterChange,
  onMaxCostChange,
  onMinTrafficChange,
  onMinValueChange,
  onListNameChange,
  onRunBacklinkProspects,
  onToggleProspect,
  onAddToList,
  onStatusChange,
  onPersonalizeEmails,
  onSendEmails,
  onExportBacklinks,
  t,
}: {
  kit: LaunchKit
  filteredProspects: LaunchKit['seoGrowth']['backlinkProspects']
  selectedProspectIds: string[]
  search: string
  listFilter: string
  maxCost: string
  minTraffic: string
  minValue: string
  listName: string
  isSeoActionRunning: boolean
  onSearchChange: (value: string) => void
  onListFilterChange: (value: string) => void
  onMaxCostChange: (value: string) => void
  onMinTrafficChange: (value: string) => void
  onMinValueChange: (value: string) => void
  onListNameChange: (value: string) => void
  onRunBacklinkProspects: () => void
  onToggleProspect: (prospectId: string) => void
  onAddToList: () => void
  onStatusChange: (prospectId: string, status: BacklinkProspectStatus) => void
  onPersonalizeEmails: () => void
  onSendEmails: () => void
  onExportBacklinks: () => void
  t: (key: string, values?: Record<string, string | number>) => string
}) {
  const prospectLists = kit.seoGrowth.prospectLists
  const hasBacklinkProspects = kit.seoGrowth.backlinkProspects.length > 0

  return (
    <div className="rounded-xl border border-violet-100 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className={`${editorialSerif.className} text-xl leading-tight text-zinc-900`}>
            {t('growth.seo.backlinks.title')}
          </h3>
          <p className="mt-1 max-w-3xl text-xs text-zinc-600">{t('growth.seo.backlinks.description')}</p>
          <p className="mt-1 max-w-3xl text-[11px] text-zinc-500">{t('growth.seo.backlinks.formula')}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRunBacklinkProspects}
            disabled={isSeoActionRunning}
            className="border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            <Link2 className="mr-1.5 size-3.5" />
            {t('growth.seo.actions.backlinks')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onPersonalizeEmails}
            disabled={isSeoActionRunning || !hasBacklinkProspects}
            className="border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            <Mail className="mr-1.5 size-3.5" />
            {t('growth.seo.actions.personalizeEmails')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onSendEmails}
            disabled={isSeoActionRunning || !hasBacklinkProspects}
            className="border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            <Send className="mr-1.5 size-3.5" />
            {t('growth.seo.actions.sendEmails')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onExportBacklinks}
            disabled={isSeoActionRunning || !hasBacklinkProspects}
            className="border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            <FileSpreadsheet className="mr-1.5 size-3.5" />
            {t('growth.seo.actions.exportBacklinks')}
          </Button>
        </div>
      </div>

      {hasBacklinkProspects ? (
        <>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
            <FilterField label={t('growth.seo.backlinks.filters.search')}>
              <input
                value={search}
                aria-label={t('growth.seo.backlinks.filters.search')}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={t('growth.seo.backlinks.filters.searchPlaceholder')}
                className="w-full rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-sm text-zinc-700 outline-none focus:border-violet-400"
              />
            </FilterField>
            <FilterField label={t('growth.seo.backlinks.filters.list')}>
              <select
                value={listFilter}
                aria-label={t('growth.seo.backlinks.filters.list')}
                onChange={(event) => onListFilterChange(event.target.value)}
                className="w-full rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-sm text-zinc-700 outline-none focus:border-violet-400"
              >
                <option value="all">{t('growth.seo.backlinks.filters.allLists')}</option>
                {prospectLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label={t('growth.seo.backlinks.filters.maxCost')}>
              <input
                value={maxCost}
                aria-label={t('growth.seo.backlinks.filters.maxCost')}
                onChange={(event) => onMaxCostChange(event.target.value)}
                inputMode="numeric"
                className="w-full rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-sm text-zinc-700 outline-none focus:border-violet-400"
              />
            </FilterField>
            <FilterField label={t('growth.seo.backlinks.filters.minTraffic')}>
              <input
                value={minTraffic}
                aria-label={t('growth.seo.backlinks.filters.minTraffic')}
                onChange={(event) => onMinTrafficChange(event.target.value)}
                inputMode="numeric"
                className="w-full rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-sm text-zinc-700 outline-none focus:border-violet-400"
              />
            </FilterField>
            <FilterField label={t('growth.seo.backlinks.filters.minValue')}>
              <input
                value={minValue}
                aria-label={t('growth.seo.backlinks.filters.minValue')}
                onChange={(event) => onMinValueChange(event.target.value)}
                inputMode="numeric"
                className="w-full rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-sm text-zinc-700 outline-none focus:border-violet-400"
              />
            </FilterField>
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-2">
            <FilterField label={t('growth.seo.backlinks.listName')}>
              <input
                value={listName}
                aria-label={t('growth.seo.backlinks.listName')}
                onChange={(event) => onListNameChange(event.target.value)}
                placeholder={t('growth.seo.backlinks.listPlaceholder')}
                className="w-full min-w-[220px] rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-sm text-zinc-700 outline-none focus:border-violet-400"
              />
            </FilterField>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onAddToList}
              disabled={isSeoActionRunning || selectedProspectIds.length === 0}
              className="border-violet-200 text-violet-700 hover:bg-violet-50"
            >
              <ListPlus className="mr-1.5 size-3.5" />
              {t('growth.seo.backlinks.addToList', { count: selectedProspectIds.length })}
            </Button>
            <p className="pb-1 text-xs text-zinc-500">
              {t('growth.seo.backlinks.selected', { count: selectedProspectIds.length })}
            </p>
          </div>
        </>
      ) : null}

      {filteredProspects.length > 0 ? (
        <div className="mt-3 overflow-x-auto rounded-xl border border-violet-100">
          <table className="w-full min-w-[1120px] border-collapse text-sm">
            <thead className="bg-violet-50/70 text-left text-xs uppercase tracking-[0.12em] text-violet-700">
              <tr>
                <th className="px-3 py-2">{t('growth.seo.backlinks.headers.select')}</th>
                <th className="px-3 py-2">{t('growth.seo.backlinks.headers.site')}</th>
                <th className="px-3 py-2">{t('growth.seo.backlinks.headers.status')}</th>
                <th className="px-3 py-2">{t('growth.seo.backlinks.headers.value')}</th>
                <th className="px-3 py-2">{t('growth.seo.backlinks.headers.traffic')}</th>
                <th className="px-3 py-2">{t('growth.seo.backlinks.headers.cost')}</th>
                <th className="px-3 py-2">{t('growth.seo.backlinks.headers.email')}</th>
                <th className="px-3 py-2">{t('growth.seo.backlinks.headers.reason')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProspects.map((prospect) => (
                <tr key={prospect.id} className="border-t border-violet-100">
                  <td className="px-3 py-2 align-top">
                    <input
                      type="checkbox"
                      aria-label={`${t('growth.seo.backlinks.headers.select')} ${prospect.title}`}
                      checked={selectedProspectIds.includes(prospect.id)}
                      onChange={() => onToggleProspect(prospect.id)}
                      className="mt-1 size-4 rounded border-violet-300 text-violet-600"
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <p className="font-medium text-zinc-900">{prospect.title}</p>
                    <a
                      href={prospect.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-violet-700 hover:underline"
                    >
                      {prospect.domain || prospect.website}
                    </a>
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-600">{prospect.scrapedSummary}</p>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <select
                      value={prospect.status}
                      onChange={(event) =>
                        onStatusChange(prospect.id, event.target.value as BacklinkProspectStatus)
                      }
                      disabled={isSeoActionRunning}
                      className="rounded-lg border border-violet-200 bg-white px-2 py-1 text-xs text-zinc-700 outline-none focus:border-violet-400"
                    >
                      {BACKLINK_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {t(`growth.seo.backlinks.statuses.${status}`)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <p className="font-semibold text-zinc-900">{prospect.valueScore}</p>
                    <p className="text-[11px] text-zinc-500">
                      R {prospect.relevanceScore} / T {prospect.trafficScore} / A {prospect.authorityScore}
                    </p>
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-zinc-700">
                    {formatTraffic(prospect.estimatedTraffic, t('growth.seo.backlinks.unknown'))}
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-zinc-700">
                    {formatCost(prospect.costToList, t('growth.seo.backlinks.unknown'))}
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-zinc-700">
                    <p>{prospect.contactEmail || t('growth.seo.backlinks.noEmail')}</p>
                    {prospect.customizedEmailSubject ? (
                      <p className="mt-1 line-clamp-2 font-medium text-zinc-900">
                        {prospect.customizedEmailSubject}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-zinc-600">
                    <p className="line-clamp-2">{prospect.relevanceReason}</p>
                    <p className="mt-1 font-medium text-violet-700">{prospect.backlinkAngle}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2 text-sm text-violet-700">
          {hasBacklinkProspects ? t('growth.seo.backlinks.emptyFiltered') : t('growth.seo.backlinks.empty')}
        </p>
      )}
    </div>
  )
}

function MediaKitChannelPanel({
  kit,
  labels,
  onExportMarkdown,
  onOpenPressPack,
}: {
  kit: LaunchKit
  labels: {
    title: string
    exportMarkdown: string
    openPressPack: string
    fields: {
      bio: string
      oneLiner: string
      boilerplate: string
      pressRelease: string
      checklist: string
      screenshots: string
      contact: string
    }
  }
  onExportMarkdown: () => void
  onOpenPressPack: () => void
}) {
  return (
    <div className="rounded-xl border border-violet-100 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={`${editorialSerif.className} text-xl leading-tight text-zinc-900`}>{labels.title}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onExportMarkdown}
            className="border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            <FileSpreadsheet className="mr-1.5 size-3.5" />
            {labels.exportMarkdown}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenPressPack}
            className="border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            <ExternalLink className="mr-1.5 size-3.5" />
            {labels.openPressPack}
          </Button>
        </div>
      </div>
      <MediaField label={labels.fields.bio} value={kit.mediaKit.founderCompanyBio} />
      <MediaField label={labels.fields.oneLiner} value={kit.mediaKit.productOneLiner} />
      <MediaField label={labels.fields.boilerplate} value={kit.mediaKit.boilerplate} />
      <MediaField label={labels.fields.pressRelease} value={kit.mediaKit.pressRelease} />
      <MediaField
        label={labels.fields.checklist}
        value={kit.mediaKit.keyVisualsChecklist.map((item) => `- ${item}`).join('\n')}
      />
      <MediaField label={labels.fields.screenshots} value={kit.mediaKit.screenshotsAndLogos} />
      <MediaField label={labels.fields.contact} value={kit.mediaKit.contactDetails} />
    </div>
  )
}

function TrafficPlaybookPanel({
  channelId,
  brief,
  kit,
  websiteUrl,
  t,
}: {
  channelId: TrafficChannelId
  brief: ExtractedBrief | null
  kit: LaunchKit
  websiteUrl?: string
  t: (key: string, values?: Record<string, string | number>) => string
}) {
  const product = brief?.productName || 'Product'
  const audience = brief?.targetUsers[0] || brief?.icp || 'your target audience'
  const proof = brief?.proofPoints[0] || kit.mediaKit.productOneLiner || brief?.positioning || product
  const cta = brief?.cta || 'Learn more'

  return (
    <div className="rounded-xl border border-violet-100 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 rounded-lg border border-violet-100 bg-violet-50 p-2 text-violet-700">
            <TrafficChannelIcon channelId={channelId} />
          </span>
          <div>
            <h3 className={`${editorialSerif.className} text-xl leading-tight text-zinc-900`}>
              {t(`results.channels.${channelId}.title`)}
            </h3>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-zinc-600">
              {t(`results.playbookSamples.${channelId}`, { product, audience, proof, cta })}
            </p>
          </div>
        </div>
        {websiteUrl ? (
          <Button
            asChild
            variant="outline"
            className="shrink-0 rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            <Link href={websiteUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1.5 size-3.5" />
              {t('results.marketplaces.openWebsite')}
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-violet-100 bg-violet-50/35 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-700">
            {t('results.playbook.objectiveLabel')}
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            {t('results.playbook.objective', { channel: t(`results.channels.${channelId}.title`) })}
          </p>
        </div>
        <div className="rounded-xl border border-violet-100 bg-violet-50/35 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-700">
            {t('results.playbook.stepsLabel')}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-700">
            <li>{t('results.playbook.steps.adapt', { product })}</li>
            <li>{t('results.playbook.steps.proof', { proof })}</li>
            <li>{t('results.playbook.steps.cta', { cta })}</li>
          </ul>
        </div>
        <div className="rounded-xl border border-violet-100 bg-violet-50/35 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-700">
            {t('results.playbook.assetsLabel')}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-zinc-700">
            <li>{t('results.playbook.assets.shortPitch')}</li>
            <li>{t('results.playbook.assets.proofPoint')}</li>
            <li>{t('results.playbook.assets.followUp')}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function ChannelPackPanel({
  pack,
  onCopyCard,
  onUpdateCard,
  onRegenerateCard,
  isGenerating,
  feedbackText,
  labels,
}: {
  pack: LaunchKit['channelPacks'][ChannelPackId]
  onCopyCard: (cardId: string) => void
  onUpdateCard: (
    cardId: string,
    changes: Pick<ChannelCard, 'title' | 'body' | 'cta'>,
  ) => void
  onRegenerateCard: (cardId: string) => void
  isGenerating: boolean
  feedbackText: string
  labels: {
    copy: string
    regenerate: string
    title: string
    body: string
    cta: string
    notes: string
    format: string
    stage: string
    proofPoint: string
    socialContract: string
    emptyChannelPack: string
    redditEngagement: string
    redditSelfPromotion: string
    redditReason: string
    redditPostingGuidance: string
  }
}) {
  const redditRecommendations = pack.id === 'reddit' ? pack.redditRecommendations : undefined
  const hasRedditRecommendations = Boolean(
    redditRecommendations &&
      (redditRecommendations.engagementSubreddits.length > 0 ||
        redditRecommendations.selfPromotionSubreddits.length > 0),
  )
  const hidesPostTitle = pack.id === 'x'

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-violet-100 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className={`${editorialSerif.className} text-xl leading-tight text-zinc-900`}>
              {pack.label}
            </h3>
            {pack.notes ? (
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-zinc-600">{pack.notes}</p>
            ) : null}
          </div>
          {feedbackText ? (
            <p aria-live="polite" className="text-sm font-medium text-violet-700">
              {feedbackText}
            </p>
          ) : null}
        </div>
      </div>

      {pack.cards.length > 0 ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {pack.cards.map((card) => (
            <article key={card.id} className="rounded-xl border border-violet-100 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                    {card.format}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {labels.stage}: {card.stage.replaceAll('_', ' ')}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onCopyCard(card.id)}
                    className="border-violet-200 text-violet-700 hover:bg-violet-50"
                  >
                    <Copy className="mr-1.5 size-3.5" />
                    {labels.copy}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRegenerateCard(card.id)}
                    disabled={isGenerating}
                    className="border-violet-200 text-violet-700 hover:bg-violet-50"
                  >
                    <Wand2 className="mr-1.5 size-3.5" />
                    {labels.regenerate}
                  </Button>
                </div>
              </div>

              {!hidesPostTitle ? (
                <label className="mt-4 block text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                  {labels.title}
                  <input
                    value={card.title}
                    onChange={(event) =>
                      onUpdateCard(card.id, {
                        title: event.target.value,
                        body: card.body,
                        cta: card.cta,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-violet-100 bg-violet-50/30 px-3 py-2 text-sm normal-case tracking-normal text-zinc-900 outline-none transition focus:border-violet-400 focus:bg-white"
                  />
                </label>
              ) : null}

              <label className="mt-3 block text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                {labels.body}
                <textarea
                  value={card.body}
                  rows={8}
                  onChange={(event) =>
                    onUpdateCard(card.id, {
                      title: card.title,
                      body: event.target.value,
                      cta: card.cta,
                    })
                  }
                  className="mt-1 w-full resize-y rounded-lg border border-violet-100 bg-violet-50/30 px-3 py-2 text-sm leading-relaxed normal-case tracking-normal text-zinc-800 outline-none transition focus:border-violet-400 focus:bg-white"
                />
              </label>

              <label className="mt-3 block text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                {labels.cta}
                <input
                  value={card.cta}
                  onChange={(event) =>
                    onUpdateCard(card.id, {
                      title: card.title,
                      body: card.body,
                      cta: event.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-violet-100 bg-violet-50/30 px-3 py-2 text-sm normal-case tracking-normal text-violet-700 outline-none transition focus:border-violet-400 focus:bg-white"
                />
              </label>

              {card.proofPoint ? (
                <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                    {labels.proofPoint}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-700">{card.proofPoint}</p>
                </div>
              ) : null}

              {card.socialContractNote ? (
                <div className="mt-3 rounded-lg border border-violet-100 bg-violet-50/45 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                    {labels.socialContract}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600">{card.socialContractNote}</p>
                </div>
              ) : null}

            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-violet-100 bg-white p-4 text-sm text-zinc-600">
          {labels.emptyChannelPack}
        </p>
      )}

      {hasRedditRecommendations && redditRecommendations ? (
        <div className="grid gap-5 rounded-xl border border-violet-100 bg-white p-4 md:grid-cols-2">
          <SubredditRecommendationList
            title={labels.redditEngagement}
            recommendations={redditRecommendations.engagementSubreddits}
            labels={{
              reason: labels.redditReason,
              postingGuidance: labels.redditPostingGuidance,
            }}
          />
          <SubredditRecommendationList
            title={labels.redditSelfPromotion}
            recommendations={redditRecommendations.selfPromotionSubreddits}
            labels={{
              reason: labels.redditReason,
              postingGuidance: labels.redditPostingGuidance,
            }}
          />
        </div>
      ) : null}
    </div>
  )
}

function PlatformBlockPanel({
  displayLabel,
  block,
  onCopy,
  onRegenerate,
  isGenerating,
  feedbackText,
  labels,
}: {
  displayLabel: string
  block: LaunchKit['platformBlocks'][PlatformBlockId]
  onCopy: () => void
  onRegenerate: () => void
  isGenerating: boolean
  feedbackText: string
  labels: {
    copy: string
    regenerate: string
    title: string
    body: string
    cta: string
    notes: string
    redditEngagement: string
    redditSelfPromotion: string
    redditReason: string
    redditPostingGuidance: string
  }
}) {
  const redditRecommendations = block.id === 'reddit' ? block.redditRecommendations : undefined
  const hasRedditRecommendations = Boolean(
    redditRecommendations &&
      (redditRecommendations.engagementSubreddits.length > 0 ||
        redditRecommendations.selfPromotionSubreddits.length > 0),
  )

  return (
    <div className="rounded-xl border border-violet-100 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={`${editorialSerif.className} text-xl leading-tight text-zinc-900`}>{displayLabel}</h3>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {feedbackText ? (
            <p aria-live="polite" className="text-sm font-medium text-violet-700">
              {feedbackText}
            </p>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            onClick={onCopy}
            className="border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            <Copy className="mr-1.5 size-3.5" />
            {labels.copy}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onRegenerate}
            disabled={isGenerating}
            className="border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            <Wand2 className="mr-1.5 size-3.5" />
            {labels.regenerate}
          </Button>
        </div>
      </div>

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">{labels.title}</p>
      <p className="text-sm font-medium text-zinc-800">{block.title}</p>

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">{labels.body}</p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{block.body}</p>

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">{labels.cta}</p>
      <p className="text-sm font-semibold text-violet-700">{block.cta}</p>

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">{labels.notes}</p>
      <p className="text-sm text-zinc-600">{block.notes}</p>

      {hasRedditRecommendations && redditRecommendations ? (
        <div className="mt-5 grid gap-5 border-t border-violet-100 pt-4 md:grid-cols-2">
          <SubredditRecommendationList
            title={labels.redditEngagement}
            recommendations={redditRecommendations.engagementSubreddits}
            labels={{
              reason: labels.redditReason,
              postingGuidance: labels.redditPostingGuidance,
            }}
          />
          <SubredditRecommendationList
            title={labels.redditSelfPromotion}
            recommendations={redditRecommendations.selfPromotionSubreddits}
            labels={{
              reason: labels.redditReason,
              postingGuidance: labels.redditPostingGuidance,
            }}
          />
        </div>
      ) : null}
    </div>
  )
}

function SubredditRecommendationList({
  title,
  recommendations,
  labels,
}: {
  title: string
  recommendations: SubredditRecommendation[]
  labels: {
    reason: string
    postingGuidance: string
  }
}) {
  if (!recommendations.length) {
    return null
  }

  return (
    <section>
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">{title}</h4>
      <ul className="mt-3 space-y-3">
        {recommendations.map((recommendation) => (
          <li key={`${title}-${recommendation.name}`} className="border-l border-violet-200 pl-3">
            <a
              href={recommendation.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-violet-700 hover:text-violet-900"
            >
              {recommendation.name}
              <ExternalLink className="size-3" />
            </a>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600">
              <span className="font-semibold text-zinc-700">{labels.reason}:</span> {recommendation.reason}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600">
              <span className="font-semibold text-zinc-700">{labels.postingGuidance}:</span>{' '}
              {recommendation.postingGuidance}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function GrowthBlockPanel({
  displayLabel,
  blockId,
  kit,
  onCopy,
  onRegenerate,
  isGenerating,
  feedbackText,
  labels,
}: {
  displayLabel: string
  blockId: GrowthBlockId
  kit: LaunchKit
  onCopy: () => void
  onRegenerate: () => void
  isGenerating: boolean
  feedbackText: string
  labels: {
    copy: string
    regenerate: string
    emptyOutreach: string
    emptySeo: string
    subject: string
    cta: string
    outline: string
  }
}) {
  return (
    <div className="rounded-xl border border-violet-100 bg-white p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className={`${editorialSerif.className} text-xl leading-tight text-zinc-900`}>{displayLabel}</h3>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {feedbackText ? (
            <p aria-live="polite" className="text-sm font-medium text-violet-700">
              {feedbackText}
            </p>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            onClick={onCopy}
            className="border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            <Copy className="mr-1.5 size-3.5" />
            {labels.copy}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onRegenerate}
            disabled={isGenerating}
            className="border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            <Wand2 className="mr-1.5 size-3.5" />
            {labels.regenerate}
          </Button>
        </div>
      </div>

      {blockId === 'linkedin_outreach' ? (
        <OutreachPackPreview
          pack={kit.growthAssets.linkedinOutreach}
          emptyMessage={labels.emptyOutreach}
          subjectLabel={labels.subject}
          ctaLabel={labels.cta}
        />
      ) : null}
      {blockId === 'x_outreach' ? (
        <OutreachPackPreview
          pack={kit.growthAssets.xOutreach}
          emptyMessage={labels.emptyOutreach}
          subjectLabel={labels.subject}
          ctaLabel={labels.cta}
        />
      ) : null}
      {blockId === 'cold_email_outreach' ? (
        <OutreachPackPreview
          pack={kit.growthAssets.emailOutreach}
          emptyMessage={labels.emptyOutreach}
          subjectLabel={labels.subject}
          ctaLabel={labels.cta}
          includeSubject
        />
      ) : null}
      {blockId === 'seo_posts' ? (
        <SeoPostPreview
          posts={kit.growthAssets.seoPostPacks}
          emptyMessage={labels.emptySeo}
          outlineLabel={labels.outline}
        />
      ) : null}
    </div>
  )
}

function OutreachPackPreview({
  pack,
  emptyMessage,
  subjectLabel,
  ctaLabel,
  includeSubject = false,
}: {
  pack: LaunchKit['growthAssets']['linkedinOutreach']
  emptyMessage: string
  subjectLabel: string
  ctaLabel: string
  includeSubject?: boolean
}) {
  if (!pack.variants.length) {
    return <p className="text-sm text-zinc-600">{emptyMessage}</p>
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-600">{pack.notes}</p>
      {pack.variants.map((variant) => (
        <div key={variant.id} className="rounded-lg border border-violet-100 bg-white p-2">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-violet-700">{variant.title}</p>
          {includeSubject && variant.subject ? (
            <p className="mt-1 text-xs font-medium text-zinc-900">
              {subjectLabel}: {variant.subject}
            </p>
          ) : null}
          <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">{variant.message}</p>
          <p className="mt-1 text-xs font-semibold text-violet-700">
            {ctaLabel}: {variant.cta}
          </p>
        </div>
      ))}
    </div>
  )
}

function SeoPostPreview({
  posts,
  emptyMessage,
  outlineLabel,
}: {
  posts: LaunchKit['growthAssets']['seoPostPacks']
  emptyMessage: string
  outlineLabel: string
}) {
  if (!posts.length) {
    return <p className="text-sm text-zinc-600">{emptyMessage}</p>
  }

  return (
    <div className="space-y-2">
      {posts.slice(0, 4).map((post) => (
        <div key={post.id} className="rounded-lg border border-violet-100 bg-white p-2">
          <p className="text-sm font-semibold text-zinc-900">{post.title}</p>
          <p className="mt-1 text-xs text-zinc-600">{post.metaDescription}</p>
          <p className="mt-1 text-xs font-medium text-violet-700">{post.keywordTopic}</p>
          {post.outline.length > 0 ? (
            <p className="mt-1 text-xs text-zinc-700">
              {outlineLabel}: {post.outline.slice(0, 4).join(' | ')}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function SeoBulletList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) {
    return null
  }

  return (
    <div>
      <p className="text-xs font-semibold text-violet-700">{title}</p>
      <ul className="mt-1 space-y-1 text-xs text-zinc-700">
        {items.slice(0, 4).map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </div>
  )
}
