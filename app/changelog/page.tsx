import { getLocale, getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Changelog.meta')

  return {
    title: t('title'),
    description: t('description'),
  }
}

type ChangelogRelease = {
  version: string
  date: string
  changes: Array<{
    type: 'added' | 'changed' | 'fixed' | 'removed'
    items: string[]
  }>
}

export default async function ChangelogPage() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('Changelog')])
  const changelog = t.raw('releases') as ChangelogRelease[]

  const typeColors = {
    added: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    changed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    fixed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    removed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  }

  const typeLabels = {
    added: t('types.added'),
    changed: t('types.changed'),
    fixed: t('types.fixed'),
    removed: t('types.removed'),
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-zinc-950 dark:to-zinc-900">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">L</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {t('brand')}
            </span>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Button variant="ghost" size="sm" asChild className="mb-8">
          <Link href="/">
            <ArrowLeft className="mr-2 size-4" />
            {t('backHome')}
          </Link>
        </Button>

        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {t('title')}
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            {t('description')}
          </p>
        </div>

        <div className="space-y-12">
          {changelog.map((release, index) => (
            <article
              key={release.version}
              className="relative border-l-2 border-primary/30 pl-8"
            >
              <div className="absolute -left-3 top-0 size-6 rounded-full border-4 border-white bg-primary dark:border-zinc-900" />

              <header className="mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    v{release.version}
                  </h2>
                  {index === 0 ? (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                      {t('latest')}
                    </span>
                  ) : null}
                </div>
                <time className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(release.date).toLocaleDateString(locale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </header>

              <div className="space-y-6">
                {release.changes.map((change) => (
                  <div key={change.type}>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase ${typeColors[change.type]}`}
                    >
                      {typeLabels[change.type]}
                    </span>
                    <ul className="mt-3 space-y-2">
                      {change.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-gray-700 dark:text-gray-300"
                        >
                          <span className="mt-2 size-1.5 flex-shrink-0 rounded-full bg-gray-400 dark:bg-gray-600" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-gray-600 dark:text-gray-400">
            {t('moreHistory')}
          </p>
          <Button variant="outline" asChild className="mt-4">
            <Link href="/">{t('homeCta')}</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
