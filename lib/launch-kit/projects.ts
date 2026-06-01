import prisma from '@/lib/prisma'
import type {
  LaunchKit,
  LaunchProjectSnapshot,
  MediaKitContact,
  ProjectSummary,
} from '@/lib/launch-kit/types'
import { normalizeBrief, normalizeKit } from '@/lib/launch-kit/normalizers'
import { safeJsonParse, withDefaultContact } from '@/lib/launch-kit/utils'

type SaveProjectInput = {
  projectId?: string
  userId: string
  sourceUrl: string
  name: string
  language: string
  brief: LaunchProjectSnapshot['brief']
  kit: LaunchKit
}

export class LaunchProjectNotFoundError extends Error {
  constructor() {
    super('Launch project not found.')
    this.name = 'LaunchProjectNotFoundError'
  }
}

export class InvalidLaunchProjectInputError extends Error {
  constructor(message = 'Invalid project input.') {
    super(message)
    this.name = 'InvalidLaunchProjectInputError'
  }
}

export async function saveLaunchProject(input: SaveProjectInput): Promise<LaunchProjectSnapshot> {
  const sourceUrl = normalizeRequiredHttpUrl(input.sourceUrl)
  const name = cleanStoredText(input.name, 140) || 'Untitled project'
  const language = normalizeLanguage(input.language)
  const brief = normalizeBrief(input.brief, {
    sourceUrl,
    language,
    productName: name,
  })
  brief.sourceUrl = sourceUrl
  brief.language = language
  brief.productName = cleanStoredText(brief.productName, 160) || name
  const kit = normalizeKit(input.kit, language)
  const briefJson = JSON.stringify(brief)
  const kitJson = JSON.stringify(kit)

  if (input.projectId) {
    const updated = await prisma.launchProject.updateMany({
      where: {
        id: input.projectId,
        userId: input.userId,
      },
      data: {
        name,
        sourceUrl,
        language,
        briefJson,
        kitJson,
      },
    })

    if (updated.count === 0) {
      throw new LaunchProjectNotFoundError()
    }

    const project = await prisma.launchProject.findFirst({
      where: {
        id: input.projectId,
        userId: input.userId,
      },
    })

    if (!project) {
      throw new LaunchProjectNotFoundError()
    }

    return toSnapshot(project)
  }

  const project = await prisma.launchProject.create({
    data: {
      userId: input.userId,
      name,
      sourceUrl,
      language,
      briefJson,
      kitJson,
    },
  })

  return toSnapshot(project)
}

export async function listLaunchProjects(userId: string): Promise<ProjectSummary[]> {
  const projects = await prisma.launchProject.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  })

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    sourceUrl: project.sourceUrl,
    language: project.language,
    updatedAt: project.updatedAt.toISOString(),
  }))
}

export async function getLaunchProject(userId: string, projectId: string): Promise<LaunchProjectSnapshot | null> {
  const project = await prisma.launchProject.findFirst({
    where: {
      id: projectId,
      userId,
    },
  })

  if (!project) {
    return null
  }

  return toSnapshot(project)
}

export async function getUserLaunchProfile(userId: string): Promise<MediaKitContact> {
  const profile = await prisma.userLaunchProfile.findUnique({
    where: { userId },
  })

  if (!profile) {
    return withDefaultContact()
  }

  return withDefaultContact({
    founderName: profile.founderName || '',
    founderBio: profile.founderBio || '',
    companyName: profile.companyName || '',
    companyBio: profile.companyBio || '',
    website: profile.website || '',
    email: profile.email || '',
    contactPhone: profile.contactPhone || '',
    socialX: profile.socialX || '',
    socialLinkedIn: profile.socialLinkedIn || '',
  })
}

