import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import LoginClient from './login-client'
import { getServerSession } from '@/lib/launch-kit/auth'

export const metadata: Metadata = {
  title: 'Sign in | ClickStudio Starter',
  description: 'Sign in to your ClickStudio starter dashboard.',
}

export default async function LoginPage() {
  const session = await getServerSession()

  if (session) {
    redirect('/dashboard')
  }

  return <LoginClient />
}
