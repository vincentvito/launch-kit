import {
  assertProductionReady,
  getProductionReadinessChecks,
  isProductionBuildPhase,
  isProductionRuntime,
} from '@/lib/env'

let lastProductionReadinessLogKey: string | null = null

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
  if (isProductionBuildPhase()) {
    assertProductionReady()
    return
  }

  try {
    assertProductionReady()
  } catch (error) {
    logProductionReadinessStateOnce(
      `error:${error instanceof Error ? error.message : String(error)}`,
      () => logServerError('production_readiness_failed', error),
    )
    throw error
  }

  if (isProductionRuntime()) {
    const failed = getProductionReadinessChecks().filter((check) => !check.ok)
    const event = failed.length === 0 ? 'production_readiness_ok' : 'production_readiness_skipped'
    const failedChecks = failed.map((check) => check.key)

    logProductionReadinessStateOnce(`${event}:${failedChecks.join(',')}`, () => {
      logServerEvent(event, { failedChecks })
    })
  }
}

function logProductionReadinessStateOnce(key: string, log: () => void): void {
  if (lastProductionReadinessLogKey === key) {
    return
  }

  lastProductionReadinessLogKey = key
  log()
}
