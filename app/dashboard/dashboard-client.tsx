'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import {
  BookOpenText,
  ChevronRight,
  Download,
  ExternalLink,
  Lock,
  PanelRightClose,
  PanelRightOpen,
  PenSquare,
  Save,
  Settings2,
  Wand2,
} from 'lucide-react'
import { signOut, useSession } from '@/lib/auth-client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'
import { createDemoSnapshot } from '@/lib/launch-kit/demo'
import {
  PLATFORM_IDS,
  type BacklinkProspectStatus,
  type ChannelCard,
  type ChannelPackId,
  type ExtractedBrief,
  type GrowthBlockId,
  type LaunchAssetFormat,
  type LaunchAssetKind,
  type LaunchKit,
  type LaunchProjectSnapshot,
  type PlatformBlockId,
  type ProjectSummary,
} from '@/lib/launch-kit/types'
import { normalizeBrief, normalizeKit } from '@/lib/launch-kit/normalizers'
import { FREE_CHANNEL_PACK_IDS, FREE_PLATFORM_BLOCK_IDS } from '@/lib/launch-kit/plans'
import { Field, StepStatusPill } from './dashboard-ui'
import { displaySans, appSans } from './dashboard-fonts'
import { ResultAssetBrowser } from './result-asset-browser'
import {
  type DashboardStep,
  type GenerateContentInput,
  type OnboardingCardIndex,
  type ResultBrowserSection,
  type SavedProjectItem,
  type StepStatus,
  type TrafficChannelId,
} from './dashboard-config'
import {
  buildMarkdown,
  buildPressPackHtml,
  downloadBlob,
  formatChannelCardForCopy,
  formatOutreachPackForCopy,
  formatRedditRecommendationsForCopy,
  formatSeoPostsForCopy,
  getExportLabels,
  hasGeneratedResultsInKit,
  parseNumberFilter,
  readGuestProjects,
  slugify,
  splitEditableLines,
  splitLines,
  writeGuestProjects,
} from './dashboard-utils'

type DashboardPageClientProps = {
  initialUrlParam: string
  initialWantsDemo: boolean
  initialWantsResultsView: boolean
}

function createInitialDemoSnapshot(enabled: boolean) {
  if (!enabled) {
    return null
  }

  return createDemoSnapshot()
}

