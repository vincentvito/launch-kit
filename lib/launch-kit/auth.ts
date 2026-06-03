import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { assertOrLogProductionReadiness } from '@/lib/observability'

export async function getServerSession() {
  assertOrLogProductionReadiness()

  return auth.api.getSession({
    headers: await headers(),
  })
}

export async function requireServerSession() {
  const session = await getServerSession()
  if (!session) {
    throw new Error('UNAUTHORIZED')
  }
  return session
}
