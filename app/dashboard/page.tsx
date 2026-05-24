'use client'

import Link from 'next/link'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { Playfair_Display, Space_Grotesk } from 'next/font/google'
import {
  BarChart3,
  BookOpenText,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  Filter,
  ImageIcon,
  Layers3,
  Link2,
  ListPlus,
  Lock,
  Mail,
  MessageSquareText,
  Monitor,
  PanelRightClose,
  PanelRightOpen,
  PenSquare,
  Search,
  Send,
  Sparkles,
  Video,
  Wand2,
} from 'lucide-react'
import { signOut, useSession } from '@/lib/auth-client'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { createDemoSnapshot } from '@/lib/launch-kit/demo'
import {
  PLATFORM_IDS,
  type BacklinkProspectStatus,
  type ExtractedBrief,
  type GeneratedLaunchAsset,
  type GrowthBlockId,
  type KeywordCluster,
  type LaunchAssetFormat,
  type LaunchAssetKind,
  type LaunchKit,
  type LaunchProjectSnapshot,
  type PlatformBlockId,
  type ProjectSummary,
  type RedditRecommendations,
  type SubredditRecommendation,
} from '@/lib/launch-kit/types'
import { normalizeBrief, normalizeKit } from '@/lib/launch-kit/normalizers'

const GUEST_PROJECTS_KEY = 'launch-kit-guest-projects-v1'

type TrafficChannelGroupId =
  | 'launch_platforms'
  | 'marketplaces'
  | 'social_community'
  | 'seo_ai_search'
  | 'email'
  | 'authority_backlinks'
  | 'press_partnerships'

type TrafficChannelId =
  | 'product_hunt'
  | 'hacker_news'
  | 'indie_hackers'
  | 'launch_directories'
  | 'trustmrr'
  | 'acquire_com'
  | 'flippa'
  | 'x'
  | 'linkedin'
  | 'threads'
  | 'reddit'
  | 'instagram'
  | 'tiktok'
  | 'youtube_shorts'
  | 'website_seo'
  | 'keyword_research'
  | 'blog_cadence'
  | 'geo_llm_visibility'
  | 'comparison_alternatives'
  | 'email_scrape_contacts'
  | 'email_import_list'
  | 'email_automation'
  | 'backlink_building'
  | 'guest_posts'
  | 'partner_pages'
  | 'directory_outreach'
  | 'media_kit'
  | 'pr_pitch'
  | 'podcast_pitch'
  | 'newsletter_partnerships'

type TrafficChannelGroup = {
  id: TrafficChannelGroupId
  channels: TrafficChannelId[]
}

type ResultBrowserSection = 'channels' | 'assets'

const TRAFFIC_CHANNEL_GROUPS: TrafficChannelGroup[] = [
  {
    id: 'launch_platforms',
    channels: ['product_hunt', 'hacker_news', 'indie_hackers', 'launch_directories'],
  },
  {
    id: 'marketplaces',
    channels: ['trustmrr', 'acquire_com', 'flippa'],
  },
  {
    id: 'social_community',
    channels: ['x', 'linkedin', 'threads', 'reddit', 'instagram', 'tiktok', 'youtube_shorts'],
  },
  {
    id: 'seo_ai_search',
    channels: ['website_seo', 'keyword_research', 'blog_cadence', 'geo_llm_visibility', 'comparison_alternatives'],
  },
  {
    id: 'email',
    channels: ['email_scrape_contacts', 'email_import_list', 'email_automation'],
  },
  {
    id: 'authority_backlinks',
    channels: ['backlink_building', 'guest_posts', 'partner_pages', 'directory_outreach'],
  },
  {
    id: 'press_partnerships',
    channels: ['media_kit', 'pr_pitch', 'podcast_pitch', 'newsletter_partnerships'],
  },
]

const DEFAULT_OPEN_TRAFFIC_GROUPS: Record<TrafficChannelGroupId, boolean> = {
  launch_platforms: true,
  marketplaces: true,
  social_community: true,
  seo_ai_search: true,
  email: true,
  authority_backlinks: true,
  press_partnerships: true,
}

const ASSET_NAV_ITEMS: LaunchAssetKind[] = ['screenshots', 'image_ads', 'video_ads', 'text_ads']

const MARKETPLACE_CHANNEL_URLS: Partial<Record<TrafficChannelId, string>> = {
  trustmrr: 'https://trustmrr.com/',
  acquire_com: 'https://acquire.com/',
  flippa: 'https://flippa.com/',
}

type SavedProjectItem = ProjectSummary & {
  storage: 'server' | 'guest'
  snapshot?: LaunchProjectSnapshot
}

type DashboardStep = 1 | 2 | 3
type OnboardingCardIndex = 0 | 1 | 2
type StepStatus = 'locked' | 'active' | 'complete'
type GenerateContentInput = {
  selectedBlocks?: PlatformBlockId[]
  selectedGrowthBlocks?: GrowthBlockId[]
  includeMediaKit?: boolean
  includeGrowthAssets?: boolean
}

const editorialSerif = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
})

const interfaceSans = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const BACKLINK_STATUS_OPTIONS: BacklinkProspectStatus[] = [
  'new',
  'first_contact',
  'second_contact',
  'in_negotiation',
  'closed',
  'rejected',
]

