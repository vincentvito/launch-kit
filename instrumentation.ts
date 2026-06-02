export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { assertOrLogProductionReadiness } = await import('@/lib/observability')
    assertOrLogProductionReadiness()
  }
}
