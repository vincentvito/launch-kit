'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('GlobalError')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-6 text-center">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">{t('eyebrow')}</p>
        <h1 className="text-3xl font-semibold text-zinc-900">{t('title')}</h1>
        <p className="max-w-md text-sm text-zinc-500">
          {t('description')}
        </p>
      </div>
      <Button
        onClick={reset}
        className="h-11 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 text-white shadow-lg shadow-violet-500/35 hover:from-violet-700 hover:to-fuchsia-600"
      >
        {t('retry')}
      </Button>
    </main>
  )
}
