import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import LandingPage from '@/components/landing/landing-page'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Landing.meta')
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function HomePage() {
  return <LandingPage />
}
