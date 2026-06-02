import prisma from '@/lib/prisma'

export async function recordUsageEvent(input: {
  userId?: string
  subjectKey: string
  action: string
  amount?: number
  metadata?: Record<string, unknown>
}): Promise<void> {
  await prisma.usageEvent.create({
    data: {
      userId: input.userId,
      subjectKey: input.subjectKey,
      action: input.action,
      amount: input.amount || 1,
      metadataJson: input.metadata ? JSON.stringify(input.metadata).slice(0, 8000) : null,
    },
  })
}
