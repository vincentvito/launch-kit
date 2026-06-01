import prisma from '@/lib/prisma'

export async function createLaunchJob(input: {
  userId?: string
  subjectKey: string
  action: string
  payload: unknown
}) {
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
