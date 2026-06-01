import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Button } from '@/components/ui/button'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Legal.terms.meta')
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function TermsPage() {
  const t = await getTranslations('Legal.terms')
  const items = t.raw('items') as string[]

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-zinc-900">
      <div className="mx-auto max-w-3xl space-y-8">
        <Button asChild variant="ghost" className="px-0">
          <Link href="/">{t('back')}</Link>
        </Button>
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-700">{t('eyebrow')}</p>
          <h1 className="text-4xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-base leading-7 text-zinc-600">{t('description')}</p>
        </div>
        <div className="space-y-4 text-sm leading-7 text-zinc-700">
          {items.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </div>
    </main>
  )
}
