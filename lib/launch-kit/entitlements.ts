import prisma from '@/lib/prisma'
import { getAdminEmails } from '@/lib/env'

export type LaunchPlan = 'free' | 'premium' | 'admin'

export type LaunchEntitlement = {
  plan: LaunchPlan
  status: string
  hasPremium: boolean
}

type SessionUser = {
  id: string
  email?: string | null
}

const ACTIVE_STATUSES = new Set(['active', 'trialing', 'manual'])
const PREMIUM_PLANS = new Set(['premium', 'pro', 'team'])

export async function getLaunchEntitlement(user?: SessionUser | null): Promise<LaunchEntitlement> {
  if (!user) {
    return {
      plan: 'free',
      status: 'anonymous',
      hasPremium: false,
    }
  }

  const email = user.email?.toLowerCase() || ''
  if (email && getAdminEmails().includes(email)) {
    return {
      plan: 'admin',
      status: 'active',
      hasPremium: true,
    }
  }

  const plan = await prisma.userPlan.findUnique({
    where: { userId: user.id },
  })

  if (!plan) {
    return {
      plan: 'free',
      status: 'active',
      hasPremium: false,
    }
  }

  const normalizedPlan = normalizeLaunchPlan(plan.plan)
  const currentPeriodActive = !plan.currentPeriodEnd || plan.currentPeriodEnd.getTime() > Date.now()
  const isActive = ACTIVE_STATUSES.has(plan.status) && currentPeriodActive

  return {
    plan: normalizedPlan,
    status: plan.status,
    hasPremium: normalizedPlan !== 'free' && isActive,
  }
}

export async function setManualLaunchPlan(input: {
  userId: string
  plan: LaunchPlan
  status?: string
}): Promise<LaunchEntitlement> {
  const saved = await prisma.userPlan.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      plan: input.plan,
      status: input.status || 'manual',
      provider: 'manual',
    },
    update: {
      plan: input.plan,
      status: input.status || 'manual',
      provider: 'manual',
    },
  })

  const normalizedPlan = normalizeLaunchPlan(saved.plan)

  return {
    plan: normalizedPlan,
    status: saved.status,
    hasPremium: normalizedPlan !== 'free' && ACTIVE_STATUSES.has(saved.status),
  }
}

function normalizeLaunchPlan(plan: string): LaunchPlan {
  if (plan === 'admin') {
    return 'admin'
  }

  return PREMIUM_PLANS.has(plan) ? 'premium' : 'free'
}
