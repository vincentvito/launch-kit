import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import LoginClient from './login-client'
import { getServerSession } from '@/lib/launch-kit/auth'
import { isGoogleAuthEnabled } from '@/lib/auth'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Auth.meta')

  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function LoginPage() {
  const session = await getServerSession()

  if (session) {
    redirect('/dashboard')
  }

  return <LoginClient googleEnabled={isGoogleAuthEnabled} />
}