// react-doctor-disable-next-line react-doctor/no-giant-component, react-doctor/prefer-useReducer
export default function DashboardPageClient({ initialUrlParam, initialWantsDemo, initialWantsResultsView }: DashboardPageClientProps) {
  const t = useTranslations('LaunchKit')
  const { push } = useRouter()
  const { data: session, isPending } = useSession()
  const initialDemoSnapshot = useMemo(
    () => createInitialDemoSnapshot(!initialUrlParam && initialWantsDemo),
    [initialUrlParam, initialWantsDemo],
  )

  const [sourceUrl, setSourceUrl] = useState(initialUrlParam || initialDemoSnapshot?.sourceUrl || '')
  const [brief, setBrief] = useState<ExtractedBrief | null>(() =>
    initialDemoSnapshot ? normalizeBrief(initialDemoSnapshot.brief) : null,
  )
  const [kit, setKit] = useState<LaunchKit | null>(() =>
    initialDemoSnapshot
      ? normalizeKit(initialDemoSnapshot.kit, initialDemoSnapshot.brief.language)
      : null,
  )
  const projectIdRef = useRef<string | null>(initialDemoSnapshot?.id || null)
  const [projectName, setProjectName] = useState(initialDemoSnapshot?.name || '')

  const [isIngesting, setIsIngesting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [extractionFeedbackSteps, setExtractionFeedbackSteps] = useState<string[]>([])
  const [extractionFeedbackIndex, setExtractionFeedbackIndex] = useState(0)
  const [generationFeedbackSteps, setGenerationFeedbackSteps] = useState<string[]>([])
  const [generationFeedbackIndex, setGenerationFeedbackIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null)

  const [error, setError] = useState('')

  const [serverProjects, setServerProjects] = useState<ProjectSummary[]>([])
  const [guestProjects, setGuestProjects] = useState<LaunchProjectSnapshot[]>(readGuestProjects)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [isActionRunning, setIsActionRunning] = useState(false)
  const [activeTrafficChannel, setActiveTrafficChannel] = useState<TrafficChannelId>('product_hunt')
  const [activeResultSection, setActiveResultSection] = useState<ResultBrowserSection>('channels')
  const [activeAssetKind, setActiveAssetKind] = useState<LaunchAssetKind>('screenshots')
  const [activeStep, setActiveStep] = useState<DashboardStep>(
    initialDemoSnapshot ? (initialWantsResultsView ? 3 : 2) : 1,
  )
  const [activeOnboardingCard, setActiveOnboardingCard] = useState<OnboardingCardIndex>(0)
  const [isUtilityDrawerOpen, setIsUtilityDrawerOpen] = useState(false)
  const [emailImportText, setEmailImportText] = useState('')
  const [isSeoActionRunning, setIsSeoActionRunning] = useState(false)
  const [selectedBacklinkProspectIds, setSelectedBacklinkProspectIds] = useState<string[]>([])
  const [backlinkSearch, setBacklinkSearch] = useState('')
  const [backlinkListFilter, setBacklinkListFilter] = useState('all')
  const [backlinkMaxCost, setBacklinkMaxCost] = useState('')
  const [backlinkMinTraffic, setBacklinkMinTraffic] = useState('')
  const [backlinkMinValue, setBacklinkMinValue] = useState('')
  const [backlinkListName, setBacklinkListName] = useState('')
  const [generatingAssetKey, setGeneratingAssetKey] = useState('')
  const [success, setSuccess] = useState(() => {
    if (initialUrlParam) {
      return t('messages.urlPrefilled')
    }

    return initialDemoSnapshot && !initialWantsResultsView ? t('messages.demoLoaded') : ''
  })

  useEffect(() => {
    if (!session) {
      setServerProjects([])
      return
    }

    void loadServerProjects()
  }, [session])

  useEffect(() => {
    if (!isIngesting || extractionFeedbackSteps.length <= 1) {
      return
    }

    const interval = window.setInterval(() => {
      setExtractionFeedbackIndex((current) => Math.min(current + 1, extractionFeedbackSteps.length - 1))
    }, 6500)

    return () => window.clearInterval(interval)
  }, [extractionFeedbackSteps.length, isIngesting])

  useEffect(() => {
    if (!isGenerating || generationFeedbackSteps.length <= 1) {
      return
    }

    const interval = window.setInterval(() => {
      setGenerationFeedbackIndex((current) => Math.min(current + 1, generationFeedbackSteps.length - 1))
    }, 7500)

    return () => window.clearInterval(interval)
  }, [generationFeedbackSteps.length, isGenerating])

  const updateKit = (nextKit: LaunchKit | null) => {
    setKit(nextKit)

    if (!nextKit) {
      setSelectedLeadIds([])
      setSelectedBacklinkProspectIds([])
      return
    }

    const leadIds = new Set(nextKit.prospecting.leads.map((lead) => lead.id))
    const prospectIds = new Set(nextKit.seoGrowth.backlinkProspects.map((prospect) => prospect.id))
    setSelectedLeadIds((current) => current.filter((id) => leadIds.has(id)))
    setSelectedBacklinkProspectIds((current) => current.filter((id) => prospectIds.has(id)))
  }

  const savedProjects = useMemo<SavedProjectItem[]>(() => {
    const server: SavedProjectItem[] = serverProjects.map((project) => ({
      ...project,
      storage: 'server',
    }))

    const guest: SavedProjectItem[] = guestProjects.map((snapshot) => ({
      id: snapshot.id,
      name: snapshot.name,
      sourceUrl: snapshot.sourceUrl,
      language: snapshot.language,
      updatedAt: snapshot.updatedAt,
      storage: 'guest',
      snapshot,
    }))

    return [...server, ...guest].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
  }, [serverProjects, guestProjects])

  const buildCurrentMarkdown = () => {
    if (!brief || !kit) {
      return ''
    }

    return buildMarkdown({
      id: projectIdRef.current || `local-${Date.now()}`,
      name: projectName.trim() || brief.productName || t('fields.untitledProject'),
      sourceUrl: brief.sourceUrl,
      language: brief.language,
      brief,
      kit,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, getExportLabels(t))
  }

  const filteredBacklinkProspects = useMemo(() => {
    if (!kit) {
      return []
    }

    const search = backlinkSearch.trim().toLowerCase()
    const maxCost = parseNumberFilter(backlinkMaxCost)
    const minTraffic = parseNumberFilter(backlinkMinTraffic)
    const minValue = parseNumberFilter(backlinkMinValue)

    return kit.seoGrowth.backlinkProspects
      .filter((prospect) => {
        const matchesSearch =
          !search ||
          [
            prospect.title,
            prospect.domain,
            prospect.website,
            prospect.scrapedSummary,
            prospect.relevanceReason,
            prospect.backlinkAngle,
          ]
            .join(' ')
            .toLowerCase()
            .includes(search)
        const matchesList =
          backlinkListFilter === 'all' || prospect.listIds.includes(backlinkListFilter)
        const matchesCost =
          maxCost === null ||
          (typeof prospect.costToList === 'number' && prospect.costToList <= maxCost)
        const matchesTraffic =
          minTraffic === null ||
          (typeof prospect.estimatedTraffic === 'number' && prospect.estimatedTraffic >= minTraffic)
        const matchesValue = minValue === null || prospect.valueScore >= minValue

        return matchesSearch && matchesList && matchesCost && matchesTraffic && matchesValue
      })
      .sort((a, b) => b.valueScore - a.valueScore)
  }, [backlinkListFilter, backlinkMaxCost, backlinkMinTraffic, backlinkMinValue, backlinkSearch, kit])

  const canOpenStep2 = Boolean(brief)
  const canOpenStep3 = Boolean(kit)
  const generatedPlatformCount = kit
    ? PLATFORM_IDS.filter((platformId) => {
        const block = kit.platformBlocks[platformId]
        return Boolean(block.body.trim())
      }).length
    : 0
  const hasGeneratedResults = Boolean(kit && hasGeneratedResultsInKit(kit))
  const isFocusedResultsView = initialWantsResultsView && Boolean(kit)
  const isDashboardView = Boolean(kit && (activeStep === 3 || isFocusedResultsView))

  const step1Status: StepStatus = brief ? 'complete' : 'active'
  const step2Status: StepStatus = !canOpenStep2 ? 'locked' : hasGeneratedResults && activeStep !== 2 ? 'complete' : 'active'
  const step3Status: StepStatus = !canOpenStep3 ? 'locked' : activeStep === 3 ? 'active' : 'complete'

  const getPlatformOutputLabel = (tabId: PlatformBlockId) => t(`platformLabels.${tabId}`)
  const getGrowthOutputLabel = (tabId: GrowthBlockId) => t(`growth.outputLabels.${tabId}`)
  const stepStatusLabels: Record<StepStatus, string> = {
    locked: t('stepStatus.locked'),
    active: t('stepStatus.active'),
    complete: t('stepStatus.complete'),
  }
  const currentGenerationFeedback =
    isGenerating && generationFeedbackSteps.length > 0 ? generationFeedbackSteps[generationFeedbackIndex] : ''

  const openStep = (step: DashboardStep) => {
    if (step === 2 && !canOpenStep2) {
      return
    }
    if (step === 3 && !canOpenStep3) {
      return
    }
    setActiveStep(step)
  }

  const buildExtractionFeedbackSteps = () => [
    t('extractionFeedback.readingSite'),
    t('extractionFeedback.extractingConcept'),
    t('extractionFeedback.mappingAudience'),
    t('extractionFeedback.findingFriction'),
    t('extractionFeedback.capturingVoice'),
    t('extractionFeedback.collectingProof'),
    t('extractionFeedback.buildingBrief'),
  ]

  const buildGenerationFeedbackSteps = (input: GenerateContentInput) => {
    const selectedPlatformBlocks = input.selectedBlocks || []
    const selectedChannelPacks = input.selectedChannelPackIds || []
    const selectedGrowthBlocks = input.selectedGrowthBlocks || []

    if (
      selectedPlatformBlocks.length > 0 ||
      selectedChannelPacks.length > 0 ||
      selectedGrowthBlocks.length > 0
    ) {
      return [
        t('generationFeedback.preparing'),
        ...selectedPlatformBlocks.map((blockId) =>
          t('generationFeedback.regeneratingBlock', { block: getPlatformOutputLabel(blockId) }),
        ),
        ...selectedChannelPacks.map((channelId) =>
          t('generationFeedback.regeneratingBlock', {
            block: t(`results.channels.${channelId}.title`),
          }),
        ),
        ...selectedGrowthBlocks.map((blockId) =>
          t('generationFeedback.regeneratingBlock', { block: getGrowthOutputLabel(blockId) }),
        ),
        t('generationFeedback.finalizing'),
      ]
    }

    return [
      t('generationFeedback.reasoningBrief'),
      t('generationFeedback.productHunt'),
      t('generationFeedback.hackerNews'),
      t('generationFeedback.reddit'),
      t('generationFeedback.indieHackers'),
      t('generationFeedback.linkedin'),
      t('generationFeedback.email'),
      ...(input.includeMediaKit ?? true ? [t('generationFeedback.mediaKit')] : []),
      t('generationFeedback.finalizing'),
    ]
  }

  const initials = session?.user.name
    ?.split(' ')
    .map((piece) => piece[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  const onIngest = async () => {
    if (!sourceUrl.trim()) {
      setError(t('errors.urlRequired'))
      return
    }

    setError('')
    setSuccess('')
    setExtractionFeedbackSteps(buildExtractionFeedbackSteps())
    setExtractionFeedbackIndex(0)
    setIsIngesting(true)

    try {
      const response = await fetch('/api/launch-kit/ingest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: sourceUrl.trim() }),
      })

      const json = (await response.json()) as { brief?: ExtractedBrief; error?: string }
      if (!response.ok || !json.brief) {
        throw new Error(json.error || t('errors.ingestFailed'))
      }

      setBrief(normalizeBrief(json.brief))
      updateKit(null)
      projectIdRef.current = null
      setProjectName(json.brief.productName || t('fields.untitledProject'))
      setActiveOnboardingCard(0)
      setActiveResultSection('channels')
      setActiveAssetKind('screenshots')
      setActiveStep(2)
      setSuccess(t('messages.briefReady'))
    } catch (ingestError) {
      setError(ingestError instanceof Error ? ingestError.message : t('errors.ingestFailed'))
    } finally {
      setIsIngesting(false)
      setExtractionFeedbackSteps([])
      setExtractionFeedbackIndex(0)
    }
  }

  const onGenerateAll = async () => {
    if (!brief) {
      return
    }

    await generateContent({
      selectedBlocks: [...FREE_PLATFORM_BLOCK_IDS],
      selectedChannelPackIds: [...FREE_CHANNEL_PACK_IDS],
      selectedGrowthBlocks: [],
      includeMediaKit: true,
      includeGrowthAssets: false,
    })
  }

  const onRegenerateBlock = async (blockId: PlatformBlockId) => {
    if (!brief) {
      return
    }

    await generateContent({
      selectedBlocks: [blockId],
      selectedGrowthBlocks: [],
      includeMediaKit: false,
      includeGrowthAssets: false,
    })
  }

  const onRegenerateGrowthBlock = async (blockId: GrowthBlockId) => {
    if (!brief) {
      return
    }

    await generateContent({
      selectedBlocks: [],
      selectedGrowthBlocks: [blockId],
      includeMediaKit: false,
      includeGrowthAssets: true,
    })
  }

  const generateContent = async (input: GenerateContentInput) => {
    if (!brief) {
      return
    }

    const includeMediaKit = input.includeMediaKit ?? true
    const includeGrowthAssets = input.includeGrowthAssets ?? true

    setError('')
    setSuccess('')
    setGenerationFeedbackSteps(buildGenerationFeedbackSteps(input))
    setGenerationFeedbackIndex(0)
    setIsGenerating(true)

    try {
      const response = await fetch('/api/launch-kit/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          brief,
          selectedBlocks: input.selectedBlocks,
          selectedChannelPackIds: input.selectedChannelPackIds,
          channelCardTarget: input.channelCardTarget,
          selectedGrowthBlocks: input.selectedGrowthBlocks,
          includeMediaKit,
          includeGrowthAssets,
          existingKit: kit,
        }),
      })

      const json = (await response.json()) as { launchKit?: LaunchKit; error?: string }
      if (!response.ok || !json.launchKit) {
        throw new Error(json.error || t('errors.generateFailed'))
      }

      updateKit(normalizeKit(json.launchKit, brief.language))
      setActiveStep(3)
      if (input.channelCardTarget) {
        setSuccess(t('messages.channelCardRegenerated'))
      } else if (input.selectedChannelPackIds && input.selectedChannelPackIds.length > 0) {
        setSuccess(t('messages.channelPackRegenerated'))
      } else if (input.selectedGrowthBlocks && input.selectedGrowthBlocks.length > 0) {
        setSuccess(t('messages.growthBlockRegenerated'))
      } else if (input.selectedBlocks && input.selectedBlocks.length > 0) {
        setSuccess(t('messages.blockRegenerated'))
      } else {
        setSuccess(t('messages.kitGenerated'))
      }
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : t('errors.generateFailed'))
    } finally {
      setIsGenerating(false)
      setGenerationFeedbackSteps([])
      setGenerationFeedbackIndex(0)
    }
  }

  const onGenerateAsset = async (templateId: string, format: LaunchAssetFormat) => {
    if (!brief || !kit) {
      return
    }

    const assetKey = `${templateId}:${format}`
    setError('')
    setSuccess('')
    setGeneratingAssetKey(assetKey)

    try {
      const response = await fetch('/api/launch-kit/assets/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          brief,
          launchKit: kit,
          templateId,
          format,
        }),
      })

      const json = (await response.json()) as { launchKit?: LaunchKit; error?: string }
      if (!response.ok || !json.launchKit) {
        throw new Error(json.error || t('errors.assetGenerateFailed'))
      }

      const nextKit = normalizeKit(json.launchKit, brief.language)
      const asset = nextKit.assetLibrary.generatedAssets.find(
        (item) => item.templateId === templateId && item.format === format,
      )
      updateKit(nextKit)

      if (asset?.status === 'failed') {
        setError(asset.error || t('errors.assetGenerateFailed'))
      } else {
        setSuccess(t('messages.assetGenerated'))
      }
    } catch (assetError) {
      setError(assetError instanceof Error ? assetError.message : t('errors.assetGenerateFailed'))
    } finally {
      setGeneratingAssetKey('')
    }
  }

  const onSaveProject = async () => {
    if (!brief || !kit) {
      setError(t('errors.saveRequiresKit'))
      return
    }

    setError('')
    setSuccess('')
    setIsSaving(true)

    try {
      if (session) {
        const saveResponse = await fetch('/api/launch-kit/projects', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            projectId: projectIdRef.current,
            sourceUrl: brief.sourceUrl,
            name: projectName,
            language: brief.language,
            brief,
            kit,
          }),
        })

        const saveJson = (await saveResponse.json()) as {
          project?: LaunchProjectSnapshot
          error?: string
        }

        if (!saveResponse.ok || !saveJson.project) {
          throw new Error(saveJson.error || t('errors.saveFailed'))
        }

        projectIdRef.current = saveJson.project.id
        setProjectName(saveJson.project.name)
        await loadServerProjects()
      } else {
        const snapshot: LaunchProjectSnapshot = {
          id: projectIdRef.current || `guest-${Date.now()}`,
          name: projectName.trim() || brief.productName || t('fields.untitledProject'),
          sourceUrl: brief.sourceUrl,
          language: brief.language,
          brief,
          kit,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        const current = readGuestProjects()
        const next = [snapshot, ...current.filter((item) => item.id !== snapshot.id)]
        writeGuestProjects(next)
        setGuestProjects(next)
        projectIdRef.current = snapshot.id
      }

      setSuccess(session ? t('messages.savedCloud') : t('messages.savedLocal'))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('errors.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  const onLoadProject = async (project: SavedProjectItem) => {
    setError('')
    setSuccess('')
    setLoadingProjectId(project.id)

    try {
      if (project.storage === 'guest') {
        if (!project.snapshot) {
          throw new Error(t('errors.projectLoadFailed'))
        }

        hydrateProject(project.snapshot, true)
        return
      }

      const response = await fetch(`/api/launch-kit/projects/${project.id}`)
      const json = (await response.json()) as { project?: LaunchProjectSnapshot; error?: string }
      if (!response.ok || !json.project) {
        throw new Error(json.error || t('errors.projectLoadFailed'))
      }

      hydrateProject(json.project, false)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('errors.projectLoadFailed'))
    } finally {
      setLoadingProjectId(null)
    }
  }

  const hydrateProject = (snapshot: LaunchProjectSnapshot, isGuest: boolean) => {
    setSourceUrl(snapshot.sourceUrl)
    const nextBrief = normalizeBrief(snapshot.brief)
    const nextKit = normalizeKit(snapshot.kit, snapshot.language)
    setBrief(nextBrief)
    updateKit(nextKit)
    projectIdRef.current = snapshot.id
    setProjectName(snapshot.name)
    setSelectedLeadIds([])
    setSelectedBacklinkProspectIds([])
    setActiveOnboardingCard(0)
    setActiveStep(hasGeneratedResultsInKit(nextKit) ? 3 : nextBrief.productName ? 2 : 1)
    setActiveResultSection('channels')
    setActiveAssetKind('screenshots')
    setSuccess(isGuest ? t('messages.loadedLocal') : t('messages.loadedCloud'))
  }

  const onExportMarkdown = async () => {
    if (!brief || !kit) {
      return
    }

    const projectId = projectIdRef.current
    if (session && projectId && !projectId.startsWith('guest-')) {
      const response = await fetch(`/api/launch-kit/projects/${projectId}/markdown`)
      if (response.ok) {
        const blob = await response.blob()
        downloadBlob(blob, `${slugify(projectName || brief.productName || 'launch-kit')}.md`)
        return
      }
    }

    const blob = new Blob([buildCurrentMarkdown()], { type: 'text/markdown;charset=utf-8' })
    downloadBlob(blob, `${slugify(projectName || brief.productName || 'launch-kit')}.md`)
  }

  const onOpenPressPack = async () => {
    if (!brief || !kit) {
      return
    }

    const projectId = projectIdRef.current
    if (session && projectId && !projectId.startsWith('guest-')) {
      window.open(`/api/launch-kit/projects/${projectId}/press-pack`, '_blank', 'noopener,noreferrer')
      return
    }

    const html = buildPressPackHtml({
      id: projectId || `local-${Date.now()}`,
      name: projectName || brief.productName,
      sourceUrl: brief.sourceUrl,
      language: brief.language,
      brief,
      kit,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, getExportLabels(t))

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    setTimeout(() => URL.revokeObjectURL(url), 1500)
  }

  const copyBlock = async (blockId: PlatformBlockId) => {
    if (!kit) {
      return
    }

    const block = kit.platformBlocks[blockId]
    const productHunt = blockId === 'product_hunt' ? block.productHunt : undefined
    if (productHunt) {
      await navigator.clipboard.writeText(
        [
          `${t('output.productHunt.tagline')}: ${productHunt.tagline}`,
          `${t('output.productHunt.description')}: ${productHunt.description}`,
          `${t('output.productHunt.tags')}: ${productHunt.tags.join(', ')}`,
          `${t('output.productHunt.firstComment')}:\n${productHunt.firstComment}`,
          `${t('output.copyNotesPrefix')}: ${block.notes}`,
        ]
          .filter(Boolean)
          .join('\n\n'),
      )
      setSuccess(t('messages.blockCopied', { platform: getPlatformOutputLabel(blockId) }))
      return
    }

    if (block.hackerNews) {
      await navigator.clipboard.writeText(
        [
          `${t('output.hackerNews.showHnTitle')}: ${block.hackerNews.showHnTitle}`,
          `${t('output.hackerNews.postBody')}:\n${block.hackerNews.postBody}`,
          `${t('output.hackerNews.feedbackAsk')}: ${block.hackerNews.feedbackAsk}`,
          `${t('output.hackerNews.discussionSeed')}: ${block.hackerNews.discussionSeed}`,
          `${t('output.copyNotesPrefix')}: ${block.notes}`,
        ].join('\n\n'),
      )
      setSuccess(t('messages.blockCopied', { platform: getPlatformOutputLabel(blockId) }))
      return
    }

    const redditRecommendations =
      blockId === 'reddit' && block.redditRecommendations
        ? formatRedditRecommendationsForCopy(block.redditRecommendations, {
            engagement: t('output.reddit.engagementTitle'),
            selfPromotion: t('output.reddit.selfPromotionTitle'),
            reason: t('output.reddit.reasonLabel'),
            postingGuidance: t('output.reddit.postingGuidanceLabel'),
          })
        : ''

    if (block.reddit) {
      await navigator.clipboard.writeText(
        [
          `${t('output.redditPost.postTitle')}: ${block.reddit.postTitle}`,
          `${t('output.redditPost.postBody')}:\n${block.reddit.postBody}`,
          `${t('output.redditPost.builderDisclosure')}: ${block.reddit.builderDisclosure}`,
          `${t('output.redditPost.discussionQuestion')}: ${block.reddit.discussionQuestion}`,
          `${t('output.redditPost.linkPolicyNote')}: ${block.reddit.linkPolicyNote}`,
          `${t('output.copyNotesPrefix')}: ${block.notes}`,
          redditRecommendations,
        ]
          .filter(Boolean)
          .join('\n\n'),
      )
      setSuccess(t('messages.blockCopied', { platform: getPlatformOutputLabel(blockId) }))
      return
    }

    if (block.indieHackers) {
      await navigator.clipboard.writeText(
        [
          `${t('output.indieHackers.postTitle')}: ${block.indieHackers.postTitle}`,
          `${t('output.indieHackers.founderStory')}:\n${block.indieHackers.founderStory}`,
          `${t('output.indieHackers.lesson')}: ${block.indieHackers.lesson}`,
          `${t('output.indieHackers.proofOrMetric')}: ${block.indieHackers.proofOrMetric}`,
          `${t('output.indieHackers.nextExperiment')}: ${block.indieHackers.nextExperiment}`,
          `${t('output.indieHackers.feedbackAsk')}: ${block.indieHackers.feedbackAsk}`,
          `${t('output.copyNotesPrefix')}: ${block.notes}`,
        ].join('\n\n'),
      )
      setSuccess(t('messages.blockCopied', { platform: getPlatformOutputLabel(blockId) }))
      return
    }

    if (block.linkedin) {
      await navigator.clipboard.writeText(
        [
          `${t('output.linkedinPost.hook')}: ${block.linkedin.hook}`,
          `${t('output.linkedinPost.postBody')}:\n${block.linkedin.postBody}`,
          `${t('output.linkedinPost.proofPoint')}: ${block.linkedin.proofPoint}`,
          `${t('output.linkedinPost.closingCta')}: ${block.linkedin.closingCta}`,
          `${t('output.copyNotesPrefix')}: ${block.notes}`,
        ].join('\n\n'),
      )
      setSuccess(t('messages.blockCopied', { platform: getPlatformOutputLabel(blockId) }))
      return
    }

    if (block.tiktok) {
      await navigator.clipboard.writeText(
        [
          `${t('output.shortVideo.hook')}: ${block.tiktok.hook}`,
          `${t('output.shortVideo.spokenScript')}:\n${block.tiktok.spokenScript}`,
          `${t('output.shortVideo.visualBeats')}:\n${block.tiktok.visualBeats.map((item) => `- ${item}`).join('\n')}`,
          `${t('output.shortVideo.onScreenText')}:\n${block.tiktok.onScreenText.map((item) => `- ${item}`).join('\n')}`,
          `${t('output.shortVideo.closeCta')}: ${block.tiktok.closeCta}`,
          `${t('output.copyNotesPrefix')}: ${block.notes}`,
        ].join('\n\n'),
      )
      setSuccess(t('messages.blockCopied', { platform: getPlatformOutputLabel(blockId) }))
      return
    }

    if (block.youtubeShorts) {
      await navigator.clipboard.writeText(
        [
          `${t('output.shortVideo.title')}: ${block.youtubeShorts.title}`,
          `${t('output.shortVideo.hook')}: ${block.youtubeShorts.hook}`,
          `${t('output.shortVideo.spokenScript')}:\n${block.youtubeShorts.spokenScript}`,
          `${t('output.shortVideo.visualBeats')}:\n${block.youtubeShorts.visualBeats.map((item) => `- ${item}`).join('\n')}`,
          `${t('output.shortVideo.retentionCue')}: ${block.youtubeShorts.retentionCue}`,
          `${t('output.shortVideo.closeCta')}: ${block.youtubeShorts.closeCta}`,
          `${t('output.copyNotesPrefix')}: ${block.notes}`,
        ].join('\n\n'),
      )
      setSuccess(t('messages.blockCopied', { platform: getPlatformOutputLabel(blockId) }))
      return
    }

    if (block.emailAnnouncement) {
      await navigator.clipboard.writeText(
        [
          `${t('output.emailAnnouncement.subject')}: ${block.emailAnnouncement.subject}`,
          `${t('output.emailAnnouncement.previewText')}: ${block.emailAnnouncement.previewText}`,
          `${t('output.emailAnnouncement.greeting')}: ${block.emailAnnouncement.greeting}`,
          `${t('output.emailAnnouncement.opening')}: ${block.emailAnnouncement.opening}`,
          `${t('output.emailAnnouncement.body')}:\n${block.emailAnnouncement.body}`,
          `${t('output.emailAnnouncement.ctaText')}: ${block.emailAnnouncement.ctaText}`,
          `${t('output.emailAnnouncement.signoff')}: ${block.emailAnnouncement.signoff}`,
          `${t('output.copyNotesPrefix')}: ${block.notes}`,
        ].join('\n\n'),
      )
      setSuccess(t('messages.blockCopied', { platform: getPlatformOutputLabel(blockId) }))
      return
    }

    await navigator.clipboard.writeText(
      [
        block.title,
        block.body,
        `${t('output.copyCtaPrefix')}: ${block.cta}`,
        `${t('output.copyNotesPrefix')}: ${block.notes}`,
        redditRecommendations,
      ]
        .filter(Boolean)
        .join('\n\n'),
    )
    setSuccess(t('messages.blockCopied', { platform: getPlatformOutputLabel(blockId) }))
  }

  const copyChannelCard = async (channelId: ChannelPackId, cardId: string) => {
    if (!kit) {
      return
    }

    const card = kit.channelPacks[channelId].cards.find((item) => item.id === cardId)
    if (!card) {
      return
    }

    await navigator.clipboard.writeText(
      formatChannelCardForCopy(channelId, card, {
        cta: t('output.copyCtaPrefix'),
        proofPoint: t('output.proofPointLabel'),
        socialContract: t('output.socialContractLabel'),
      }),
    )
    setSuccess(t('messages.channelCardCopied', { channel: kit.channelPacks[channelId].label }))
  }

  const updateChannelCard = (
    channelId: ChannelPackId,
    cardId: string,
    changes: Pick<ChannelCard, 'title' | 'body' | 'cta'>,
  ) => {
    setKit((current) => {
      if (!current) {
        return current
      }

      return normalizeKit(
        {
          ...current,
          channelPacks: {
            ...current.channelPacks,
            [channelId]: {
              ...current.channelPacks[channelId],
              cards: current.channelPacks[channelId].cards.map((card) =>
                card.id === cardId
                  ? {
                      ...card,
                      ...changes,
                    }
                  : card,
              ),
            },
          },
        },
        current.language,
      )
    })
  }

  const regenerateChannelCard = async (channelId: ChannelPackId, cardId: string) => {
    if (!brief) {
      return
    }

    await generateContent({
      selectedBlocks: [],
      selectedChannelPackIds: [channelId],
      channelCardTarget: {
        channelId,
        cardId,
      },
      selectedGrowthBlocks: [],
      includeMediaKit: false,
      includeGrowthAssets: false,
    })
  }

  const copyGrowthBlock = async (blockId: GrowthBlockId) => {
    if (!kit) {
      return
    }

    let payload = ''

    if (blockId === 'linkedin_outreach') {
      payload = formatOutreachPackForCopy(kit.growthAssets.linkedinOutreach, {
        notes: t('output.copyNotesPrefix'),
        subject: t('output.subjectLabel'),
        cta: t('output.copyCtaPrefix'),
      })
    } else if (blockId === 'x_outreach') {
      payload = formatOutreachPackForCopy(kit.growthAssets.xOutreach, {
        notes: t('output.copyNotesPrefix'),
        subject: t('output.subjectLabel'),
        cta: t('output.copyCtaPrefix'),
      })
    } else if (blockId === 'cold_email_outreach') {
      payload = formatOutreachPackForCopy(
        kit.growthAssets.emailOutreach,
        {
          notes: t('output.copyNotesPrefix'),
          subject: t('output.subjectLabel'),
          cta: t('output.copyCtaPrefix'),
        },
        true,
      )
    } else if (blockId === 'seo_posts') {
      payload = formatSeoPostsForCopy(kit.growthAssets.seoPostPacks, {
        cluster: t('output.clusterLabel'),
        meta: t('output.metaLabel'),
        outline: t('output.outlineLabel'),
        cta: t('output.copyCtaPrefix'),
      })
    }

    if (!payload) {
      return
    }

    await navigator.clipboard.writeText(payload)
    setSuccess(t('messages.blockCopied', { platform: getGrowthOutputLabel(blockId) }))
  }

  const onSignOut = async () => {
    await signOut()
    setSuccess('')
    setError('')
    push('/auth/login')
  }

  const setBriefField = <K extends keyof ExtractedBrief>(field: K, value: ExtractedBrief[K]) => {
    setBrief((current) => {
      if (!current) {
        return current
      }

      if (field === 'productName') {
        const nextProductName = String(value || '').trim()
        setProjectName(nextProductName || t('fields.untitledProject'))
      }

      return {
        ...current,
        [field]: value,
      }
    })
  }

  const applyKitPatch = (update: {
    prospecting?: LaunchKit['prospecting']
    growthAssets?: LaunchKit['growthAssets']
    seoGrowth?: LaunchKit['seoGrowth']
  }) => {
    setKit((current) => {
      if (!current) {
        return current
      }

      return normalizeKit(
        {
          ...current,
          prospecting: update.prospecting || current.prospecting,
          growthAssets: update.growthAssets || current.growthAssets,
          seoGrowth: update.seoGrowth || current.seoGrowth,
        },
        current.language,
      )
    })
  }

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeadIds((current) =>
      current.includes(leadId) ? current.filter((id) => id !== leadId) : [...current, leadId],
    )
  }

  const toggleBacklinkProspectSelection = (prospectId: string) => {
    setSelectedBacklinkProspectIds((current) =>
      current.includes(prospectId)
        ? current.filter((id) => id !== prospectId)
        : [...current, prospectId],
    )
  }

  const runSeoAction = async (
    path: string,
    body: Record<string, unknown>,
    afterSuccess?: (seoGrowth: LaunchKit['seoGrowth']) => void,
  ) => {
    if (!kit) {
      return
    }

    setIsSeoActionRunning(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = (await response.json()) as {
        seoGrowth?: LaunchKit['seoGrowth']
        info?: string
        error?: string
      }

      if (!response.ok || !json.seoGrowth) {
        throw new Error(json.error || t('errors.actionFailed'))
      }

      applyKitPatch({ seoGrowth: json.seoGrowth })
      afterSuccess?.(json.seoGrowth)
      setSuccess(json.info || t('messages.actionCompleted'))
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('errors.actionFailed'))
    } finally {
      setIsSeoActionRunning(false)
    }
  }

  const runProspectingPatch = async (
    path: string,
    body: Record<string, unknown>,
    afterSuccess?: (prospecting: LaunchKit['prospecting']) => void,
  ) => {
    if (!kit) {
      return
    }

    setIsActionRunning(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = (await response.json()) as {
        prospecting?: LaunchKit['prospecting']
        info?: string
        error?: string
      }

      if (!response.ok || !json.prospecting) {
        throw new Error(json.error || t('errors.actionFailed'))
      }

      applyKitPatch({ prospecting: json.prospecting })
      afterSuccess?.(json.prospecting)
      setSuccess(json.info || t('messages.actionCompleted'))
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('errors.actionFailed'))
    } finally {
      setIsActionRunning(false)
    }
  }

  const onScrapeEmailContacts = async () => {
    if (!brief || !kit) {
      return
    }

    await runProspectingPatch('/api/launch-kit/actions/prospect', {
      brief,
      prospecting: kit.prospecting,
    })
  }

  const onBuildEmailList = async () => {
    if (!kit) {
      return
    }

    await runProspectingPatch('/api/launch-kit/actions/build-email-list', {
      prospecting: kit.prospecting,
    })
  }

  const onImportEmailList = async () => {
    if (!kit) {
      return
    }

    if (!emailImportText.trim()) {
      setError(t('results.email.importEmpty'))
      return
    }

    await runProspectingPatch(
      '/api/launch-kit/actions/import-email-list',
      {
        prospecting: kit.prospecting,
        rawContacts: emailImportText,
      },
      () => setEmailImportText(''),
    )
  }

  const onPersonalizeEmailOutreach = async () => {
    if (!brief || !kit) {
      return
    }

    await runProspectingPatch('/api/launch-kit/actions/personalize-outreach', {
      brief,
      launchKit: kit,
      selectedLeadIds,
    })
  }

  const onSendOutreachEmail = async () => {
    if (!kit) {
      return
    }

    await runProspectingPatch('/api/launch-kit/actions/send-outreach-email', {
      launchKit: kit,
      selectedLeadIds,
    })
  }

  const onRunSeoAnalysis = async () => {
    if (!brief || !kit) {
      return
    }

    await runSeoAction('/api/launch-kit/actions/analyze-seo', {
      brief,
      seoGrowth: kit.seoGrowth,
    })
  }

  const onRunBlogStrategy = async () => {
    if (!brief || !kit) {
      return
    }

    await runSeoAction('/api/launch-kit/actions/blog-strategy', {
      brief,
      seoGrowth: kit.seoGrowth,
    })
  }

  const onRunBacklinkProspects = async () => {
    if (!brief || !kit) {
      return
    }

    await runSeoAction('/api/launch-kit/actions/backlink-prospect', {
      brief,
      seoGrowth: kit.seoGrowth,
    })
  }

  const onAddBacklinkProspectsToList = async () => {
    if (!kit) {
      return
    }

    if (selectedBacklinkProspectIds.length === 0) {
      setError(t('growth.seo.backlinks.selectFirst'))
      return
    }

    await runSeoAction('/api/launch-kit/actions/add-backlink-prospects-to-list', {
      seoGrowth: kit.seoGrowth,
      prospectIds: selectedBacklinkProspectIds,
      listName: backlinkListName,
    })
  }

  const onUpdateBacklinkProspectStatus = async (
    prospectId: string,
    status: BacklinkProspectStatus,
  ) => {
    if (!kit) {
      return
    }

    await runSeoAction('/api/launch-kit/actions/update-backlink-prospect-status', {
      seoGrowth: kit.seoGrowth,
      prospectId,
      status,
    })
  }

  const onPersonalizeBacklinkEmails = async () => {
    if (!brief || !kit) {
      return
    }

    await runSeoAction('/api/launch-kit/actions/personalize-backlink-emails', {
      brief,
      seoGrowth: kit.seoGrowth,
      prospectIds: selectedBacklinkProspectIds,
    })
  }

  const onSendBacklinkEmails = async () => {
    if (!kit) {
      return
    }

    await runSeoAction(
      '/api/launch-kit/actions/send-backlink-emails',
      {
        seoGrowth: kit.seoGrowth,
        prospectIds: selectedBacklinkProspectIds,
      },
      () => setSelectedBacklinkProspectIds([]),
    )
  }

  const onExportBacklinks = async () => {
    if (!brief || !kit) {
      return
    }

    setIsSeoActionRunning(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/launch-kit/actions/export-backlinks', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          projectName: projectName || brief.productName,
          seoGrowth: kit.seoGrowth,
        }),
      })

      if (!response.ok) {
        const json = (await response.json()) as { error?: string }
        throw new Error(json.error || t('errors.actionFailed'))
      }

      const blob = await response.blob()
      downloadBlob(blob, `${slugify(projectName || brief.productName || 'launch-kit-backlinks')}-backlinks.csv`)
      setSuccess(t('messages.backlinksExported'))
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('errors.actionFailed'))
    } finally {
      setIsSeoActionRunning(false)
    }
  }

  async function loadServerProjects() {
    const response = await fetch('/api/launch-kit/projects')
    if (!response.ok) {
      return
    }

    const json = (await response.json()) as { projects?: ProjectSummary[] }
    setServerProjects(json.projects || [])
  }

  return (
    <div className={`${appSans.className} min-h-screen overflow-x-clip bg-[#f7f7f3] text-zinc-900`}>
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-[#fffffb]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center" aria-label="shipdaddy">
            <BrandLogo className="h-10" priority />
          </Link>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUtilityDrawerOpen((value) => !value)}
              className="hidden border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 sm:inline-flex"
            >
              <Settings2 className="mr-1.5 size-4" />
              {t('utility.title')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hidden border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 sm:inline-flex"
            >
              <Link href="/pricing">{t('plans.paywall.cta')}</Link>
            </Button>
            {session ? (
              <>
                <div className="hidden items-center gap-2 rounded-full border border-violet-100 bg-violet-50/60 px-2 py-1.5 sm:flex">
                  <Avatar className="size-7 ring-2 ring-violet-400/20">
                    <AvatarImage src={session.user.image || undefined} alt={session.user.name || 'User'} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-600 to-fuchsia-500 text-[10px] text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-zinc-700">
                    {session.user.name || session.user.email}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSignOut}
                  className="border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                >
                  {t('signOut')}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                asChild
                className="bg-zinc-900 text-white shadow-md shadow-zinc-900/15 hover:bg-zinc-800"
              >
                <Link href="/auth/login">{t('signIn')}</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main
        className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${
          isDashboardView ? 'max-w-[1680px] py-4' : 'max-w-7xl py-6'
        }`}
      >
        {!isDashboardView ? (
          <section className="rounded-lg border border-zinc-200 bg-[#fffffb] px-5 py-5 shadow-sm sm:px-6">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                    {t('steps.step1Label')} - {t('steps.step3Label')}
                  </p>
                  <h1 className={`${displaySans.className} mt-2 text-3xl leading-tight text-zinc-900 sm:text-4xl`}>
                    {t('workflowHeader.title')}
                  </h1>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsUtilityDrawerOpen((value) => !value)}
                  className="border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                >
                  {isUtilityDrawerOpen ? (
                    <>
                      <PanelRightClose className="mr-1.5 size-4" />
                      {t('utility.closeButton')}
                    </>
                  ) : (
                    <>
                      <PanelRightOpen className="mr-1.5 size-4" />
                      {t('utility.openButton')}
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => openStep(1)}
                  className={`rounded-lg border p-3 text-left transition ${
                    activeStep === 1 ? 'border-sky-300 bg-sky-50' : 'border-zinc-200 bg-white hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-zinc-900">
                      {t('steps.step1Label')}: {t('steps.step1Title')}
                    </p>
                    <StepStatusPill status={step1Status} labels={stepStatusLabels} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-600">
                    {brief?.sourceUrl || sourceUrl || t('steps.step1Description')}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => openStep(2)}
                  disabled={!canOpenStep2}
                  className={`rounded-lg border p-3 text-left transition ${
                    !canOpenStep2
                      ? 'cursor-not-allowed border-zinc-200 bg-zinc-100/60'
                      : activeStep === 2
                        ? 'border-sky-300 bg-sky-50'
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-zinc-900">
                      {t('steps.step2Label')}: {t('steps.step2Title')}
                    </p>
                    <StepStatusPill status={step2Status} labels={stepStatusLabels} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-600">
                    {brief ? `${brief.productName} - ${brief.language.toUpperCase()}` : t('steps.step2Empty')}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => openStep(3)}
                  disabled={!canOpenStep3}
                  className={`rounded-lg border p-3 text-left transition ${
                    !canOpenStep3
                      ? 'cursor-not-allowed border-zinc-200 bg-zinc-100/60'
                      : activeStep === 3
                        ? 'border-sky-300 bg-sky-50'
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-zinc-900">
                      {t('steps.step3Label')}: {t('steps.step3Title')}
                    </p>
                    <StepStatusPill status={step3Status} labels={stepStatusLabels} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-600">
                    {kit
                      ? `${generatedPlatformCount} platform blocks • ${new Date(kit.generatedAt).toLocaleString()}`
                      : t('steps.step3Empty')}
                  </p>
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {(error || success) && (
          <section className="mt-4">
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            ) : null}
          </section>
        )}

        <section className={`${isDashboardView ? 'space-y-4' : 'mt-6 space-y-4'}`}>
          <article
            className={`rounded-lg border border-zinc-200 bg-[#fffffb] p-5 shadow-sm ${
              activeStep === 1 ? '' : 'hidden'
            }`}
          >
            <button type="button" onClick={() => openStep(1)} className="w-full text-left">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Wand2 className="size-4 text-violet-600" />
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
                    {t('steps.step1Label')} • {t('steps.step1Title')}
                  </p>
                </div>
                <StepStatusPill status={step1Status} labels={stepStatusLabels} />
              </div>
              <p className="mt-2 text-sm text-zinc-600">{t('steps.step1Description')}</p>
            </button>

            {activeStep === 1 ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-lg border border-zinc-200 bg-white p-2 shadow-inner shadow-zinc-100">
                  <input
                    value={sourceUrl}
                    onChange={(event) => setSourceUrl(event.target.value)}
                    aria-label={t('fields.urlPlaceholder')}
                    placeholder={t('fields.urlPlaceholder')}
                    className="h-11 w-full rounded-xl border border-transparent bg-transparent px-3 text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3">
                  {isIngesting && extractionFeedbackSteps.length > 0 ? (
                    <p aria-live="polite" className="text-sm font-medium text-violet-700">
                      {extractionFeedbackSteps[extractionFeedbackIndex]}
                    </p>
                  ) : null}
                  <Button
                    onClick={onIngest}
                    disabled={isIngesting}
                    className="h-11 rounded-lg bg-zinc-900 px-5 text-white shadow-lg shadow-zinc-900/20 hover:bg-zinc-800"
                  >
                    <Wand2 className="mr-2 size-4" />
                    {isIngesting ? t('actions.extracting') : t('actions.extractBrief')}
                  </Button>
                </div>
              </div>
            ) : null}
          </article>

          <article
            className={`rounded-lg border border-zinc-200 bg-[#fffffb] p-5 shadow-sm ${
              activeStep === 2 ? '' : 'hidden'
            }`}
          >
            <button
              type="button"
              onClick={() => openStep(2)}
              disabled={!canOpenStep2}
              className="w-full text-left disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <PenSquare className="size-4 text-violet-600" />
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
                    {t('steps.step2Label')} • {t('steps.step2Title')}
                  </p>
                </div>
                <StepStatusPill status={step2Status} labels={stepStatusLabels} />
              </div>
              <p className="mt-2 text-sm text-zinc-600">{t('steps.step2Description')}</p>
            </button>

            {activeStep === 2 ? (
              brief ? (
                <div className="mt-4 space-y-5">
                  <div className="rounded-lg border border-zinc-200 bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                          {t('onboarding.progress', { current: activeOnboardingCard + 1, total: 3 })}
                        </p>
                        <h3 className={`${displaySans.className} mt-1 text-2xl leading-tight text-zinc-900`}>
                          {activeOnboardingCard === 0
                            ? t('onboarding.productTitle')
                            : activeOnboardingCard === 1
                              ? t('onboarding.audienceTitle')
                              : t('onboarding.messageTitle')}
                        </h3>
                        <p className="mt-1 max-w-2xl text-sm text-zinc-600">
                          {activeOnboardingCard === 0
                            ? t('onboarding.productDescription')
                            : activeOnboardingCard === 1
                              ? t('onboarding.audienceDescription')
                              : t('onboarding.messageDescription')}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map((cardIndex) => (
                          <button
                            key={cardIndex}
                            type="button"
                            onClick={() => setActiveOnboardingCard(cardIndex as OnboardingCardIndex)}
                            className={`h-2.5 rounded-full transition-all ${
                              activeOnboardingCard === cardIndex ? 'w-8 bg-sky-600' : 'w-2.5 bg-zinc-200'
                            }`}
                            aria-label={t('onboarding.progress', { current: cardIndex + 1, total: 3 })}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3">
                      {activeOnboardingCard === 0 ? (
                        <>
                          <Field
                            label={t('fields.productName')}
                            value={brief.productName}
                            onChange={(value) => setBriefField('productName', value)}
                          />
                          <Field
                            label={t('fields.positioning')}
                            value={brief.positioning}
                            onChange={(value) => setBriefField('positioning', value)}
                            multiline
                          />
                          <Field
                            label={t('fields.voiceGuide')}
                            value={brief.voiceGuide}
                            onChange={(value) => setBriefField('voiceGuide', value)}
                            multiline
                          />
                          <Field
                            label={t('fields.cta')}
                            value={brief.cta}
                            onChange={(value) => setBriefField('cta', value)}
                          />
                        </>
                      ) : null}

                      {activeOnboardingCard === 1 ? (
                        <>
                          <Field
                            label={t('fields.icp')}
                            value={brief.icp}
                            onChange={(value) => setBriefField('icp', value)}
                            multiline
                          />
                          <Field
                            label={t('fields.targetUsers')}
                            value={brief.targetUsers.join('\n')}
                            onChange={(value) => setBriefField('targetUsers', splitEditableLines(value))}
                            onBlur={(value) => setBriefField('targetUsers', splitLines(value))}
                            multiline
                          />
                        </>
                      ) : null}

                      {activeOnboardingCard === 2 ? (
                        <>
                          <Field
                            label={t('fields.painPoints')}
                            value={brief.painPoints.join('\n')}
                            onChange={(value) => setBriefField('painPoints', splitEditableLines(value))}
                            onBlur={(value) => setBriefField('painPoints', splitLines(value))}
                            multiline
                          />
                          <Field
                            label={t('fields.valueProps')}
                            value={brief.valueProps.join('\n')}
                            onChange={(value) => setBriefField('valueProps', splitEditableLines(value))}
                            onBlur={(value) => setBriefField('valueProps', splitLines(value))}
                            multiline
                          />
                          <Field
                            label={t('fields.proofPoints')}
                            value={brief.proofPoints.join('\n')}
                            onChange={(value) => setBriefField('proofPoints', splitEditableLines(value))}
                            onBlur={(value) => setBriefField('proofPoints', splitLines(value))}
                            multiline
                          />
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsUtilityDrawerOpen(true)}
                      className="rounded-lg border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                    >
                      <PanelRightOpen className="mr-2 size-4" />
                      {t('actions.openBrandGuidelines')}
                    </Button>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setActiveOnboardingCard((current) => Math.max(0, current - 1) as OnboardingCardIndex)
                        }
                        disabled={activeOnboardingCard === 0}
                        className="rounded-lg border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                      >
                        {t('onboarding.back')}
                      </Button>
                      {activeOnboardingCard < 2 ? (
                        <Button
                          type="button"
                          onClick={() =>
                            setActiveOnboardingCard((current) => Math.min(2, current + 1) as OnboardingCardIndex)
                          }
                          className="rounded-lg bg-zinc-900 text-white hover:bg-zinc-800"
                        >
                          {t('onboarding.next')}
                        </Button>
                      ) : (
                        <>
                          {isGenerating && generationFeedbackSteps.length > 0 ? (
                            <p aria-live="polite" className="self-center text-sm font-medium text-violet-700">
                              {generationFeedbackSteps[generationFeedbackIndex]}
                            </p>
                          ) : null}
                          <Button
                            onClick={onGenerateAll}
                            disabled={isGenerating}
                            className="rounded-lg bg-zinc-900 text-white shadow-md shadow-zinc-900/20 hover:bg-zinc-800"
                          >
                            <Wand2 className="mr-2 size-4" />
                            {isGenerating ? t('actions.generating') : t('actions.generateLaunchContent')}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2 text-sm text-violet-700">
                  {t('steps.step2Empty')}
                </p>
              )
            ) : null}
          </article>

          <article
            className={
              isDashboardView
                ? 'space-y-4'
                : `rounded-lg border border-zinc-200 bg-[#fffffb] p-5 shadow-sm ${
                    activeStep === 3 ? '' : 'hidden'
                  }`
            }
          >
            {!isDashboardView ? (
              <button
                type="button"
                onClick={() => openStep(3)}
                disabled={!canOpenStep3}
                className="w-full text-left disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <BookOpenText className="size-4 text-violet-600" />
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">
                      {t('steps.step3Label')} • {t('steps.step3Title')}
                    </p>
                  </div>
                  <StepStatusPill status={step3Status} labels={stepStatusLabels} />
                </div>
                <p className="mt-2 text-sm text-zinc-600">{t('steps.step3Description')}</p>
              </button>
            ) : null}

            {activeStep === 3 || isFocusedResultsView ? (
              brief ? (
                <div className={isDashboardView ? 'space-y-4' : 'mt-4 space-y-5'}>
                  {!isDashboardView ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={onExportMarkdown}
                          disabled={!kit}
                          className="rounded-lg border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                        >
                          <Download className="mr-1.5 size-4" />
                          {t('actions.exportMarkdown')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={onOpenPressPack}
                          disabled={!kit}
                          className="rounded-lg border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                        >
                          <ExternalLink className="mr-1.5 size-4" />
                          {t('actions.openPressPack')}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsUtilityDrawerOpen(true)}
                          className="rounded-lg border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                        >
                          <Settings2 className="mr-1.5 size-4" />
                          {t('actions.openBrandGuidelines')}
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {kit ? (
                    <>
                      <ResultAssetBrowser
                        brief={brief}
                        kit={kit}
                        activeSection={activeResultSection}
                        activeChannel={activeTrafficChannel}
                        activeAssetKind={activeAssetKind}
                        onChannelChange={(channelId) => {
                          setActiveResultSection('channels')
                          setActiveTrafficChannel(channelId)
                        }}
                        onAssetKindChange={(assetKind) => {
                          setActiveResultSection('assets')
                          setActiveAssetKind(assetKind)
                        }}
                        onGenerateAsset={(templateId, format) => void onGenerateAsset(templateId, format)}
                        generatingAssetKey={generatingAssetKey}
                        onCopyChannelCard={(channelId, cardId) => void copyChannelCard(channelId, cardId)}
                        onUpdateChannelCard={updateChannelCard}
                        onRegenerateChannelCard={(channelId, cardId) =>
                          void regenerateChannelCard(channelId, cardId)
                        }
                        onCopyPlatformBlock={(blockId) => void copyBlock(blockId)}
                        onRegeneratePlatformBlock={(blockId) => void onRegenerateBlock(blockId)}
                        onCopyGrowthBlock={(blockId) => void copyGrowthBlock(blockId)}
                        onRegenerateGrowthBlock={(blockId) => void onRegenerateGrowthBlock(blockId)}
                        onExportMarkdown={onExportMarkdown}
                        onOpenPressPack={onOpenPressPack}
                        isGenerating={isGenerating}
                        feedbackText={currentGenerationFeedback}
                        filteredProspects={filteredBacklinkProspects}
                        selectedProspectIds={selectedBacklinkProspectIds}
                        backlinkSearch={backlinkSearch}
                        backlinkListFilter={backlinkListFilter}
                        backlinkMaxCost={backlinkMaxCost}
                        backlinkMinTraffic={backlinkMinTraffic}
                        backlinkMinValue={backlinkMinValue}
                        backlinkListName={backlinkListName}
                        isSeoActionRunning={isSeoActionRunning}
                        onBacklinkSearchChange={setBacklinkSearch}
                        onBacklinkListFilterChange={setBacklinkListFilter}
                        onBacklinkMaxCostChange={setBacklinkMaxCost}
                        onBacklinkMinTrafficChange={setBacklinkMinTraffic}
                        onBacklinkMinValueChange={setBacklinkMinValue}
                        onBacklinkListNameChange={setBacklinkListName}
                        onRunSeoAnalysis={() => void onRunSeoAnalysis()}
                        onRunBlogStrategy={() => void onRunBlogStrategy()}
                        onRunBacklinkProspects={() => void onRunBacklinkProspects()}
                        onToggleProspect={toggleBacklinkProspectSelection}
                        onAddToList={() => void onAddBacklinkProspectsToList()}
                        onBacklinkStatusChange={(prospectId, status) =>
                          void onUpdateBacklinkProspectStatus(prospectId, status)
                        }
                        onPersonalizeBacklinkEmails={() => void onPersonalizeBacklinkEmails()}
                        onSendBacklinkEmails={() => void onSendBacklinkEmails()}
                        onExportBacklinks={() => void onExportBacklinks()}
                        selectedLeadIds={selectedLeadIds}
                        onToggleLead={toggleLeadSelection}
                        emailImportText={emailImportText}
                        onEmailImportTextChange={setEmailImportText}
                        isEmailActionRunning={isActionRunning}
                        onScrapeEmailContacts={() => void onScrapeEmailContacts()}
                        onBuildEmailList={() => void onBuildEmailList()}
                        onImportEmailList={() => void onImportEmailList()}
                        onPersonalizeEmailOutreach={() => void onPersonalizeEmailOutreach()}
                        onSendOutreachEmail={() => void onSendOutreachEmail()}
                        toolbar={
                          isDashboardView ? (
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-[#fffffb] p-3 shadow-sm">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-zinc-900">
                                  {projectName || brief.productName}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-zinc-600">
                                  {brief.sourceUrl}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  variant="outline"
                                  onClick={onExportMarkdown}
                                  disabled={!kit}
                                  className="rounded-lg border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                                >
                                  <Download className="mr-1.5 size-4" />
                                  {t('actions.exportMarkdown')}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={onOpenPressPack}
                                  disabled={!kit}
                                  className="rounded-lg border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                                >
                                  <ExternalLink className="mr-1.5 size-4" />
                                  {t('actions.openPressPack')}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setIsUtilityDrawerOpen(true)}
                                  className="rounded-lg border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                                >
                                  <Settings2 className="mr-1.5 size-4" />
                                  {t('actions.openBrandGuidelines')}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={onSaveProject}
                                  disabled={!kit || isSaving}
                                  className="rounded-lg border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800"
                                >
                                  <Save className="mr-1.5 size-4" />
                                  {isSaving ? t('actions.saving') : t('actions.saveProject')}
                                </Button>
                              </div>
                            </div>
                          ) : null
                        }
                        labels={{
                          title: t('results.title'),
                          subtitle: t('results.subtitle'),
                          output: {
                            copy: t('actions.copyBlock'),
                            regenerate: t('actions.regenerateBlock'),
                            title: t('output.titleLabel'),
                            body: t('output.bodyLabel'),
                            cta: t('output.ctaLabel'),
                            notes: t('output.notesLabel'),
                            productHunt: {
                              tagline: t('output.productHunt.tagline'),
                              description: t('output.productHunt.description'),
                              tags: t('output.productHunt.tags'),
                              firstComment: t('output.productHunt.firstComment'),
                            },
                            hackerNews: {
                              showHnTitle: t('output.hackerNews.showHnTitle'),
                              postBody: t('output.hackerNews.postBody'),
                              feedbackAsk: t('output.hackerNews.feedbackAsk'),
                              discussionSeed: t('output.hackerNews.discussionSeed'),
                            },
                            redditPost: {
                              postTitle: t('output.redditPost.postTitle'),
                              postBody: t('output.redditPost.postBody'),
                              builderDisclosure: t('output.redditPost.builderDisclosure'),
                              discussionQuestion: t('output.redditPost.discussionQuestion'),
                              linkPolicyNote: t('output.redditPost.linkPolicyNote'),
                            },
                            indieHackers: {
                              postTitle: t('output.indieHackers.postTitle'),
                              founderStory: t('output.indieHackers.founderStory'),
                              lesson: t('output.indieHackers.lesson'),
                              proofOrMetric: t('output.indieHackers.proofOrMetric'),
                              nextExperiment: t('output.indieHackers.nextExperiment'),
                              feedbackAsk: t('output.indieHackers.feedbackAsk'),
                            },
                            linkedinPost: {
                              hook: t('output.linkedinPost.hook'),
                              postBody: t('output.linkedinPost.postBody'),
                              proofPoint: t('output.linkedinPost.proofPoint'),
                              closingCta: t('output.linkedinPost.closingCta'),
                            },
                            shortVideo: {
                              title: t('output.shortVideo.title'),
                              hook: t('output.shortVideo.hook'),
                              spokenScript: t('output.shortVideo.spokenScript'),
                              visualBeats: t('output.shortVideo.visualBeats'),
                              onScreenText: t('output.shortVideo.onScreenText'),
                              retentionCue: t('output.shortVideo.retentionCue'),
                              closeCta: t('output.shortVideo.closeCta'),
                            },
                            emailAnnouncement: {
                              subject: t('output.emailAnnouncement.subject'),
                              previewText: t('output.emailAnnouncement.previewText'),
                              greeting: t('output.emailAnnouncement.greeting'),
                              opening: t('output.emailAnnouncement.opening'),
                              body: t('output.emailAnnouncement.body'),
                              ctaText: t('output.emailAnnouncement.ctaText'),
                              signoff: t('output.emailAnnouncement.signoff'),
                            },
                            subject: t('output.subjectLabel'),
                            outline: t('output.outlineLabel'),
                            format: t('output.formatLabel'),
                            stage: t('output.stageLabel'),
                            proofPoint: t('output.proofPointLabel'),
                            socialContract: t('output.socialContractLabel'),
                            emptyChannelPack: t('growth.outputs.emptyChannelPack'),
                            redditEngagement: t('output.reddit.engagementTitle'),
                            redditSelfPromotion: t('output.reddit.selfPromotionTitle'),
                            redditReason: t('output.reddit.reasonLabel'),
                            redditPostingGuidance: t('output.reddit.postingGuidanceLabel'),
                            emptyOutreach: t('growth.outputs.emptyOutreach'),
                            emptySeo: t('growth.outputs.emptySeo'),
                          },
                          mediaKit: {
                            title: t('mediaKit.generatedTitle'),
                            exportMarkdown: t('actions.exportMarkdown'),
                            openPressPack: t('actions.openPressPack'),
                            fields: {
                              bio: t('mediaKit.fields.bio'),
                              oneLiner: t('mediaKit.fields.oneLiner'),
                              boilerplate: t('mediaKit.fields.boilerplate'),
                              pressRelease: t('mediaKit.fields.pressRelease'),
                              checklist: t('mediaKit.fields.checklist'),
                              screenshots: t('mediaKit.fields.screenshots'),
                              contact: t('mediaKit.fields.contact'),
                            },
                          },
                        }}
                        t={t}
                      />
                    </>
                  ) : (
                    <p className="rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2 text-sm text-violet-700">
                      {t('steps.step3Empty')}
                    </p>
                  )}

                  {!isDashboardView ? (
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        onClick={onSaveProject}
                        disabled={!kit || isSaving}
                        className="rounded-lg border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                      >
                        <Save className="mr-1.5 size-4" />
                        {isSaving ? t('actions.saving') : t('actions.saveProject')}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2 text-sm text-violet-700">
                  {t('steps.step3Empty')}
                </p>
              )
            ) : null}
          </article>
        </section>
      </main>

      {isUtilityDrawerOpen ? (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            className="absolute inset-0 bg-zinc-900/25"
            onClick={() => setIsUtilityDrawerOpen(false)}
            aria-label={t('utility.closeDrawerAria')}
          />
          <aside className="absolute right-0 top-0 size-full max-w-2xl overflow-y-auto border-l border-violet-200 bg-white p-5 shadow-2xl shadow-violet-500/10">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className={`${displaySans.className} text-2xl leading-tight text-zinc-900`}>
                {t('utility.title')}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUtilityDrawerOpen(false)}
                className="border-violet-200 text-violet-700 hover:bg-violet-50"
              >
                <PanelRightClose className="mr-1.5 size-4" />
                {t('utility.closeButton')}
              </Button>
            </div>

            <div className="space-y-5">
              <article className="rounded-[1.4rem] border border-violet-100 bg-white p-4 shadow-sm">
                <h3 className={`${displaySans.className} text-xl leading-tight text-zinc-900`}>
                  {t('utility.brandGuidelinesTitle')}
                </h3>
                <p className="mt-1 text-sm text-zinc-600">{t('utility.brandGuidelinesDescription')}</p>

                {brief ? (
                  <div className="mt-4 space-y-5">
                    <div className="rounded-2xl border border-violet-100 bg-violet-50/35 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                        {t('briefSection.title')}
                      </p>
                      <div className="mt-2 grid gap-3">
                        <Field
                          label={t('fields.productName')}
                          value={brief.productName}
                          onChange={(value) => setBriefField('productName', value)}
                        />
                        <Field
                          label={t('fields.positioning')}
                          value={brief.positioning}
                          onChange={(value) => setBriefField('positioning', value)}
                          multiline
                        />
                        <Field
                          label={t('fields.icp')}
                          value={brief.icp}
                          onChange={(value) => setBriefField('icp', value)}
                          multiline
                        />
                        <Field
                          label={t('fields.voiceGuide')}
                          value={brief.voiceGuide}
                          onChange={(value) => setBriefField('voiceGuide', value)}
                          multiline
                        />
                        <Field
                          label={t('fields.targetUsers')}
                          value={brief.targetUsers.join('\n')}
                          onChange={(value) => setBriefField('targetUsers', splitEditableLines(value))}
                          onBlur={(value) => setBriefField('targetUsers', splitLines(value))}
                          multiline
                        />
                        <Field
                          label={t('fields.painPoints')}
                          value={brief.painPoints.join('\n')}
                          onChange={(value) => setBriefField('painPoints', splitEditableLines(value))}
                          onBlur={(value) => setBriefField('painPoints', splitLines(value))}
                          multiline
                        />
                        <Field
                          label={t('fields.valueProps')}
                          value={brief.valueProps.join('\n')}
                          onChange={(value) => setBriefField('valueProps', splitEditableLines(value))}
                          onBlur={(value) => setBriefField('valueProps', splitLines(value))}
                          multiline
                        />
                        <Field
                          label={t('fields.keyClaims')}
                          value={brief.keyClaims.join('\n')}
                          onChange={(value) => setBriefField('keyClaims', splitEditableLines(value))}
                          onBlur={(value) => setBriefField('keyClaims', splitLines(value))}
                          multiline
                        />
                        <Field
                          label={t('fields.proofPoints')}
                          value={brief.proofPoints.join('\n')}
                          onChange={(value) => setBriefField('proofPoints', splitEditableLines(value))}
                          onBlur={(value) => setBriefField('proofPoints', splitLines(value))}
                          multiline
                        />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field
                            label={t('fields.cta')}
                            value={brief.cta}
                            onChange={(value) => setBriefField('cta', value)}
                          />
                          <Field
                            label={t('fields.language')}
                            value={brief.language}
                            onChange={(value) => setBriefField('language', value.trim() || 'en')}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3">
                          <span className="rounded-xl border border-amber-200 bg-white p-2 text-amber-700">
                            <Lock className="size-4" />
                          </span>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                              {t('plans.badges.premium')}
                            </p>
                            <h3 className={`${displaySans.className} mt-1 text-xl leading-tight text-zinc-900`}>
                              {t('utility.seoAnalysisTitle')}
                            </h3>
                            <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                              {t('plans.paywall.utilitySeoDescription')}
                            </p>
                          </div>
                        </div>
                        <Button asChild className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-800">
                          <Link href="/pricing">{t('plans.paywall.cta')}</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2 text-sm text-violet-700">
                    {t('utility.brandGuidelinesEmpty')}
                  </p>
                )}
              </article>

              <article className="rounded-[1.4rem] border border-violet-100 bg-white p-4 shadow-sm">
                <h3 className={`${displaySans.className} text-xl leading-tight text-zinc-900`}>
                  {t('savedProjects.title')}
                </h3>
                <p className="mt-1 text-sm text-zinc-600">
                  {session ? t('savedProjects.descriptionSignedIn') : t('savedProjects.descriptionGuest')}
                </p>

                <div className="mt-4 space-y-2">
                  {savedProjects.length > 0 ? (
                    savedProjects.map((project) => (
                      <button
                        type="button"
                        key={`${project.storage}:${project.id}`}
                        onClick={() => {
                          void onLoadProject(project)
                          setIsUtilityDrawerOpen(false)
                        }}
                        className="group w-full rounded-xl border border-violet-100 bg-violet-50/40 p-3 text-left transition hover:border-violet-300 hover:bg-violet-50"
                        disabled={loadingProjectId === project.id}
                      >
                        <p className="text-sm font-semibold text-zinc-900 group-hover:text-violet-700">
                          {project.name}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">{project.sourceUrl}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-violet-700">
                          {project.storage === 'server'
                            ? t('savedProjects.cloudLabel')
                            : t('savedProjects.localLabel')}{' '}
                          • {new Date(project.updatedAt).toLocaleString()}
                        </p>
                      </button>
                    ))
                  ) : (
                    <p className="rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2 text-sm text-violet-700">
                      {t('savedProjects.empty')}
                    </p>
                  )}
                </div>
              </article>

              <article className="rounded-[1.4rem] border border-violet-100 bg-white p-4 shadow-sm">
                <h3 className={`${displaySans.className} text-xl leading-tight text-zinc-900`}>
                  {t('workflow.title')}
                </h3>
                <ol className="mt-3 space-y-2 text-sm text-zinc-600">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 size-4 text-violet-500" />
                    <span>{t('workflow.item1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 size-4 text-violet-500" />
                    <span>{t('workflow.item2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 size-4 text-violet-500" />
                    <span>{t('workflow.item3')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 size-4 text-violet-500" />
                    <span>{t('workflow.item4')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 size-4 text-violet-500" />
                    <span>{t('workflow.item5')}</span>
                  </li>
                </ol>

                {!session && !isPending ? (
                  <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    {t('workflow.guestNotice')}
                  </p>
                ) : null}
              </article>
            </div>
          </aside>
        </div>
      ) : null}

    </div>
  )
}