export async function upsertUserLaunchProfile(userId: string, contact: Partial<MediaKitContact>): Promise<MediaKitContact> {
  const merged = sanitizeMediaKitContact(contact)

  const profile = await prisma.userLaunchProfile.upsert({
    where: { userId },
    create: {
      userId,
      founderName: merged.founderName || null,
      founderBio: merged.founderBio || null,
      companyName: merged.companyName || null,
      companyBio: merged.companyBio || null,
      website: merged.website || null,
      email: merged.email || null,
      contactPhone: merged.contactPhone || null,
      socialX: merged.socialX || null,
      socialLinkedIn: merged.socialLinkedIn || null,
    },
    update: {
      founderName: merged.founderName || null,
      founderBio: merged.founderBio || null,
      companyName: merged.companyName || null,
      companyBio: merged.companyBio || null,
      website: merged.website || null,
      email: merged.email || null,
      contactPhone: merged.contactPhone || null,
      socialX: merged.socialX || null,
      socialLinkedIn: merged.socialLinkedIn || null,
    },
  })

  return withDefaultContact({
    founderName: profile.founderName || '',
    founderBio: profile.founderBio || '',
    companyName: profile.companyName || '',
    companyBio: profile.companyBio || '',
    website: profile.website || '',
    email: profile.email || '',
    contactPhone: profile.contactPhone || '',
    socialX: profile.socialX || '',
    socialLinkedIn: profile.socialLinkedIn || '',
  })
}

type LaunchProjectRecord = {
  id: string
  name: string
  sourceUrl: string
  language: string
  briefJson: string
  kitJson: string
  createdAt: Date
  updatedAt: Date
}

function toSnapshot(project: LaunchProjectRecord): LaunchProjectSnapshot {
  const parsedBrief = safeJsonParse<Partial<LaunchProjectSnapshot['brief']> | null>(
    project.briefJson,
    null,
  )
  const parsedKit = safeJsonParse<Partial<LaunchProjectSnapshot['kit']> | null>(
    project.kitJson,
    null,
  )

  const brief = normalizeBrief(parsedBrief, {
    sourceUrl: project.sourceUrl,
    language: project.language,
    productName: project.name,
  })
  const kit = normalizeKit(parsedKit, project.language)

  return {
    id: project.id,
    name: project.name,
    sourceUrl: project.sourceUrl,
    language: project.language,
    brief,
    kit,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }
}

function sanitizeMediaKitContact(contact: Partial<MediaKitContact>): MediaKitContact {
  const merged = withDefaultContact(contact)

  return {
    founderName: cleanStoredText(merged.founderName, 120),
    founderBio: cleanStoredText(merged.founderBio, 1200),
    companyName: cleanStoredText(merged.companyName, 160),
    companyBio: cleanStoredText(merged.companyBio, 1200),
    website: normalizeOptionalHttpUrl(merged.website, 500),
    email: normalizeEmail(merged.email),
    contactPhone: cleanStoredText(merged.contactPhone, 80),
    socialX: cleanStoredText(merged.socialX, 240),
    socialLinkedIn: cleanStoredText(merged.socialLinkedIn, 240),
  }
}

function normalizeRequiredHttpUrl(value: string): string {
  const cleaned = cleanStoredText(value, 800)
  if (!cleaned) {
    throw new InvalidLaunchProjectInputError('A valid source URL is required.')
  }

  try {
    const url = new URL(cleaned)
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new InvalidLaunchProjectInputError('Source URL must use HTTP or HTTPS.')
    }
    return cleaned
  } catch (error) {
    if (error instanceof InvalidLaunchProjectInputError) {
      throw error
    }
    throw new InvalidLaunchProjectInputError('A valid source URL is required.')
  }
}

function normalizeOptionalHttpUrl(value: string, maxLength: number): string {
  const cleaned = cleanStoredText(value, maxLength)
  if (!cleaned) {
    return ''
  }

  try {
    const url = new URL(cleaned)
    return ['http:', 'https:'].includes(url.protocol) ? cleaned : ''
  } catch {
    return ''
  }
}

function normalizeEmail(value: string): string {
  const cleaned = cleanStoredText(value, 254).toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned) ? cleaned : ''
}

function normalizeLanguage(value: string): string {
  const cleaned = cleanStoredText(value, 16).toLowerCase()
  return /^[a-z]{2}(?:[-_][a-z]{2})?$/.test(cleaned) ? cleaned : 'en'
}

function cleanStoredText(value: unknown, maxLength: number): string {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}