export default function DashboardPage() {
  const t = useTranslations('LaunchKit')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, isPending } = useSession()

  const [currentLocale, setCurrentLocale] = useState('en')
  const [sourceUrl, setSourceUrl] = useState('')
  const [brief, setBrief] = useState<ExtractedBrief | null>(null)
  const [kit, setKit] = useState<LaunchKit | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState('')

  const [isIngesting, setIsIngesting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [extractionFeedbackSteps, setExtractionFeedbackSteps] = useState<string[]>([])
  const [extractionFeedbackIndex, setExtractionFeedbackIndex] = useState(0)
  const [generationFeedbackSteps, setGenerationFeedbackSteps] = useState<string[]>([])
  const [generationFeedbackIndex, setGenerationFeedbackIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [serverProjects, setServerProjects] = useState<ProjectSummary[]>([])
  const [guestProjects, setGuestProjects] = useState<LaunchProjectSnapshot[]>([])
  const [queryHydrated, setQueryHydrated] = useState(false)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])
  const [isActionRunning, setIsActionRunning] = useState(false)
  const [activeTrafficChannel, setActiveTrafficChannel] = useState<TrafficChannelId>('product_hunt')
  const [activeResultSection, setActiveResultSection] = useState<ResultBrowserSection>('channels')
  const [activeAssetKind, setActiveAssetKind] = useState<LaunchAssetKind>('screenshots')
  const [activeStep, setActiveStep] = useState<DashboardStep>(1)
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

  useEffect(() => {
    const locale = document.cookie
      .split('; ')
      .find((row) => row.startsWith('locale='))
      ?.split('=')[1] || 'en'
    setCurrentLocale(locale)

    setGuestProjects(readGuestProjects())
  }, [])

  useEffect(() => {
    if (!session) {
      setServerProjects([])
      return
    }

    void loadServerProjects()
  }, [session])

  useEffect(() => {
    if (queryHydrated) {
      return
    }

    const urlParam = searchParams?.get('url')?.trim() || ''
    const wantsDemo = searchParams?.get('demo') === '1'
    const wantsResultsView = searchParams?.get('view') === 'results'

    if (!urlParam && !wantsDemo) {
      setQueryHydrated(true)
      return
    }

    if (urlParam) {
      setSourceUrl(urlParam)
      setBrief(null)
      setKit(null)
      setProjectId(null)
      setProjectName('')
      setActiveStep(1)
      setError('')
      setSuccess(t('messages.urlPrefilled'))
      setQueryHydrated(true)
      return
    }

    const demoSnapshot = createDemoSnapshot(window.location.origin)
    setSourceUrl(demoSnapshot.sourceUrl)
    setBrief(normalizeBrief(demoSnapshot.brief))
    setKit(normalizeKit(demoSnapshot.kit, demoSnapshot.brief.language))
    setProjectId(demoSnapshot.id)
    setProjectName(demoSnapshot.name)
    setActiveStep(wantsResultsView ? 3 : 2)
    setActiveTrafficChannel('product_hunt')
    setActiveResultSection('channels')
    setActiveAssetKind('screenshots')
    setError('')
    setSuccess(wantsResultsView ? '' : t('messages.demoLoaded'))
    setQueryHydrated(true)
  }, [queryHydrated, searchParams, t])

  useEffect(() => {
    if (!brief) {
      return
    }

    if (!projectName.trim()) {
      setProjectName(brief.productName || t('fields.untitledProject'))
    }
  }, [brief, projectName, t])

  useEffect(() => {
    if (!kit) {
      return
    }

    const leadIds = new Set(kit.prospecting.leads.map((lead) => lead.id))
    setSelectedLeadIds((current) => current.filter((id) => leadIds.has(id)))
  }, [kit])

  useEffect(() => {
    if (!kit) {
      return
    }

    const prospectIds = new Set(kit.seoGrowth.backlinkProspects.map((prospect) => prospect.id))
    setSelectedBacklinkProspectIds((current) => current.filter((id) => prospectIds.has(id)))
  }, [kit])

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

  const currentMarkdown = useMemo(() => {
    if (!brief || !kit) {
      return ''
    }

    return buildMarkdown({
      id: projectId || `local-${Date.now()}`,
      name: projectName.trim() || brief.productName || t('fields.untitledProject'),
      sourceUrl: brief.sourceUrl,
      language: brief.language,
      brief,
      kit,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, getExportLabels(t))
  }, [brief, kit, projectId, projectName, t])

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
  const isFocusedResultsView = searchParams?.get('view') === 'results' && Boolean(kit)

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
    const selectedGrowthBlocks = input.selectedGrowthBlocks || []

    if (selectedPlatformBlocks.length > 0) {
      return [
        t('generationFeedback.preparing'),
        ...selectedPlatformBlocks.map((blockId) =>
          t('generationFeedback.regeneratingBlock', { block: getPlatformOutputLabel(blockId) }),
        ),
        t('generationFeedback.finalizing'),
      ]
    }

    if (selectedGrowthBlocks.length > 0) {
      return [
        t('generationFeedback.preparing'),
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
      t('generationFeedback.tiktok'),
      t('generationFeedback.youtube'),
      t('generationFeedback.email'),
      ...(input.includeGrowthAssets ?? true
        ? [
            t('generationFeedback.linkedinOutreach'),
            t('generationFeedback.xOutreach'),
            t('generationFeedback.coldEmail'),
            t('generationFeedback.seoPosts'),
          ]
        : []),
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
      setKit(null)
      setProjectId(null)
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
      includeMediaKit: true,
      includeGrowthAssets: true,
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

      setKit(normalizeKit(json.launchKit, brief.language))
      setActiveStep(3)
      if (input.selectedGrowthBlocks && input.selectedGrowthBlocks.length > 0) {
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
      setKit(nextKit)

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
            projectId,
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

        setProjectId(saveJson.project.id)
        setProjectName(saveJson.project.name)
        await loadServerProjects()
      } else {
        const snapshot: LaunchProjectSnapshot = {
          id: projectId || `guest-${Date.now()}`,
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
        setProjectId(snapshot.id)
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
    setKit(nextKit)
    setProjectId(snapshot.id)
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

    if (session && projectId && !projectId.startsWith('guest-')) {
      const response = await fetch(`/api/launch-kit/projects/${projectId}/markdown`)
      if (response.ok) {
        const blob = await response.blob()
        downloadBlob(blob, `${slugify(projectName || brief.productName || 'launch-kit')}.md`)
        return
      }
    }

    const blob = new Blob([currentMarkdown], { type: 'text/markdown;charset=utf-8' })
    downloadBlob(blob, `${slugify(projectName || brief.productName || 'launch-kit')}.md`)
  }

  const onOpenPressPack = async () => {
    if (!brief || !kit) {
      return
    }

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
    const redditRecommendations =
      blockId === 'reddit' && block.redditRecommendations
        ? formatRedditRecommendationsForCopy(block.redditRecommendations, {
            engagement: t('output.reddit.engagementTitle'),
            selfPromotion: t('output.reddit.selfPromotionTitle'),
            reason: t('output.reddit.reasonLabel'),
            postingGuidance: t('output.reddit.postingGuidanceLabel'),
          })
        : ''

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
    router.push('/auth/login')
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

  const setKeywordClusterField = (
    clusterId: string,
    field: keyof KeywordCluster,
    value: string | string[],
  ) => {
    setBrief((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        keywordResearch: {
          ...current.keywordResearch,
          clusters: current.keywordResearch.clusters.map((cluster) => {
            if (cluster.id !== clusterId) {
              return cluster
            }

            return {
              ...cluster,
              [field]: value,
            } as KeywordCluster
          }),
        },
      }
    })
  }

  const addKeywordCluster = () => {
    setBrief((current) => {
      if (!current) {
        return current
      }

      const nextIndex = current.keywordResearch.clusters.length + 1
      return {
        ...current,
        keywordResearch: {
          ...current.keywordResearch,
          clusters: [
            ...current.keywordResearch.clusters,
            {
              id: `kw-custom-${Date.now()}-${nextIndex}`,
              topic: '',
              intent: 'informational',
              priority: 'medium',
              keywords: [],
              contentAngles: [],
            },
          ],
        },
      }
    })
  }

  const removeKeywordCluster = (clusterId: string) => {
    setBrief((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        keywordResearch: {
          ...current.keywordResearch,
          clusters: current.keywordResearch.clusters.filter((cluster) => cluster.id !== clusterId),
        },
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
    <div className={`${interfaceSans.className} relative min-h-screen overflow-x-clip bg-[#fbfaff] text-zinc-900`}>
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-24 -right-16 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-violet-300/55 via-fuchsia-200/35 to-transparent blur-3xl" />
        <div className="absolute top-1/3 -left-24 h-[340px] w-[340px] rounded-full bg-gradient-to-tr from-purple-300/35 via-violet-200/20 to-transparent blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-violet-100 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 shadow-lg shadow-violet-500/30">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className={`${editorialSerif.className} text-lg font-semibold leading-none tracking-tight text-zinc-900`}>
                Launch Kit
              </p>
              <p className="text-xs text-zinc-500">{t('tagline')}</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSwitcher currentLocale={currentLocale} />
            {session ? (
              <>
                <div className="hidden items-center gap-2 rounded-full border border-violet-100 bg-violet-50/60 px-2 py-1.5 sm:flex">
                  <Avatar className="h-7 w-7 ring-2 ring-violet-400/20">
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
                  className="border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
                >
                  {t('signOut')}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                asChild
                className="bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-md shadow-violet-500/30 hover:from-violet-700 hover:to-fuchsia-600"
              >
                <Link href="/auth/login">{t('signIn')}</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main
        className={`relative z-10 mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 ${
          isFocusedResultsView ? 'max-w-[1500px]' : 'max-w-7xl'
        }`}
      >
        {!isFocusedResultsView ? (
          <section className="relative overflow-hidden rounded-[2rem] border border-violet-100 bg-white px-6 py-7 shadow-[0_30px_70px_-45px_rgba(100,40,180,0.45)] sm:px-8 sm:py-9">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(168,85,247,0.15),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(217,70,239,0.12),transparent_42%)]" />
            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-700">
                    {t('steps.step1Label')} - {t('steps.step3Label')}
                  </p>
                  <h1 className={`${editorialSerif.className} mt-2 text-3xl leading-tight text-zinc-900 sm:text-4xl`}>
                    {t('workflowHeader.title')}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-zinc-600 sm:text-base">
                    {t('workflowHeader.description')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsUtilityDrawerOpen((value) => !value)}
                  className="border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
                >
                  {isUtilityDrawerOpen ? (
                    <>
                      <PanelRightClose className="mr-1.5 h-4 w-4" />
                      {t('utility.closeButton')}
                    </>
                  ) : (
                    <>
                      <PanelRightOpen className="mr-1.5 h-4 w-4" />
                      {t('utility.openButton')}
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => openStep(1)}
                  className={`rounded-xl border p-3 text-left transition ${
                    activeStep === 1 ? 'border-violet-400 bg-violet-50/80' : 'border-violet-100 bg-white'
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
                  className={`rounded-xl border p-3 text-left transition ${
                    !canOpenStep2
                      ? 'cursor-not-allowed border-zinc-200 bg-zinc-100/60'
                      : activeStep === 2
                        ? 'border-violet-400 bg-violet-50/80'
                        : 'border-violet-100 bg-white'
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
                  className={`rounded-xl border p-3 text-left transition ${
                    !canOpenStep3
                      ? 'cursor-not-allowed border-zinc-200 bg-zinc-100/60'
                      : activeStep === 3
                        ? 'border-violet-400 bg-violet-50/80'
                        : 'border-violet-100 bg-white'
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

        <section className={`${isFocusedResultsView ? 'space-y-4' : 'mt-6 space-y-4'}`}>
          <article
            className={`rounded-[1.6rem] border border-violet-100 bg-white p-5 shadow-sm ${
              activeStep === 1 ? '' : 'hidden'
            }`}
          >
            <button type="button" onClick={() => openStep(1)} className="w-full text-left">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-violet-600" />
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
                    {t('steps.step1Label')} • {t('steps.step1Title')}
                  </p>
                </div>
                <StepStatusPill status={step1Status} labels={stepStatusLabels} />
              </div>
              <p className="mt-2 text-sm text-zinc-600">{t('steps.step1Description')}</p>
            </button>

            {activeStep === 1 ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-violet-200 bg-white p-2 shadow-inner shadow-violet-100/60">
                  <input
                    value={sourceUrl}
                    onChange={(event) => setSourceUrl(event.target.value)}
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
                    className="h-11 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 text-white shadow-lg shadow-violet-500/35 hover:from-violet-700 hover:to-fuchsia-600"
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    {isIngesting ? t('actions.extracting') : t('actions.extractBrief')}
                  </Button>
                </div>
              </div>
            ) : null}
          </article>

          <article
            className={`rounded-[1.6rem] border border-violet-100 bg-white p-5 shadow-sm ${
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
                  <PenSquare className="h-4 w-4 text-violet-600" />
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
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
                  <div className="rounded-2xl border border-violet-100 bg-[linear-gradient(135deg,#fff_0%,#faf5ff_55%,#fff_100%)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                          {t('onboarding.progress', { current: activeOnboardingCard + 1, total: 3 })}
                        </p>
                        <h3 className={`${editorialSerif.className} mt-1 text-2xl leading-tight text-zinc-900`}>
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
                              activeOnboardingCard === cardIndex ? 'w-8 bg-violet-600' : 'w-2.5 bg-violet-200'
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
                      className="rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50"
                    >
                      <PanelRightOpen className="mr-2 h-4 w-4" />
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
                        className="rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50 disabled:opacity-50"
                      >
                        {t('onboarding.back')}
                      </Button>
                      {activeOnboardingCard < 2 ? (
                        <Button
                          type="button"
                          onClick={() =>
                            setActiveOnboardingCard((current) => Math.min(2, current + 1) as OnboardingCardIndex)
                          }
                          className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-800"
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
                            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-md shadow-violet-500/30 hover:from-violet-700 hover:to-fuchsia-600"
                          >
                            <Wand2 className="mr-2 h-4 w-4" />
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
              isFocusedResultsView
                ? 'space-y-4'
                : `rounded-[1.6rem] border border-violet-100 bg-white p-5 shadow-sm ${
                    activeStep === 3 ? '' : 'hidden'
                  }`
            }
          >
            {!isFocusedResultsView ? (
              <button
                type="button"
                onClick={() => openStep(3)}
                disabled={!canOpenStep3}
                className="w-full text-left disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <BookOpenText className="h-4 w-4 text-violet-600" />
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
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
                <div className={isFocusedResultsView ? 'space-y-4' : 'mt-4 space-y-5'}>
                  <div
                    className={`flex flex-wrap items-center justify-between gap-2 ${
                      isFocusedResultsView
                        ? 'rounded-2xl border border-violet-100 bg-white p-3 shadow-sm'
                        : ''
                    }`}
                  >
                    {isFocusedResultsView ? (
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-900">
                          {projectName || brief.productName}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-zinc-600">{brief.sourceUrl}</p>
                      </div>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={onExportMarkdown}
                        disabled={!kit}
                        className="rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50"
                      >
                        {t('actions.exportMarkdown')}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={onOpenPressPack}
                        disabled={!kit}
                        className="rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50"
                      >
                        {t('actions.openPressPack')}
                      </Button>
                      {isFocusedResultsView ? (
                        <Button
                          variant="outline"
                          onClick={() => setIsUtilityDrawerOpen(true)}
                          className="rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50"
                        >
                          <PanelRightOpen className="mr-1.5 h-4 w-4" />
                          {t('actions.openBrandGuidelines')}
                        </Button>
                      ) : null}
                    </div>
                  </div>

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
                            subject: t('output.subjectLabel'),
                            outline: t('output.outlineLabel'),
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

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={onSaveProject}
                      disabled={!kit || isSaving}
                      className="rounded-xl border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
                    >
                      {isSaving ? t('actions.saving') : t('actions.saveProject')}
                    </Button>
                  </div>
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
          <aside className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-violet-200 bg-white p-5 shadow-2xl shadow-violet-500/10">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className={`${editorialSerif.className} text-2xl leading-tight text-zinc-900`}>
                {t('utility.title')}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUtilityDrawerOpen(false)}
                className="border-violet-200 text-violet-700 hover:bg-violet-50"
              >
                <PanelRightClose className="mr-1.5 h-4 w-4" />
                {t('utility.closeButton')}
              </Button>
            </div>

            <div className="space-y-5">
              <article className="rounded-[1.4rem] border border-violet-100 bg-white p-4 shadow-sm">
                <h3 className={`${editorialSerif.className} text-xl leading-tight text-zinc-900`}>
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

                    <div className="rounded-2xl border border-violet-100 bg-white p-3">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                            {t('utility.seoAnalysisTitle')}
                          </p>
                          <p className="text-xs text-zinc-600">{t('growth.keywordResearch.description')}</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={addKeywordCluster}
                          className="border-violet-200 text-violet-700 hover:bg-violet-50"
                        >
                          {t('growth.keywordResearch.addCluster')}
                        </Button>
                      </div>

                      <Field
                        label={t('growth.keywordResearch.notes')}
                        value={brief.keywordResearch.notes}
                        onChange={(value) =>
                          setBriefField('keywordResearch', {
                            ...brief.keywordResearch,
                            notes: value,
                          })
                        }
                        multiline
                      />

                      <div className="mt-3 space-y-3">
                        {brief.keywordResearch.clusters.length > 0 ? (
                          brief.keywordResearch.clusters.map((cluster) => (
                            <div key={cluster.id} className="rounded-xl border border-violet-200 bg-violet-50/35 p-3">
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-700">
                                  {t('growth.keywordResearch.clusterLabel')}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => removeKeywordCluster(cluster.id)}
                                  className="text-xs font-medium text-rose-600 hover:text-rose-700"
                                >
                                  {t('growth.keywordResearch.removeCluster')}
                                </button>
                              </div>

                              <Field
                                label={t('growth.keywordResearch.topic')}
                                value={cluster.topic}
                                onChange={(value) => setKeywordClusterField(cluster.id, 'topic', value)}
                              />

                              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                                <SelectField
                                  label={t('growth.keywordResearch.intent')}
                                  value={cluster.intent}
                                  onChange={(value) => setKeywordClusterField(cluster.id, 'intent', value)}
                                  options={[
                                    { value: 'informational', label: t('growth.keywordResearch.intents.informational') },
                                    { value: 'commercial', label: t('growth.keywordResearch.intents.commercial') },
                                    { value: 'transactional', label: t('growth.keywordResearch.intents.transactional') },
                                    { value: 'navigational', label: t('growth.keywordResearch.intents.navigational') },
                                  ]}
                                />
                                <SelectField
                                  label={t('growth.keywordResearch.priority')}
                                  value={cluster.priority}
                                  onChange={(value) => setKeywordClusterField(cluster.id, 'priority', value)}
                                  options={[
                                    { value: 'high', label: t('growth.keywordResearch.priorities.high') },
                                    { value: 'medium', label: t('growth.keywordResearch.priorities.medium') },
                                    { value: 'low', label: t('growth.keywordResearch.priorities.low') },
                                  ]}
                                />
                              </div>

                              <Field
                                label={t('growth.keywordResearch.keywords')}
                                value={cluster.keywords.join('\n')}
                                onChange={(value) =>
                                  setKeywordClusterField(cluster.id, 'keywords', splitEditableLines(value))
                                }
                                onBlur={(value) => setKeywordClusterField(cluster.id, 'keywords', splitLines(value))}
                                multiline
                              />
                              <Field
                                label={t('growth.keywordResearch.contentAngles')}
                                value={cluster.contentAngles.join('\n')}
                                onChange={(value) =>
                                  setKeywordClusterField(cluster.id, 'contentAngles', splitEditableLines(value))
                                }
                                onBlur={(value) =>
                                  setKeywordClusterField(cluster.id, 'contentAngles', splitLines(value))
                                }
                                multiline
                              />
                            </div>
                          ))
                        ) : (
                          <p className="rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-sm text-violet-700">
                            {t('growth.keywordResearch.empty')}
                          </p>
                        )}
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
                <h3 className={`${editorialSerif.className} text-xl leading-tight text-zinc-900`}>
                  {t('savedProjects.title')}
                </h3>
                <p className="mt-1 text-sm text-zinc-600">
                  {session ? t('savedProjects.descriptionSignedIn') : t('savedProjects.descriptionGuest')}
                </p>

                <div className="mt-4 space-y-2">
                  {savedProjects.length > 0 ? (
                    savedProjects.map((project) => (
                      <button
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
                <h3 className={`${editorialSerif.className} text-xl leading-tight text-zinc-900`}>
                  {t('workflow.title')}
                </h3>
                <ol className="mt-3 space-y-2 text-sm text-zinc-600">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 h-4 w-4 text-violet-500" />
                    <span>{t('workflow.item1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 h-4 w-4 text-violet-500" />
                    <span>{t('workflow.item2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 h-4 w-4 text-violet-500" />
                    <span>{t('workflow.item3')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 h-4 w-4 text-violet-500" />
                    <span>{t('workflow.item4')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 h-4 w-4 text-violet-500" />
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

function StepStatusPill({ status, labels }: { status: StepStatus; labels: Record<StepStatus, string> }) {
  if (status === 'locked') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
        <Lock className="h-3 w-3" />
        {labels.locked}
      </span>
    )
  }

  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-violet-300 bg-violet-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-700">
        {labels.active}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
      <CheckCircle2 className="h-3 w-3" />
      {labels.complete}
    </span>
  )
}

type FieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  onBlur?: (value: string) => void
  multiline?: boolean
}

function Field({ label, value, onChange, onBlur, multiline = false }: FieldProps) {
  return (
    <label className="mt-2 block text-sm">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={(event) => onBlur?.(event.target.value)}
          rows={4}
          className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/40"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={(event) => onBlur?.(event.target.value)}
          className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/40"
        />
      )}
    </label>
  )
}

function MediaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">{label}</p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{value}</p>
    </div>
  )
}

function ResultAssetBrowser({
  brief,
  kit,
  activeSection,
  activeChannel,
  activeAssetKind,
  onChannelChange,
  onAssetKindChange,
  onGenerateAsset,
  generatingAssetKey,
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
  const platformBlockId = getPlatformBlockIdForTrafficChannel(activeChannel)
  const growthBlockId = getGrowthBlockIdForTrafficChannel(activeChannel)
  const activeChannelTitle = t(`results.channels.${activeChannel}.title`)

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
                          <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                        ) : (
                          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                        )}
                      </button>

                      {isOpen ? (
                        <div className="space-y-1.5 border-t border-violet-100 p-2">
                          {group.channels.map((channelId) => {
                            const isActive = activeSection === 'channels' && activeChannel === channelId

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
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 rounded-xl border border-violet-100 bg-violet-50/30 p-3">
          {activeSection === 'channels' ? (
            <>
              {platformBlockId ? (
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
    return <BarChart3 className="h-4 w-4" />
  }

  if (
    channelId === 'website_seo' ||
    channelId === 'keyword_research' ||
    channelId === 'blog_cadence' ||
    channelId === 'geo_llm_visibility' ||
    channelId === 'comparison_alternatives'
  ) {
    return <Search className="h-4 w-4" />
  }

  if (
    channelId === 'email_scrape_contacts' ||
    channelId === 'email_import_list' ||
    channelId === 'email_automation' ||
    channelId === 'newsletter_partnerships'
  ) {
    return <Mail className="h-4 w-4" />
  }

  if (
    channelId === 'backlink_building' ||
    channelId === 'guest_posts' ||
    channelId === 'partner_pages' ||
    channelId === 'directory_outreach'
  ) {
    return <Link2 className="h-4 w-4" />
  }

  if (channelId === 'media_kit' || channelId === 'pr_pitch' || channelId === 'podcast_pitch') {
    return <FileSpreadsheet className="h-4 w-4" />
  }

  return <Layers3 className="h-4 w-4" />
}

function AssetKindIcon({ assetKind }: { assetKind: LaunchAssetKind }) {
  if (assetKind === 'screenshots') {
    return <Monitor className="h-4 w-4" />
  }

  if (assetKind === 'image_ads') {
    return <ImageIcon className="h-4 w-4" />
  }

  if (assetKind === 'video_ads') {
    return <Video className="h-4 w-4" />
  }

  return <MessageSquareText className="h-4 w-4" />
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
                  <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                  {isGeneratingAsset ? t('results.assets.actions.generating') : t('results.assets.actions.generate')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void copyValue(`${assetKey}:prompt`, generatedAsset?.prompt || '')}
                  disabled={!generatedAsset?.prompt}
                  className="border-violet-200 text-violet-700 hover:bg-violet-50"
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
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
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
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
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
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
      <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
        {asset.error || t('results.assets.labels.failed')}
      </div>
    )
  }

  if (asset.mediaType === 'image' && asset.outputUrl) {
    return (
      <div className="mt-4 overflow-hidden rounded-xl border border-violet-100 bg-zinc-950">
        <img src={asset.outputUrl} alt={asset.title} className="h-auto w-full object-cover" />
      </div>
    )
  }

  if (asset.mediaType === 'video' && asset.outputUrl) {
    return (
      <div className="mt-4 overflow-hidden rounded-xl border border-violet-100 bg-zinc-950">
        <video src={asset.outputUrl} controls className="h-auto w-full" />
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
    <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/40 px-3 py-3 text-sm text-violet-700">
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
          <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
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
            <BookOpenText className="mr-1.5 h-3.5 w-3.5" />
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
          <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
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
            <Search className="mr-1.5 h-3.5 w-3.5" />
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
            <Mail className="mr-1.5 h-3.5 w-3.5" />
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
        onChange={(event) => onChange(event.target.value)}
        placeholder={t('results.email.importPlaceholder')}
        rows={9}
        className="mt-3 w-full rounded-xl border border-violet-200 bg-violet-50/30 px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/40"
      />
      <div className="mt-3 flex justify-end">
        <Button
          type="button"
          onClick={onImport}
          disabled={isEmailActionRunning}
          className="rounded-xl bg-violet-600 text-white shadow-md shadow-violet-500/25 hover:bg-violet-700"
        >
          <ListPlus className="mr-2 h-4 w-4" />
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
              <Wand2 className="mr-1.5 h-3.5 w-3.5" />
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
              <Send className="mr-1.5 h-3.5 w-3.5" />
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
                  checked={selectedLeadIds.includes(lead.id)}
                  onChange={() => onToggleLead(lead.id)}
                  className="mt-1 h-4 w-4 rounded border-violet-300 text-violet-600"
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
            <Link2 className="mr-1.5 h-3.5 w-3.5" />
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
            <Mail className="mr-1.5 h-3.5 w-3.5" />
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
            <Send className="mr-1.5 h-3.5 w-3.5" />
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
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
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
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={t('growth.seo.backlinks.filters.searchPlaceholder')}
                className="w-full rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-sm text-zinc-700 outline-none focus:border-violet-400"
              />
            </FilterField>
            <FilterField label={t('growth.seo.backlinks.filters.list')}>
              <select
                value={listFilter}
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
                onChange={(event) => onMaxCostChange(event.target.value)}
                inputMode="numeric"
                className="w-full rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-sm text-zinc-700 outline-none focus:border-violet-400"
              />
            </FilterField>
            <FilterField label={t('growth.seo.backlinks.filters.minTraffic')}>
              <input
                value={minTraffic}
                onChange={(event) => onMinTrafficChange(event.target.value)}
                inputMode="numeric"
                className="w-full rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-sm text-zinc-700 outline-none focus:border-violet-400"
              />
            </FilterField>
            <FilterField label={t('growth.seo.backlinks.filters.minValue')}>
              <input
                value={minValue}
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
              <ListPlus className="mr-1.5 h-3.5 w-3.5" />
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
                      checked={selectedProspectIds.includes(prospect.id)}
                      onChange={() => onToggleProspect(prospect.id)}
                      className="mt-1 h-4 w-4 rounded border-violet-300 text-violet-600"
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
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
            {labels.exportMarkdown}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenPressPack}
            className="border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
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
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
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
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            {labels.copy}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onRegenerate}
            disabled={isGenerating}
            className="border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            <Wand2 className="mr-1.5 h-3.5 w-3.5" />
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
              <ExternalLink className="h-3 w-3" />
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
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            {labels.copy}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onRegenerate}
            disabled={isGenerating}
            className="border-violet-200 text-violet-700 hover:bg-violet-50"
          >
            <Wand2 className="mr-1.5 h-3.5 w-3.5" />
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

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label className="mt-2 block text-sm">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/40"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
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

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-xs">
      <span className="mb-1 flex items-center gap-1 font-semibold text-violet-700">
        <Filter className="h-3 w-3" />
        {label}
      </span>
      {children}
    </label>
  )
}

function splitLines(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function splitEditableLines(input: string): string[] {
  return input.split(/\r?\n/)
}

function getPlatformBlockIdForTrafficChannel(channelId: TrafficChannelId): PlatformBlockId | null {
  if (
    channelId === 'product_hunt' ||
    channelId === 'hacker_news' ||
    channelId === 'indie_hackers' ||
    channelId === 'linkedin' ||
    channelId === 'reddit' ||
    channelId === 'tiktok' ||
    channelId === 'youtube_shorts'
  ) {
    return channelId
  }

  return null
}

function getGrowthBlockIdForTrafficChannel(channelId: TrafficChannelId): GrowthBlockId | null {
  if (channelId === 'x') {
    return 'x_outreach'
  }

  return null
}

function isPlaybookChannel(channelId: TrafficChannelId) {
  return (
    channelId === 'launch_directories' ||
    channelId === 'trustmrr' ||
    channelId === 'acquire_com' ||
    channelId === 'flippa' ||
    channelId === 'threads' ||
    channelId === 'instagram' ||
    channelId === 'comparison_alternatives' ||
    channelId === 'guest_posts' ||
    channelId === 'partner_pages' ||
    channelId === 'directory_outreach' ||
    channelId === 'pr_pitch' ||
    channelId === 'podcast_pitch' ||
    channelId === 'newsletter_partnerships'
  )
}

function formatOutreachPackForCopy(
  pack: LaunchKit['growthAssets']['linkedinOutreach'],
  labels: {
    notes: string
    subject: string
    cta: string
  },
  includeSubject = false,
): string {
  if (!pack.variants.length) {
    return ''
  }

  return [
    pack.notes ? `${labels.notes}: ${pack.notes}` : '',
    ...pack.variants.map((variant) =>
      [
        variant.title,
        includeSubject && variant.subject ? `${labels.subject}: ${variant.subject}` : '',
        variant.message,
        `${labels.cta}: ${variant.cta}`,
      ]
        .filter(Boolean)
        .join('\n'),
    ),
  ]
    .filter(Boolean)
    .join('\n\n')
}

function formatSeoPostsForCopy(
  posts: LaunchKit['growthAssets']['seoPostPacks'],
  labels: {
    cluster: string
    meta: string
    outline: string
    cta: string
  },
): string {
  if (!posts.length) {
    return ''
  }

  return posts
    .map((post) =>
      [
        post.title,
        `${labels.cluster}: ${post.keywordTopic}`,
        `${labels.meta}: ${post.metaDescription}`,
        post.outline.length ? `${labels.outline}: ${post.outline.join(' | ')}` : '',
        post.draft,
        `${labels.cta}: ${post.cta}`,
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .join('\n\n---\n\n')
}

function formatRedditRecommendationsForCopy(
  recommendations: RedditRecommendations,
  labels: {
    engagement: string
    selfPromotion: string
    reason: string
    postingGuidance: string
  },
): string {
  const sections = [
    formatSubredditRecommendationSection(labels.engagement, recommendations.engagementSubreddits, labels),
    formatSubredditRecommendationSection(labels.selfPromotion, recommendations.selfPromotionSubreddits, labels),
  ].filter(Boolean)

  return sections.join('\n\n')
}

function formatSubredditRecommendationSection(
  title: string,
  recommendations: SubredditRecommendation[],
  labels: {
    reason: string
    postingGuidance: string
  },
): string {
  if (!recommendations.length) {
    return ''
  }

  return [
    title,
    ...recommendations.map((recommendation) =>
      [
        `${recommendation.name}: ${recommendation.url}`,
        `${labels.reason}: ${recommendation.reason}`,
        `${labels.postingGuidance}: ${recommendation.postingGuidance}`,
      ].join('\n'),
    ),
  ].join('\n\n')
}

function readGuestProjects(): LaunchProjectSnapshot[] {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(GUEST_PROJECTS_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as LaunchProjectSnapshot[]
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.map((snapshot) => normalizeSnapshot(snapshot))
  } catch {
    return []
  }
}

function writeGuestProjects(projects: LaunchProjectSnapshot[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(GUEST_PROJECTS_KEY, JSON.stringify(projects.slice(0, 40)))
}

function normalizeSnapshot(snapshot: LaunchProjectSnapshot): LaunchProjectSnapshot {
  const brief = normalizeBrief(snapshot.brief, {
    sourceUrl: snapshot.sourceUrl,
    language: snapshot.language,
    productName: snapshot.name,
  })
  const kit = normalizeKit(snapshot.kit, snapshot.language || brief.language)
  return {
    ...snapshot,
    brief,
    kit,
    language: snapshot.language || brief.language,
  }
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'launch-kit'
}

function parseNumberFilter(value: string): number | null {
  const parsed = Number(value.replace(/[$,\s]/g, ''))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function formatTraffic(value: number | null, unknownLabel: string): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return unknownLabel
  }

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M`
  }

  if (value >= 1000) {
    return `${Math.round(value / 1000)}K`
  }

  return value.toLocaleString()
}

function formatCost(value: number | null, unknownLabel: string): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return unknownLabel
  }

  return `$${value.toLocaleString()}`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1200)
}

type ExportLabels = {
  launchKitPrefix: string
  sourceUrl: string
  language: string
  brief: string
  product: string
  positioning: string
  icp: string
  targetUsers: string
  painPoints: string
  valueProps: string
  proofPoints: string
  primaryCta: string
  keywordResearch: string
  intent: string
  priority: string
  keywords: string
  contentAngles: string
  platformBlocks: string
  title: string
  cta: string
  notes: string
  redditEngagementSubreddits: string
  redditSelfPromotionSubreddits: string
  redditReason: string
  redditPostingGuidance: string
  mediaKit: string
  founderCompanyBio: string
  productOneLiner: string
  boilerplate: string
  pressRelease: string
  keyVisualsChecklist: string
  screenshotsAndLogos: string
  contactDetails: string
  growthAssets: string
  linkedinOutreach: string
  xOutreach: string
  coldEmailOutreach: string
  noSubject: string
  seoPacks: string
  prospecting: string
  leads: string
  personalizedOutreach: string
  emailJobsStub: string
  seoGrowth: string
  websiteSeoAnalysis: string
  blogStrategy: string
  freeTools: string
  backlinkProspects: string
  valueScore: string
  status: string
  pressPackTitleSuffix: string
  pressPackSourceLabel: string
  platformLabels: Record<PlatformBlockId, string>
}

function getExportLabels(t: (key: string, values?: Record<string, string | number>) => string): ExportLabels {
  return {
    launchKitPrefix: t('export.markdown.launchKitPrefix'),
    sourceUrl: t('export.markdown.sourceUrl'),
    language: t('export.markdown.language'),
    brief: t('export.markdown.brief'),
    product: t('export.markdown.product'),
    positioning: t('export.markdown.positioning'),
    icp: t('export.markdown.icp'),
    targetUsers: t('export.markdown.targetUsers'),
    painPoints: t('export.markdown.painPoints'),
    valueProps: t('export.markdown.valueProps'),
    proofPoints: t('export.markdown.proofPoints'),
    primaryCta: t('export.markdown.primaryCta'),
    keywordResearch: t('export.markdown.keywordResearch'),
    intent: t('export.markdown.intent'),
    priority: t('export.markdown.priority'),
    keywords: t('export.markdown.keywords'),
    contentAngles: t('export.markdown.contentAngles'),
    platformBlocks: t('export.markdown.platformBlocks'),
    title: t('output.titleLabel'),
    cta: t('output.copyCtaPrefix'),
    notes: t('output.copyNotesPrefix'),
    redditEngagementSubreddits: t('output.reddit.engagementTitle'),
    redditSelfPromotionSubreddits: t('output.reddit.selfPromotionTitle'),
    redditReason: t('output.reddit.reasonLabel'),
    redditPostingGuidance: t('output.reddit.postingGuidanceLabel'),
    mediaKit: t('export.markdown.mediaKit'),
    founderCompanyBio: t('mediaKit.fields.bio'),
    productOneLiner: t('mediaKit.fields.oneLiner'),
    boilerplate: t('mediaKit.fields.boilerplate'),
    pressRelease: t('mediaKit.fields.pressRelease'),
    keyVisualsChecklist: t('mediaKit.fields.checklist'),
    screenshotsAndLogos: t('mediaKit.fields.screenshots'),
    contactDetails: t('mediaKit.fields.contact'),
    growthAssets: t('export.markdown.growthAssets'),
    linkedinOutreach: t('growth.outputLabels.linkedin_outreach'),
    xOutreach: t('growth.outputLabels.x_outreach'),
    coldEmailOutreach: t('growth.outputLabels.cold_email_outreach'),
    noSubject: t('export.markdown.noSubject'),
    seoPacks: t('growth.outputLabels.seo_posts'),
    prospecting: t('export.markdown.prospecting'),
    leads: t('export.markdown.leads'),
    personalizedOutreach: t('export.markdown.personalizedOutreach'),
    emailJobsStub: t('export.markdown.emailJobsStub'),
    seoGrowth: t('growth.seo.title'),
    websiteSeoAnalysis: t('growth.seo.analysis.title'),
    blogStrategy: t('growth.seo.blog.title'),
    freeTools: t('growth.seo.tools.title'),
    backlinkProspects: t('growth.seo.backlinks.title'),
    valueScore: t('growth.seo.backlinks.headers.value'),
    status: t('growth.seo.backlinks.headers.status'),
    pressPackTitleSuffix: t('export.pressPack.titleSuffix'),
    pressPackSourceLabel: t('export.pressPack.sourceLabel'),
    platformLabels: {
      product_hunt: t('platformLabels.product_hunt'),
      hacker_news: t('platformLabels.hacker_news'),
      reddit: t('platformLabels.reddit'),
      indie_hackers: t('platformLabels.indie_hackers'),
      linkedin: t('platformLabels.linkedin'),
      tiktok: t('platformLabels.tiktok'),
      youtube_shorts: t('platformLabels.youtube_shorts'),
      email_announcement: t('platformLabels.email_announcement'),
    },
  }
}

function buildMarkdown(project: LaunchProjectSnapshot, labels: ExportLabels): string {
  const lines: string[] = []
  lines.push(`# ${labels.launchKitPrefix}: ${project.name}`)
  lines.push('')
  lines.push(`- ${labels.sourceUrl}: ${project.sourceUrl}`)
  lines.push(`- ${labels.language}: ${project.language}`)
  lines.push('')

  lines.push(`## ${labels.brief}`)
  lines.push(`- ${labels.product}: ${project.brief.productName}`)
  lines.push(`- ${labels.positioning}: ${project.brief.positioning}`)
  lines.push(`- ${labels.icp}: ${project.brief.icp}`)
  lines.push('')

  lines.push(`### ${labels.targetUsers}`)
  for (const user of project.brief.targetUsers) {
    lines.push(`- ${user}`)
  }
  lines.push('')

  lines.push(`### ${labels.painPoints}`)
  for (const pain of project.brief.painPoints) {
    lines.push(`- ${pain}`)
  }
  lines.push('')

  lines.push(`### ${labels.valueProps}`)
  for (const value of project.brief.valueProps) {
    lines.push(`- ${value}`)
  }
  lines.push('')

  lines.push(`### ${labels.proofPoints}`)
  for (const proof of project.brief.proofPoints) {
    lines.push(`- ${proof}`)
  }
  lines.push('')

  lines.push(`### ${labels.primaryCta}`)
  lines.push(project.brief.cta)
  lines.push('')

  lines.push(`## ${labels.keywordResearch}`)
  lines.push(project.brief.keywordResearch.notes)
  lines.push('')
  for (const cluster of project.brief.keywordResearch.clusters) {
    lines.push(`### ${cluster.topic}`)
    lines.push(`- ${labels.intent}: ${cluster.intent}`)
    lines.push(`- ${labels.priority}: ${cluster.priority}`)
    lines.push(`- ${labels.keywords}:`)
    for (const keyword of cluster.keywords) {
      lines.push(`  - ${keyword}`)
    }
    lines.push(`- ${labels.contentAngles}:`)
    for (const angle of cluster.contentAngles) {
      lines.push(`  - ${angle}`)
    }
    lines.push('')
  }

  lines.push(`## ${labels.platformBlocks}`)
  lines.push('')
  for (const blockId of PLATFORM_IDS) {
    const block = project.kit.platformBlocks[blockId]
    lines.push(`### ${labels.platformLabels[blockId]}`)
    lines.push(`${labels.title}: ${block.title}`)
    lines.push('')
    lines.push(block.body)
    lines.push('')
    lines.push(`${labels.cta}: ${block.cta}`)
    lines.push(`${labels.notes}: ${block.notes}`)
    lines.push('')

    if (blockId === 'reddit' && block.redditRecommendations) {
      appendRedditRecommendationsMarkdown(lines, block.redditRecommendations, {
        engagement: labels.redditEngagementSubreddits,
        selfPromotion: labels.redditSelfPromotionSubreddits,
        reason: labels.redditReason,
        postingGuidance: labels.redditPostingGuidance,
      })
    }
  }

  lines.push(`## ${labels.mediaKit}`)
  lines.push(`${labels.founderCompanyBio}: ${project.kit.mediaKit.founderCompanyBio}`)
  lines.push('')
  lines.push(`${labels.productOneLiner}: ${project.kit.mediaKit.productOneLiner}`)
  lines.push('')
  lines.push(`${labels.boilerplate}: ${project.kit.mediaKit.boilerplate}`)
  lines.push('')
  lines.push(`${labels.pressRelease}: ${project.kit.mediaKit.pressRelease}`)
  lines.push('')
  lines.push(`${labels.keyVisualsChecklist}:`)
  for (const item of project.kit.mediaKit.keyVisualsChecklist) {
    lines.push(`- ${item}`)
  }
  lines.push('')
  lines.push(`${labels.screenshotsAndLogos}: ${project.kit.mediaKit.screenshotsAndLogos}`)
  lines.push('')
  lines.push(`${labels.contactDetails}: ${project.kit.mediaKit.contactDetails}`)
  lines.push('')

  lines.push(`## ${labels.growthAssets}`)
  lines.push('')
  lines.push(`### ${labels.linkedinOutreach}`)
  for (const variant of project.kit.growthAssets.linkedinOutreach.variants) {
    lines.push(`- ${variant.title}: ${variant.message}`)
  }
  lines.push('')

  lines.push(`### ${labels.xOutreach}`)
  for (const variant of project.kit.growthAssets.xOutreach.variants) {
    lines.push(`- ${variant.title}: ${variant.message}`)
  }
  lines.push('')

  lines.push(`### ${labels.coldEmailOutreach}`)
  for (const variant of project.kit.growthAssets.emailOutreach.variants) {
    lines.push(`- ${variant.title} (${variant.subject || labels.noSubject})`)
    lines.push(`  ${variant.message}`)
  }
  lines.push('')

  lines.push(`### ${labels.seoPacks}`)
  for (const post of project.kit.growthAssets.seoPostPacks) {
    lines.push(`- ${post.title} [${post.keywordTopic}]`)
  }
  lines.push('')

  lines.push(`## ${labels.prospecting}`)
  lines.push(`- ${labels.leads}: ${project.kit.prospecting.leads.length}`)
  lines.push(`- ${labels.personalizedOutreach}: ${project.kit.prospecting.personalizedOutreach.length}`)
  lines.push(`- ${labels.emailJobsStub}: ${project.kit.prospecting.emailJobs.length}`)
  lines.push('')

  lines.push(`## ${labels.seoGrowth}`)
  lines.push('')
  if (project.kit.seoGrowth.websiteAnalysis) {
    lines.push(`### ${labels.websiteSeoAnalysis}`)
    lines.push(`- ${labels.valueScore}: ${project.kit.seoGrowth.websiteAnalysis.score}/100`)
    lines.push(project.kit.seoGrowth.websiteAnalysis.summary)
    lines.push('')
  }

  lines.push(`### ${labels.blogStrategy}`)
  for (const post of project.kit.seoGrowth.blogStrategy) {
    lines.push(`- Day ${post.dayOffset + 1}: ${post.title} [${post.keywordTopic}]`)
  }
  lines.push('')

  lines.push(`### ${labels.freeTools}`)
  for (const tool of project.kit.seoGrowth.freeTools) {
    lines.push(`- ${tool.title}: ${tool.url}`)
  }
  lines.push('')

  lines.push(`### ${labels.backlinkProspects}`)
  for (const prospect of project.kit.seoGrowth.backlinkProspects) {
    lines.push(
      `- ${prospect.title} (${prospect.domain}) - ${labels.valueScore}: ${prospect.valueScore}, ${labels.status}: ${prospect.status}`,
    )
  }
  lines.push('')

  return lines.join('\n')
}

function appendRedditRecommendationsMarkdown(
  lines: string[],
  recommendations: RedditRecommendations,
  labels: {
    engagement: string
    selfPromotion: string
    reason: string
    postingGuidance: string
  },
) {
  appendSubredditRecommendationMarkdown(
    lines,
    labels.engagement,
    recommendations.engagementSubreddits,
    labels,
  )
  appendSubredditRecommendationMarkdown(
    lines,
    labels.selfPromotion,
    recommendations.selfPromotionSubreddits,
    labels,
  )
}

function appendSubredditRecommendationMarkdown(
  lines: string[],
  title: string,
  recommendations: SubredditRecommendation[],
  labels: {
    reason: string
    postingGuidance: string
  },
) {
  if (!recommendations.length) {
    return
  }

  lines.push(`#### ${title}`)
  for (const recommendation of recommendations) {
    lines.push(`- ${recommendation.name}: ${recommendation.url}`)
    lines.push(`  ${labels.reason}: ${recommendation.reason}`)
    lines.push(`  ${labels.postingGuidance}: ${recommendation.postingGuidance}`)
  }
  lines.push('')
}

function buildPressPackHtml(project: LaunchProjectSnapshot, labels: ExportLabels): string {
  const media = project.kit.mediaKit
  const checklist = media.keyVisualsChecklist.map((item) => `<li>${escapeHtml(item)}</li>`).join('')

  return `<!doctype html>
<html lang="${escapeHtml(project.language || 'en')}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(project.name)} ${escapeHtml(labels.pressPackTitleSuffix)}</title>
    <style>
      body { margin: 0; background: #f4f6fa; color: #18212f; font-family: Georgia, serif; }
      main { max-width: 820px; margin: 24px auto; background: #fff; border: 1px solid #d8e0ea; border-radius: 16px; padding: 32px; }
      h1 { margin: 0 0 8px; font-size: 34px; }
      h2 { margin-top: 24px; font-size: 20px; }
      p { margin: 8px 0; white-space: pre-wrap; line-height: 1.6; }
      ul { margin-top: 8px; }
      @media print { main { border: none; margin: 0; border-radius: 0; } }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(project.name)} ${escapeHtml(labels.pressPackTitleSuffix)}</h1>
      <p>${escapeHtml(labels.pressPackSourceLabel)}: ${escapeHtml(project.sourceUrl)}</p>
      <h2>${escapeHtml(labels.founderCompanyBio)}</h2>
      <p>${escapeHtml(media.founderCompanyBio)}</p>
      <h2>${escapeHtml(labels.productOneLiner)}</h2>
      <p>${escapeHtml(media.productOneLiner)}</p>
      <h2>${escapeHtml(labels.boilerplate)}</h2>
      <p>${escapeHtml(media.boilerplate)}</p>
      <h2>${escapeHtml(labels.pressRelease)}</h2>
      <p>${escapeHtml(media.pressRelease)}</p>
      <h2>${escapeHtml(labels.keyVisualsChecklist)}</h2>
      <ul>${checklist}</ul>
      <h2>${escapeHtml(labels.screenshotsAndLogos)}</h2>
      <p>${escapeHtml(media.screenshotsAndLogos)}</p>
      <h2>${escapeHtml(labels.contactDetails)}</h2>
      <p>${escapeHtml(media.contactDetails)}</p>
    </main>
  </body>
</html>`
}

function hasGeneratedResultsInKit(kit: LaunchKit): boolean {
  const hasPlatformOutput = PLATFORM_IDS.some((platformId) => {
    const block = kit.platformBlocks[platformId]
    return Boolean(block.title.trim() || block.body.trim() || block.cta.trim() || block.notes.trim())
  })
  const hasGrowthOutput =
    kit.growthAssets.linkedinOutreach.variants.length > 0 ||
    kit.growthAssets.xOutreach.variants.length > 0 ||
    kit.growthAssets.emailOutreach.variants.length > 0 ||
    kit.growthAssets.seoPostPacks.length > 0
  const hasSeoGrowthOutput = Boolean(
    kit.seoGrowth.websiteAnalysis ||
      kit.seoGrowth.blogStrategy.length > 0 ||
      kit.seoGrowth.freeTools.length > 0 ||
      kit.seoGrowth.backlinkProspects.length > 0 ||
      kit.seoGrowth.backlinkEmailJobs.length > 0,
  )
  const hasMediaKitOutput = Boolean(
    kit.mediaKit.founderCompanyBio.trim() ||
      kit.mediaKit.productOneLiner.trim() ||
      kit.mediaKit.boilerplate.trim() ||
      kit.mediaKit.pressRelease.trim() ||
      kit.mediaKit.keyVisualsChecklist.length > 0 ||
      kit.mediaKit.screenshotsAndLogos.trim() ||
      kit.mediaKit.contactDetails.trim(),
  )
  const hasAssetOutput = kit.assetLibrary.generatedAssets.length > 0

  return hasPlatformOutput || hasGrowthOutput || hasSeoGrowthOutput || hasMediaKitOutput || hasAssetOutput
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
