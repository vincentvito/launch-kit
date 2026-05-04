'use client'

import { useSession, signOut } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import Link from 'next/link'

export default function DashboardPage() {
  const t = useTranslations('Dashboard')
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [currentLocale, setCurrentLocale] = useState('en')

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth/login')
    }
  }, [session, isPending, router])

  useEffect(() => {
    const locale = document.cookie.split('; ').find(row => row.startsWith('locale='))?.split('=')[1] || 'en'
    setCurrentLocale(locale)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
  }

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-zinc-900">
        <div className="text-muted-foreground">{t('loading')}</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const initials = session.user.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-zinc-900">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">R</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              <span className="rounded bg-black px-1 text-white dark:bg-white dark:text-black">reno</span>
              sync
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher currentLocale={currentLocale} />
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarImage src={session.user.image || undefined} alt={session.user.name || 'User'} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium text-gray-700 sm:block dark:text-gray-300">
                {session.user.name || session.user.email}
              </span>
            </div>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              {t('signOut')}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('welcome', { name: session.user.name || session.user.email })}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {t('description')}
          </p>
        </div>
      </main>
    </div>
  )
}
