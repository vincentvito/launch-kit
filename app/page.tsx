import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import LandingPage from '@/components/landing/landing-page'
import WaitingListPage from '@/components/waiting-list/waiting-list-page'
import { isWaitingListEnabled } from '@/lib/site-config'

export async function generateMetadata(): Promise<Metadata> {
  if (isWaitingListEnabled()) {
    const t = await getTranslations('WaitingList.meta')
    return {
      title: t('title'),
      description: t('description'),
    }
  }

  const t = await getTranslations('Landing.meta')
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function HomePage() {
  if (isWaitingListEnabled()) {
    return <WaitingListPage />
  }

  return <LandingPage />
}
