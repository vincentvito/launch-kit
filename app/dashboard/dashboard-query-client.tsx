'use client'

import { useSearchParams } from 'next/navigation'
import DashboardPageClient from './dashboard-client'

export default function DashboardQueryClient() {
  const searchParams = useSearchParams()

  return (
    <DashboardPageClient
      initialUrlParam={searchParams.get('url')?.trim() || ''}
      initialWantsDemo={searchParams.get('demo') === '1'}
      initialWantsResultsView={searchParams.get('view') === 'results'}
    />
  )
}
