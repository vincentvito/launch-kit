import { Suspense } from 'react'
import DashboardQueryClient from './dashboard-query-client'

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardQueryClient />
    </Suspense>
  )
}
