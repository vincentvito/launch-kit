import { getProductionReadinessChecks, getRuntimeEnv, isProductionRuntime } from '@/lib/env'
import prisma from '@/lib/prisma'

export type HealthPayload = {
  ok: boolean
  service: 'launch-kit'
  runtime: ReturnType<typeof getRuntimeEnv>
  checkedAt: string
}

export type ReadinessPayload = HealthPayload & {
  checks: Array<{
    key: string
    ok: boolean
    message: string
  }>
}

export function getHealthPayload(): HealthPayload {
  return {
    ok: true,
    service: 'launch-kit',
    runtime: getRuntimeEnv(),
    checkedAt: new Date().toISOString(),
  }
}

export async function getReadinessPayload(): Promise<ReadinessPayload> {
  const checks: ReadinessPayload['checks'] = []

  try {
    await prisma.$queryRawUnsafe('SELECT 1')
    checks.push({
      key: 'DATABASE',
      ok: true,
      message: 'Database connection succeeded.',
    })
  } catch {
    checks.push({
      key: 'DATABASE',
      ok: false,
      message: 'Database connection failed.',
    })
  }

  if (isProductionRuntime()) {
    checks.push(...getProductionReadinessChecks())
  }

  return {
    ...getHealthPayload(),
    ok: checks.every((check) => check.ok),
    checks,
  }
}
