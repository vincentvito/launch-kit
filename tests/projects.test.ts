import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import prisma from '@/lib/prisma'
import {
  InvalidLaunchProjectInputError,
  LaunchProjectNotFoundError,
  saveLaunchProject,
  upsertUserLaunchProfile,
} from '../lib/launch-kit/projects'
import { createEmptyKit } from '../lib/launch-kit/normalizers'

vi.mock('@/lib/prisma', () => ({
  default: {
    launchProject: {
      create: vi.fn(),
      updateMany: vi.fn(),
      findFirst: vi.fn(),
    },
    userLaunchProfile: {
      upsert: vi.fn(),
    },
  },
}))

const launchProject = prisma.launchProject as unknown as {
  create: Mock
  updateMany: Mock
  findFirst: Mock
}
const userLaunchProfile = prisma.userLaunchProfile as unknown as {
  upsert: Mock
}

const now = new Date('2026-01-01T00:00:00.000Z')

const savedRecord = {
  id: 'project_123',
  userId: 'user_123',
  name: 'LaunchKit',
  sourceUrl: 'https://launch.example',
  language: 'en',
  briefJson: JSON.stringify({
    sourceUrl: 'https://launch.example',
    productName: 'LaunchKit',
    language: 'en',
  }),
  kitJson: JSON.stringify({
    language: 'en',
  }),
  createdAt: now,
  updatedAt: now,
}

const saveInput = {
  userId: 'user_123',
  sourceUrl: 'https://launch.example',
  name: 'LaunchKit',
  language: 'en',
  brief: {
    sourceUrl: 'https://launch.example',
    productName: 'LaunchKit',
    positioning: '',
    targetUsers: [],
    icp: '',
    painPoints: [],
    valueProps: [],
    keyClaims: [],
    proofPoints: [],
    voiceGuide: '',
    cta: '',
    language: 'en',
    sourceHighlights: [],
    detectedImageUrls: [],
    crawlPages: ['https://launch.example'],
    keywordResearch: {
      generatedAt: '',
      notes: '',
      clusters: [],
    },
  },
  kit: createEmptyKit('en'),
}

describe('launch project persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a new project for the current user', async () => {
    launchProject.create.mockResolvedValue(savedRecord)

    const saved = await saveLaunchProject(saveInput)

    expect(launchProject.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user_123',
        name: 'LaunchKit',
        sourceUrl: 'https://launch.example',
      }),
    })
    expect(saved.id).toBe('project_123')
    expect(saved.brief.productName).toBe('LaunchKit')
  })

  it('normalizes project metadata before storage', async () => {
    launchProject.create.mockResolvedValue({
      ...savedRecord,
      name: 'Messy Project',
      language: 'en',
      briefJson: JSON.stringify({
        ...saveInput.brief,
        sourceUrl: 'https://launch.example/product',
        productName: 'Messy Project',
        language: 'en',
      }),
    })

    await saveLaunchProject({
      ...saveInput,
      sourceUrl: 'https://launch.example/product',
      name: '  Messy\u0000Project  ',
      language: 'javascript:alert(1)',
      brief: {
        ...saveInput.brief,
        sourceUrl: 'ftp://ignored.example',
        productName: '  Messy Project  ',
        language: 'ftp',
      },
    })

    const createCall = launchProject.create.mock.calls[0]?.[0]
    const savedBrief = JSON.parse(createCall.data.briefJson) as { sourceUrl: string; language: string }

    expect(createCall.data.name).toBe('Messy Project')
    expect(createCall.data.language).toBe('en')
    expect(savedBrief.sourceUrl).toBe('https://launch.example/product')
    expect(savedBrief.language).toBe('en')
  })

  it('rejects non-http project source URLs before storage', async () => {
    await expect(
      saveLaunchProject({
        ...saveInput,
        sourceUrl: 'ftp://launch.example',
      }),
    ).rejects.toBeInstanceOf(InvalidLaunchProjectInputError)

    expect(launchProject.create).not.toHaveBeenCalled()
  })

  it('updates an existing project only when it belongs to the current user', async () => {
    launchProject.updateMany.mockResolvedValue({ count: 1 })
    launchProject.findFirst.mockResolvedValue(savedRecord)

    const saved = await saveLaunchProject({
      ...saveInput,
      projectId: 'project_123',
    })

    expect(launchProject.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'project_123',
        userId: 'user_123',
      },
      data: expect.objectContaining({
        name: 'LaunchKit',
        sourceUrl: 'https://launch.example',
      }),
    })
    expect(saved.id).toBe('project_123')
  })

  it('throws a safe not-found error for stale or cross-user project ids', async () => {
    launchProject.updateMany.mockResolvedValue({ count: 0 })

    await expect(
      saveLaunchProject({
        ...saveInput,
        projectId: 'project_123',
      }),
    ).rejects.toBeInstanceOf(LaunchProjectNotFoundError)

    expect(launchProject.findFirst).not.toHaveBeenCalled()
  })

  it('sanitizes saved launch profile fields', async () => {
    userLaunchProfile.upsert.mockResolvedValue({
      founderName: 'Ada Lovelace',
      founderBio: 'Builds tools',
      companyName: 'LaunchKit',
      companyBio: '',
      website: '',
      email: '',
      contactPhone: '+1 555',
      socialX: '@launchkit',
      socialLinkedIn: 'https://linkedin.com/company/launchkit',
    })

    await upsertUserLaunchProfile('user_123', {
      founderName: '  Ada\u0000Lovelace  ',
      founderBio: 'Builds\n tools',
      companyName: 'LaunchKit',
      website: 'javascript:alert(1)',
      email: 'not an email',
      contactPhone: '+1 555',
      socialX: '@launchkit',
      socialLinkedIn: 'https://linkedin.com/company/launchkit',
    })

    expect(userLaunchProfile.upsert).toHaveBeenCalledWith({
      where: { userId: 'user_123' },
      create: expect.objectContaining({
        founderName: 'Ada Lovelace',
        founderBio: 'Builds tools',
        website: null,
        email: null,
      }),
      update: expect.objectContaining({
        founderName: 'Ada Lovelace',
        founderBio: 'Builds tools',
        website: null,
        email: null,
      }),
    })
  })
})
