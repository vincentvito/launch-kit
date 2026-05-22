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

export async function saveLaunchProject(input: SaveProjectInput): Promise<LaunchProjectSnapshot> {
  const briefJson = JSON.stringify(input.brief)
  const kitJson = JSON.stringify(input.kit)

  const project = input.projectId
    ? await prisma.launchProject.update({
        where: {
          id: input.projectId,
          userId: input.userId,
        },
        data: {
          name: input.name,
          sourceUrl: input.sourceUrl,
          language: input.language,
          briefJson,
          kitJson,
        },
      })
    : await prisma.launchProject.create({
        data: {
          userId: input.userId,
          name: input.name,
          sourceUrl: input.sourceUrl,
          language: input.language,
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
  const merged = withDefaultContact(contact)

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
