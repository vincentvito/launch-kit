import { auth } from '@/lib/auth'
import { launchApiErrorResponse } from '@/lib/launch-kit/api-guard'
import { assertOrLogProductionReadiness } from '@/lib/observability'
import { toNextJsHandler } from 'better-auth/next-js'

export const runtime = 'nodejs'
export const maxDuration = 60

const authHandlers = toNextJsHandler(auth)

export async function GET(...args: Parameters<typeof authHandlers.GET>) {
  try {
    assertOrLogProductionReadiness()
  } catch (error) {
    return launchApiErrorResponse(error)
  }

  return authHandlers.GET(...args)
}

export async function POST(...args: Parameters<typeof authHandlers.POST>) {
  try {
    assertOrLogProductionReadiness()
  } catch (error) {
    return launchApiErrorResponse(error)
  }

  return authHandlers.POST(...args)
}
