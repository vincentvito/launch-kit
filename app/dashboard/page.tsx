'use client'

import Link from 'next/link'
import { type KeyboardEvent, useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { Playfair_Display, Space_Grotesk } from 'next/font/google'
import {
  BookOpenText,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Copy,
  FileSpreadsheet,
  Layers3,
  Lock,
  Mail,
  PanelRightClose,
  PanelRightOpen,
  PenSquare,
  Search,
  Send,
  Sparkles,
  Users2,
  Wand2,
} from 'lucide-react'
import { signOut, useSession } from '@/lib/auth-client'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { createDemoSnapshot } from '@/lib/launch-kit/demo'
import {
  PLATFORM_IDS,
  type ExtractedBrief,
  type GrowthBlockId,
  type KeywordCluster,
  type LaunchKit,
  type LaunchProjectSnapshot,
  type PlatformBlockId,
  type ProjectSummary,
} from '@/lib/launch-kit/types'
import { normalizeBrief, normalizeKit } from '@/lib/launch-kit/normalizers'

const GUEST_PROJECTS_KEY = 'launch-kit-guest-projects-v1'
const OUTREACH_BLOCK_IDS = ['linkedin_outreach', 'x_outreach', 'cold_email_outreach'] as const

type SavedProjectItem = ProjectSummary & {
  storage: 'server' | 'guest'
  snapshot?: LaunchProjectSnapshot
}

type GrowthActionId =
  | 'prospect'
  | 'build_email_list'
  | 'score_segment'
  | 'personalize_outreach'
  | 'followup_sequences'
  | 'send_outreach_email'
  | 'export_leads'

const OUTPUT_TAB_IDS = [...PLATFORM_IDS, ...OUTREACH_BLOCK_IDS] as const
type OutputTabId = (typeof OUTPUT_TAB_IDS)[number]
type DashboardStep = 1 | 2 | 3
type OnboardingCardIndex = 0 | 1 | 2
type StepStatus = 'locked' | 'active' | 'complete'
type PendingAction = {
  id: GrowthActionId
  title: string
  description: string
}
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

const ACTION_ORDER: GrowthActionId[] = [
  'prospect',
  'build_email_list',
  'score_segment',
  'personalize_outreach',
  'followup_sequences',
  'send_outreach_email',
  'export_leads',
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
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [isActionRunning, setIsActionRunning] = useState(false)
  const [activeOutputTab, setActiveOutputTab] = useState<OutputTabId>('product_hunt')
  const [activeStep, setActiveStep] = useState<DashboardStep>(1)
  const [activeOnboardingCard, setActiveOnboardingCard] = useState<OnboardingCardIndex>(0)
  const [isUtilityDrawerOpen, setIsUtilityDrawerOpen] = useState(false)
  const [showMediaKit, setShowMediaKit] = useState(false)
  const [showAdvancedGrowth, setShowAdvancedGrowth] = useState(false)

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

    const demoSnapshot = createDemoSnapshot()
    setSourceUrl(demoSnapshot.sourceUrl)
    setBrief(normalizeBrief(demoSnapshot.brief))
    setKit(normalizeKit(demoSnapshot.kit, demoSnapshot.brief.language))
    setProjectId(demoSnapshot.id)
    setProjectName(demoSnapshot.name)
    setActiveStep(3)
    setError('')
    setSuccess(t('messages.demoLoaded'))
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

  const canOpenStep2 = Boolean(brief)
  const canOpenStep3 = Boolean(kit)
  const generatedPlatformCount = kit
    ? PLATFORM_IDS.filter((platformId) => {
        const block = kit.platformBlocks[platformId]
        return Boolean(block.body.trim())
      }).length
    : 0
  const hasGeneratedResults = Boolean(kit && hasGeneratedResultsInKit(kit))

  const step1Status: StepStatus = brief ? 'complete' : 'active'
  const step2Status: StepStatus = !canOpenStep2 ? 'locked' : hasGeneratedResults && activeStep !== 2 ? 'complete' : 'active'
  const step3Status: StepStatus = !canOpenStep3 ? 'locked' : activeStep === 3 ? 'active' : 'complete'

  const getPlatformOutputLabel = (tabId: PlatformBlockId) => t(`platformLabels.${tabId}`)
  const getGrowthOutputLabel = (tabId: GrowthBlockId) => t(`growth.outputLabels.${tabId}`)
  const getOutputTabLabel = (tabId: OutputTabId) => (isPlatformTab(tabId) ? getPlatformOutputLabel(tabId) : getGrowthOutputLabel(tabId))
  const stepStatusLabels: Record<StepStatus, string> = {
    locked: t('stepStatus.locked'),
    active: t('stepStatus.active'),
    complete: t('stepStatus.complete'),
  }
  const tabListLabel = t('output.tabsAriaLabel')

  const onOutputTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
      return
    }

    event.preventDefault()
    const currentIndex = OUTPUT_TAB_IDS.indexOf(activeOutputTab)
    let nextIndex = currentIndex

    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % OUTPUT_TAB_IDS.length
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + OUTPUT_TAB_IDS.length) % OUTPUT_TAB_IDS.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = OUTPUT_TAB_IDS.length - 1
    }

    const nextTabId = OUTPUT_TAB_IDS[nextIndex]
    setActiveOutputTab(nextTabId)
    const nextButton = document.querySelector<HTMLButtonElement>(`[data-output-tab="${nextTabId}"]`)
    nextButton?.focus()
  }

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
    setActiveOnboardingCard(0)
    setActiveStep(hasGeneratedResultsInKit(nextKit) ? 3 : nextBrief.productName ? 2 : 1)
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
    await navigator.clipboard.writeText(
      `${block.title}\n\n${block.body}\n\n${t('output.copyCtaPrefix')}: ${block.cta}\n\n${t('output.copyNotesPrefix')}: ${block.notes}`,
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

  const actionDefinitions: Array<{
    id: GrowthActionId
    title: string
    description: string
  }> = ACTION_ORDER.map((id) => ({
    id,
    title: t(`growth.actions.${id}.title`),
    description: t(`growth.actions.${id}.description`),
  }))

  const openActionApproval = (actionId: GrowthActionId) => {
    const action = actionDefinitions.find((item) => item.id === actionId)
    if (!action) {
      return
    }

    setPendingAction({
      id: action.id,
      title: action.title,
      description: action.description,
    })
  }

  const applyKitPatch = (update: { prospecting?: LaunchKit['prospecting']; growthAssets?: LaunchKit['growthAssets'] }) => {
    setKit((current) => {
      if (!current) {
        return current
      }

      return normalizeKit(
        {
          ...current,
          prospecting: update.prospecting || current.prospecting,
          growthAssets: update.growthAssets || current.growthAssets,
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

  const runApprovedAction = async () => {
    if (!pendingAction || !brief || !kit) {
      return
    }

    setIsActionRunning(true)
    setError('')
    setSuccess('')

    try {
      if (pendingAction.id === 'prospect') {
        const response = await fetch('/api/launch-kit/actions/prospect', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            brief,
            prospecting: kit.prospecting,
          }),
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
        setSuccess(json.info || t('messages.actionCompleted'))
      } else if (pendingAction.id === 'build_email_list') {
        const response = await fetch('/api/launch-kit/actions/build-email-list', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ prospecting: kit.prospecting }),
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
        setSuccess(json.info || t('messages.actionCompleted'))
      } else if (pendingAction.id === 'score_segment') {
        const response = await fetch('/api/launch-kit/actions/score-segment', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ prospecting: kit.prospecting }),
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
        setSuccess(json.info || t('messages.actionCompleted'))
      } else if (pendingAction.id === 'personalize_outreach') {
        const response = await fetch('/api/launch-kit/actions/personalize-outreach', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            brief,
            launchKit: kit,
            selectedLeadIds,
          }),
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
        setSuccess(json.info || t('messages.actionCompleted'))
      } else if (pendingAction.id === 'followup_sequences') {
        const response = await fetch('/api/launch-kit/actions/followup-sequences', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            brief,
            launchKit: kit,
          }),
        })
        const json = (await response.json()) as {
          prospecting?: LaunchKit['prospecting']
          growthAssets?: LaunchKit['growthAssets']
          info?: string
          error?: string
        }
        if (!response.ok || !json.prospecting || !json.growthAssets) {
          throw new Error(json.error || t('errors.actionFailed'))
        }
        applyKitPatch({ prospecting: json.prospecting, growthAssets: json.growthAssets })
        setSuccess(json.info || t('messages.actionCompleted'))
      } else if (pendingAction.id === 'send_outreach_email') {
        const response = await fetch('/api/launch-kit/actions/send-outreach-email', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            launchKit: kit,
            selectedLeadIds,
          }),
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
        setSuccess(json.info || t('messages.actionCompleted'))
      } else if (pendingAction.id === 'export_leads') {
        const response = await fetch('/api/launch-kit/actions/export-leads', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            projectName: projectName || brief.productName,
            prospecting: kit.prospecting,
            download: true,
          }),
        })

        if (!response.ok) {
          const json = (await response.json()) as { error?: string }
          throw new Error(json.error || t('errors.actionFailed'))
        }

        const blob = await response.blob()
        downloadBlob(blob, `${slugify(projectName || brief.productName || 'launch-kit-leads')}.csv`)
        setSuccess(t('messages.leadsExported'))
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('errors.actionFailed'))
    } finally {
      setIsActionRunning(false)
      setPendingAction(null)
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

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
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

        <section className="mt-6 space-y-4">
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
                            onChange={(value) => setBriefField('targetUsers', splitLines(value))}
                            multiline
                          />
                        </>
                      ) : null}

                      {activeOnboardingCard === 2 ? (
                        <>
                          <Field
                            label={t('fields.painPoints')}
                            value={brief.painPoints.join('\n')}
                            onChange={(value) => setBriefField('painPoints', splitLines(value))}
                            multiline
                          />
                          <Field
                            label={t('fields.valueProps')}
                            value={brief.valueProps.join('\n')}
                            onChange={(value) => setBriefField('valueProps', splitLines(value))}
                            multiline
                          />
                          <Field
                            label={t('fields.proofPoints')}
                            value={brief.proofPoints.join('\n')}
                            onChange={(value) => setBriefField('proofPoints', splitLines(value))}
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
            className={`rounded-[1.6rem] border border-violet-100 bg-white p-5 shadow-sm ${
              activeStep === 3 ? '' : 'hidden'
            }`}
          >
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

            {activeStep === 3 ? (
              brief ? (
                <div className="mt-4 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
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
                    </div>
                  </div>

                  {kit ? (
                    <>
                      <div className="rounded-2xl border border-violet-100 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <h3 className={`${editorialSerif.className} text-xl leading-tight text-zinc-900`}>
                            {t('growth.outputs.title')}
                          </h3>
                          <p className="text-xs text-zinc-600">{t('growth.outputs.subtitle')}</p>
                        </div>

                        <div className="overflow-x-auto pb-2">
                          <div
                            role="tablist"
                            aria-label={tabListLabel}
                            onKeyDown={onOutputTabKeyDown}
                            className="flex min-w-max gap-2"
                          >
                            {OUTPUT_TAB_IDS.map((tabId) => (
                              <button
                                key={tabId}
                                type="button"
                                id={`output-tab-${tabId}`}
                                role="tab"
                                data-output-tab={tabId}
                                aria-selected={activeOutputTab === tabId}
                                aria-controls={`output-tabpanel-${tabId}`}
                                tabIndex={activeOutputTab === tabId ? 0 : -1}
                                onClick={() => setActiveOutputTab(tabId)}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                                  activeOutputTab === tabId
                                    ? 'border-violet-500 bg-violet-600 text-white'
                                    : 'border-violet-200 bg-violet-50/60 text-violet-700 hover:border-violet-300 hover:bg-violet-100'
                                }`}
                              >
                                {getOutputTabLabel(tabId)}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div
                          role="tabpanel"
                          id={`output-tabpanel-${activeOutputTab}`}
                          aria-labelledby={`output-tab-${activeOutputTab}`}
                          className="mt-3 rounded-xl border border-violet-100 bg-violet-50/30 p-3"
                        >
                          {isPlatformTab(activeOutputTab) ? (
                            <PlatformBlockPanel
                              displayLabel={getPlatformOutputLabel(activeOutputTab)}
                              block={kit.platformBlocks[activeOutputTab]}
                              onCopy={() => void copyBlock(activeOutputTab)}
                              onRegenerate={() => void onRegenerateBlock(activeOutputTab)}
                              isGenerating={isGenerating}
                              feedbackText={
                                isGenerating && generationFeedbackSteps.length > 0
                                  ? generationFeedbackSteps[generationFeedbackIndex]
                                  : ''
                              }
                              labels={{
                                copy: t('actions.copyBlock'),
                                regenerate: t('actions.regenerateBlock'),
                                title: t('output.titleLabel'),
                                body: t('output.bodyLabel'),
                                cta: t('output.ctaLabel'),
                                notes: t('output.notesLabel'),
                              }}
                            />
                          ) : (
                            <GrowthBlockPanel
                              displayLabel={getGrowthOutputLabel(activeOutputTab)}
                              blockId={activeOutputTab}
                              kit={kit}
                              onCopy={() => void copyGrowthBlock(activeOutputTab)}
                              onRegenerate={() => void onRegenerateGrowthBlock(activeOutputTab)}
                              isGenerating={isGenerating}
                              feedbackText={
                                isGenerating && generationFeedbackSteps.length > 0
                                  ? generationFeedbackSteps[generationFeedbackIndex]
                                  : ''
                              }
                              labels={{
                                copy: t('actions.copyBlock'),
                                regenerate: t('actions.regenerateBlock'),
                                emptyOutreach: t('growth.outputs.emptyOutreach'),
                                emptySeo: t('growth.outputs.emptySeo'),
                                subject: t('output.subjectLabel'),
                                cta: t('output.ctaLabel'),
                                outline: t('output.outlineLabel'),
                              }}
                            />
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-violet-100 bg-violet-50/30 p-4">
                        <button
                          type="button"
                          onClick={() => setShowMediaKit((value) => !value)}
                          className="flex w-full items-center justify-between gap-2 text-left"
                        >
                          <div>
                            <h3 className={`${editorialSerif.className} text-xl text-zinc-900`}>
                              {t('mediaKit.generatedTitle')}
                            </h3>
                            <p className="mt-1 text-xs text-zinc-600">
                              {showMediaKit ? t('mediaKit.hideGenerated') : t('mediaKit.showGenerated')}
                            </p>
                          </div>
                          {showMediaKit ? (
                            <ChevronUp className="h-4 w-4 text-violet-600" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-violet-600" />
                          )}
                        </button>

                        {showMediaKit ? (
                          <div className="mt-3">
                            <MediaField label={t('mediaKit.fields.bio')} value={kit.mediaKit.founderCompanyBio} />
                            <MediaField label={t('mediaKit.fields.oneLiner')} value={kit.mediaKit.productOneLiner} />
                            <MediaField label={t('mediaKit.fields.boilerplate')} value={kit.mediaKit.boilerplate} />
                            <MediaField label={t('mediaKit.fields.pressRelease')} value={kit.mediaKit.pressRelease} />
                            <MediaField
                              label={t('mediaKit.fields.checklist')}
                              value={kit.mediaKit.keyVisualsChecklist.map((item) => `- ${item}`).join('\n')}
                            />
                            <MediaField
                              label={t('mediaKit.fields.screenshots')}
                              value={kit.mediaKit.screenshotsAndLogos}
                            />
                            <MediaField label={t('mediaKit.fields.contact')} value={kit.mediaKit.contactDetails} />
                          </div>
                        ) : null}
                      </div>

                      <div className="rounded-2xl border border-violet-100 bg-white p-4">
                        <button
                          type="button"
                          onClick={() => setShowAdvancedGrowth((value) => !value)}
                          className="flex w-full items-center justify-between gap-2 text-left"
                        >
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                              {t('growth.advanced.title')}
                            </p>
                            <p className="mt-1 text-xs text-zinc-600">
                              {t('growth.advanced.description')}
                            </p>
                          </div>
                          {showAdvancedGrowth ? (
                            <ChevronUp className="h-4 w-4 text-violet-600" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-violet-600" />
                          )}
                        </button>

                        {showAdvancedGrowth ? (
                          <div className="mt-4 space-y-4">
                            <div className="rounded-2xl border border-violet-200 bg-[linear-gradient(135deg,#fff_0%,#faf5ff_55%,#fff_100%)] p-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                                    {t('growth.seo.title')}
                                  </p>
                                  <p className="mt-1 max-w-2xl text-xs text-zinc-600">
                                    {t('growth.seo.description')}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setIsUtilityDrawerOpen(true)}
                                  className="border-violet-200 bg-white text-violet-700 hover:bg-violet-50"
                                >
                                  {t('actions.openBrandGuidelines')}
                                </Button>
                              </div>

                              <div className="mt-3 grid gap-3 xl:grid-cols-[0.8fr_1.2fr]">
                                <div className="rounded-xl border border-violet-100 bg-white/80 p-3">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                                    {t('growth.seo.keywordTitle')}
                                  </p>
                                  {brief?.keywordResearch.notes ? (
                                    <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                                      {brief.keywordResearch.notes}
                                    </p>
                                  ) : null}
                                  {brief && brief.keywordResearch.clusters.length > 0 ? (
                                    <div className="mt-2 space-y-2">
                                      {brief.keywordResearch.clusters.slice(0, 4).map((cluster) => (
                                        <div key={cluster.id} className="rounded-lg border border-violet-100 bg-violet-50/50 p-2">
                                          <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="text-sm font-semibold text-zinc-900">{cluster.topic}</p>
                                            <span className="rounded-full border border-violet-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-violet-700">
                                              {cluster.priority}
                                            </span>
                                          </div>
                                          <p className="mt-1 line-clamp-2 text-xs text-zinc-600">
                                            {cluster.keywords.join(', ')}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="mt-2 rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-sm text-violet-700">
                                      {t('growth.seo.keywordEmpty')}
                                    </p>
                                  )}
                                </div>

                                <GrowthBlockPanel
                                  displayLabel={getGrowthOutputLabel('seo_posts')}
                                  blockId="seo_posts"
                                  kit={kit}
                                  onCopy={() => void copyGrowthBlock('seo_posts')}
                                  onRegenerate={() => void onRegenerateGrowthBlock('seo_posts')}
                                  isGenerating={isGenerating}
                                  feedbackText={
                                    isGenerating && generationFeedbackSteps.length > 0
                                      ? generationFeedbackSteps[generationFeedbackIndex]
                                      : ''
                                  }
                                  labels={{
                                    copy: t('actions.copyBlock'),
                                    regenerate: t('actions.regenerateBlock'),
                                    emptyOutreach: t('growth.outputs.emptyOutreach'),
                                    emptySeo: t('growth.outputs.emptySeo'),
                                    subject: t('output.subjectLabel'),
                                    cta: t('output.ctaLabel'),
                                    outline: t('output.outlineLabel'),
                                  }}
                                />
                              </div>
                            </div>

                            <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                                    {t('growth.actionBar.title')}
                                  </p>
                                  <p className="text-xs text-zinc-600">{t('growth.actionBar.description')}</p>
                                </div>
                                <p className="text-xs text-zinc-500">
                                  {t('growth.actionBar.leadsCount', { count: kit.prospecting.leads.length })}
                                </p>
                              </div>

                              <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                {actionDefinitions.map((action) => (
                                  <button
                                    key={action.id}
                                    type="button"
                                    onClick={() => openActionApproval(action.id)}
                                    className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-left transition hover:border-violet-300 hover:bg-violet-50"
                                  >
                                    <div className="flex items-start gap-2">
                                      <ActionIcon actionId={action.id} />
                                      <div>
                                        <p className="text-sm font-semibold text-zinc-900">{action.title}</p>
                                        <p className="mt-1 text-xs text-zinc-600">{action.description}</p>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="rounded-2xl border border-violet-100 bg-white p-4">
                              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <h3 className={`${editorialSerif.className} text-xl text-zinc-900`}>
                                  {t('growth.prospecting.title')}
                                </h3>
                                <p className="text-xs text-zinc-600">
                                  {t('growth.prospecting.selectedLeads', { count: selectedLeadIds.length })}
                                </p>
                              </div>

                              {kit.prospecting.leads.length > 0 ? (
                                <div className="overflow-x-auto rounded-xl border border-violet-100">
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
                                      {kit.prospecting.leads.slice(0, 24).map((lead) => (
                                        <tr key={lead.id} className="border-t border-violet-100">
                                          <td className="px-3 py-2 align-top">
                                            <input
                                              type="checkbox"
                                              checked={selectedLeadIds.includes(lead.id)}
                                              onChange={() => toggleLeadSelection(lead.id)}
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
                              ) : (
                                <p className="rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2 text-sm text-violet-700">
                                  {t('growth.prospecting.empty')}
                                </p>
                              )}

                              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                                <div className="rounded-xl border border-violet-100 bg-violet-50/35 p-3">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                                    {t('growth.prospecting.personalizedTitle')}
                                  </p>
                                  {kit.prospecting.personalizedOutreach.length > 0 ? (
                                    <div className="mt-2 space-y-2">
                                      {kit.prospecting.personalizedOutreach.slice(0, 3).map((item) => (
                                        <div key={item.id} className="rounded-lg border border-violet-100 bg-white p-2">
                                          <p className="text-xs font-semibold text-zinc-900">
                                            {item.leadName} · {item.company}
                                          </p>
                                          <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-zinc-700">
                                            {item.linkedinMessage}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="mt-2 text-xs text-zinc-600">{t('growth.prospecting.personalizedEmpty')}</p>
                                  )}
                                </div>

                                <div className="rounded-xl border border-violet-100 bg-violet-50/35 p-3">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                                    {t('growth.prospecting.actionLogTitle')}
                                  </p>
                                  {kit.prospecting.actionRuns.length > 0 ? (
                                    <div className="mt-2 space-y-2">
                                      {kit.prospecting.actionRuns.slice(0, 5).map((run) => (
                                        <div key={run.id} className="rounded-lg border border-violet-100 bg-white p-2">
                                          <p className="text-xs font-semibold text-zinc-900">
                                            {t(`growth.actionStatus.${run.status}`)}
                                          </p>
                                          <p className="text-xs text-zinc-700">{run.summary}</p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="mt-2 text-xs text-zinc-600">{t('growth.prospecting.actionLogEmpty')}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
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
                          onChange={(value) => setBriefField('targetUsers', splitLines(value))}
                          multiline
                        />
                        <Field
                          label={t('fields.painPoints')}
                          value={brief.painPoints.join('\n')}
                          onChange={(value) => setBriefField('painPoints', splitLines(value))}
                          multiline
                        />
                        <Field
                          label={t('fields.valueProps')}
                          value={brief.valueProps.join('\n')}
                          onChange={(value) => setBriefField('valueProps', splitLines(value))}
                          multiline
                        />
                        <Field
                          label={t('fields.keyClaims')}
                          value={brief.keyClaims.join('\n')}
                          onChange={(value) => setBriefField('keyClaims', splitLines(value))}
                          multiline
                        />
                        <Field
                          label={t('fields.proofPoints')}
                          value={brief.proofPoints.join('\n')}
                          onChange={(value) => setBriefField('proofPoints', splitLines(value))}
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
                                  setKeywordClusterField(cluster.id, 'keywords', splitLines(value))
                                }
                                multiline
                              />
                              <Field
                                label={t('growth.keywordResearch.contentAngles')}
                                value={cluster.contentAngles.join('\n')}
                                onChange={(value) =>
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

      {pendingAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/35 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-violet-200 bg-white p-5 shadow-2xl shadow-violet-400/20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
              {t('growth.approvals.title')}
            </p>
            <h3 className={`${editorialSerif.className} mt-1 text-2xl leading-tight text-zinc-900`}>
              {pendingAction.title}
            </h3>
            <p className="mt-2 text-sm text-zinc-600">{pendingAction.description}</p>

            <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/50 p-3 text-sm text-zinc-700">
              {t('growth.approvals.confirmation')}
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setPendingAction(null)}
                className="border-violet-200 text-violet-700 hover:bg-violet-50"
              >
                {t('growth.approvals.cancel')}
              </Button>
              <Button
                onClick={() => void runApprovedAction()}
                disabled={isActionRunning}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-md shadow-violet-500/30 hover:from-violet-700 hover:to-fuchsia-600"
              >
                {isActionRunning ? t('growth.approvals.running') : t('growth.approvals.approveRun')}
              </Button>
            </div>
          </div>
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
  multiline?: boolean
}

function Field({ label, value, onChange, multiline = false }: FieldProps) {
  return (
    <label className="mt-2 block text-sm">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/40"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
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
  }
}) {
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
    </div>
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

function ActionIcon({ actionId }: { actionId: GrowthActionId }) {
  if (actionId === 'prospect') {
    return <Search className="mt-0.5 h-4 w-4 text-violet-600" />
  }
  if (actionId === 'build_email_list') {
    return <Mail className="mt-0.5 h-4 w-4 text-violet-600" />
  }
  if (actionId === 'score_segment') {
    return <Layers3 className="mt-0.5 h-4 w-4 text-violet-600" />
  }
  if (actionId === 'personalize_outreach') {
    return <Users2 className="mt-0.5 h-4 w-4 text-violet-600" />
  }
  if (actionId === 'followup_sequences') {
    return <CheckCircle2 className="mt-0.5 h-4 w-4 text-violet-600" />
  }
  if (actionId === 'send_outreach_email') {
    return <Send className="mt-0.5 h-4 w-4 text-violet-600" />
  }
  return <FileSpreadsheet className="mt-0.5 h-4 w-4 text-violet-600" />
}

function splitLines(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function isPlatformTab(tabId: OutputTabId): tabId is PlatformBlockId {
  return PLATFORM_IDS.includes(tabId as PlatformBlockId)
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

  return lines.join('\n')
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
  const hasMediaKitOutput = Boolean(
    kit.mediaKit.founderCompanyBio.trim() ||
      kit.mediaKit.productOneLiner.trim() ||
      kit.mediaKit.boilerplate.trim() ||
      kit.mediaKit.pressRelease.trim() ||
      kit.mediaKit.keyVisualsChecklist.length > 0 ||
      kit.mediaKit.screenshotsAndLogos.trim() ||
      kit.mediaKit.contactDetails.trim(),
  )

  return hasPlatformOutput || hasGrowthOutput || hasMediaKitOutput
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
