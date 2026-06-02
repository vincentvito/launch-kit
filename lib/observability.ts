import {
  assertProductionReady,
  getProductionReadinessChecks,
  isProductionRuntime,
} from '@/lib/env'

export function logServerEvent(event: string, fields: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({
    level: 'info',
    event,
    at: new Date().toISOString(),
    ...fields,
  }))
}

export function logServerError(event: string, error: unknown, fields: Record<string, unknown> = {}): void {
  console.error(JSON.stringify({
    level: 'error',
    event,
    at: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error),
    ...fields,
  }))
}

export function logProductionReadinessWarnings(): void {
  if (!isProductionRuntime()) {
    return
  }

  const failed = getProductionReadinessChecks().filter((check) => !check.ok)
  for (const check of failed) {
    logServerEvent('production_readiness_warning', {
      key: check.key,
      message: check.message,
    })
  }
}

export function assertOrLogProductionReadiness(): void {
  try {
    assertProductionReady()
  } catch (error) {
    logServerError('production_readiness_failed', error)
    throw error
  }

  if (isProductionRuntime()) {
    const failed = getProductionReadinessChecks().filter((check) => !check.ok)
    logServerEvent(failed.length === 0 ? 'production_readiness_ok' : 'production_readiness_skipped', {
      failedChecks: failed.map((check) => check.key),
    })
  }
}
