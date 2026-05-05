'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'

export default function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const t = useTranslations('LanguageSwitcher')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const switchLocale = (locale: string) => {
    document.cookie = `locale=${locale};path=/;max-age=31536000`
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        onClick={() => switchLocale('en')}
        disabled={isPending}
        variant={currentLocale === 'en' ? 'default' : 'ghost'}
        size="sm"
        className="h-8 px-2 text-xs"
      >
        EN
      </Button>
      <Button
        onClick={() => switchLocale('es')}
        disabled={isPending}
        variant={currentLocale === 'es' ? 'default' : 'ghost'}
        size="sm"
        className="h-8 px-2 text-xs"
      >
        ES
      </Button>
    </div>
  )
}
