import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import prisma from '@/lib/prisma'
import {
  InvalidLaunchProjectInputError,
  LaunchProjectNotFoundError,
  deleteLaunchProject,
  MAX_SAVED_PROJECTS_PER_USER,
  MAX_STORED_PROJECT_JSON_BYTES,
  saveLaunchProject,
  upsertUserLaunchProfile,
} from '../lib/launch-kit/projects'
import { createEmptyKit } from '../lib/launch-kit/normalizers'

vi.mock('@/lib/prisma', () => ({
  default: {
    launchProject: {
      count: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
      findFirst: vi.fn(),
    },
    userLaunchProfile: {
      upsert: vi.fn(),
    },
  },
}))

const launchProject = prisma.launchProject as unknown as {
  count: Mock
  create: Mock
  deleteMany: Mock
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
    launchProject.count.mockResolvedValue(0)
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

  it('rejects private or internal project source URLs before storage', async () => {
    await expect(
      saveLaunchProject({
        ...saveInput,
        sourceUrl: 'http://localhost:3000/private',
      }),
    ).rejects.toBeInstanceOf(InvalidLaunchProjectInputError)

    await expect(
      saveLaunchProject({
        ...saveInput,
        sourceUrl: 'https://intranet/internal',
      }),
    ).rejects.toBeInstanceOf(InvalidLaunchProjectInputError)

    expect(launchProject.create).not.toHaveBeenCalled()
  })

  it('rejects oversized project JSON before storage', async () => {
    await expect(
      saveLaunchProject({
        ...saveInput,
        kit: {
          ...saveInput.kit,
          platformBlocks: {
            ...saveInput.kit.platformBlocks,
            product_hunt: {
              ...saveInput.kit.platformBlocks.product_hunt,
              body: 'x'.repeat(MAX_STORED_PROJECT_JSON_BYTES),
            },
          },
        },
      }),
    ).rejects.toMatchObject({
      name: 'InvalidLaunchProjectInputError',
      message: 'Saved project is too large. Shorten generated content or remove oversized assets.',
    })

    expect(launchProject.create).not.toHaveBeenCalled()
  })

  it('keeps stored project JSON below the configured byte budget', async () => {
    launchProject.create.mockResolvedValue(savedRecord)

    await saveLaunchProject(saveInput)

    const createCall = launchProject.create.mock.calls[0]?.[0]
    const storedBytes =
      new TextEncoder().encode(createCall.data.briefJson).byteLength +
      new TextEncoder().encode(createCall.data.kitJson).byteLength

    expect(storedBytes).toBeLessThanOrEqual(MAX_STORED_PROJECT_JSON_BYTES)
  })

  it('rejects new projects when the user has reached the saved-project cap', async () => {
    launchProject.count.mockResolvedValue(MAX_SAVED_PROJECTS_PER_USER)

    await expect(saveLaunchProject(saveInput)).rejects.toMatchObject({
      name: 'InvalidLaunchProjectInputError',
      message: `You can save up to ${MAX_SAVED_PROJECTS_PER_USER} projects. Delete an old project before saving another.`,
    })

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
    expect(launchProject.count).not.toHaveBeenCalled()
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

  it('deletes a project only when it belongs to the current user', async () => {
    launchProject.deleteMany.mockResolvedValue({ count: 1 })

    await deleteLaunchProject('user_123', 'project_123')

    expect(launchProject.deleteMany).toHaveBeenCalledWith({
      where: {
        id: 'project_123',
        userId: 'user_123',
      },
    })
  })

  it('throws a safe not-found error for cross-user deletes', async () => {
    launchProject.deleteMany.mockResolvedValue({ count: 0 })

    await expect(deleteLaunchProject('user_123', 'project_123')).rejects.toBeInstanceOf(
      LaunchProjectNotFoundError,
    )
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
        socialX: '@launchkit',
        socialLinkedIn: 'https://linkedin.com/company/launchkit',
      }),
      update: expect.objectContaining({
        founderName: 'Ada Lovelace',
        founderBio: 'Builds tools',
        website: null,
        email: null,
        socialX: '@launchkit',
        socialLinkedIn: 'https://linkedin.com/company/launchkit',
      }),
    })
  })

  it('drops unsafe profile social URL schemes before storage', async () => {
    userLaunchProfile.upsert.mockResolvedValue({
      founderName: '',
      founderBio: '',
      companyName: '',
      companyBio: '',
      website: '',
      email: '',
      contactPhone: '',
      socialX: '',
      socialLinkedIn: '',
    })

    await upsertUserLaunchProfile('user_123', {
      socialX: 'javascript:alert(1)',
      socialLinkedIn: 'data:text/html,<script>alert(1)</script>',
    })

    expect(userLaunchProfile.upsert).toHaveBeenCalledWith({
      where: { userId: 'user_123' },
      create: expect.objectContaining({
        socialX: null,
        socialLinkedIn: null,
      }),
      update: expect.objectContaining({
        socialX: null,
        socialLinkedIn: null,
      }),
    })
  })
})
