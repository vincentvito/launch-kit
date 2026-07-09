import { isProductionRuntime } from '@/lib/env'
import { isPostgresDatabaseUrl } from '@/lib/database-provider'

function hasRuntimePostgresDatabase(): boolean {
  return [process.env.DATABASE_URL, process.env.DIRECT_URL].some((value) =>
    value ? isPostgresDatabaseUrl(value) : false,
  )
}

async function getPrisma() {
  if (!hasRuntimePostgresDatabase()) {
    if (isProductionRuntime()) {
      throw new Error('DATABASE_URL is required and must be a postgres:// or postgresql:// URL.')
    }

    return null
  }

  return (await import('@/lib/prisma')).default
}

export async function createLaunchJob(input: {
  userId?: string
  subjectKey: string
  action: string
  payload: unknown
}) {
  const prisma = await getPrisma()
  if (!prisma) {
    return {
      id: `stateless-${Date.now()}`,
    }
  }

  return prisma.launchJob.create({
    data: {
      userId: input.userId,
      subjectKey: input.subjectKey,
      action: input.action,
      inputJson: JSON.stringify(input.payload).slice(0, 100000),
      status: 'queued',
    },
  })
}

export async function completeLaunchJob(input: {
  jobId: string
  result?: unknown
  error?: unknown
}) {
  const prisma = await getPrisma()
  if (!prisma || input.jobId.startsWith('stateless-')) {
    return null
  }

  return prisma.launchJob.update({
    where: { id: input.jobId },
    data: {
      status: input.error ? 'failed' : 'completed',
      resultJson: input.result ? JSON.stringify(input.result).slice(0, 100000) : null,
      error: input.error instanceof Error ? input.error.message : input.error ? String(input.error) : null,
      completedAt: new Date(),
    },
  })
}
