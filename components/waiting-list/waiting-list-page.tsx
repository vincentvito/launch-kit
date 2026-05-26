import { getTranslations } from 'next-intl/server'
import { Playfair_Display, Space_Grotesk } from 'next/font/google'
import { Sparkles } from 'lucide-react'
import WaitingListSignupForm from '@/components/waiting-list/waiting-list-signup-form'

const editorialSerif = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '700', '800'],
})

const interfaceSans = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export default async function WaitingListPage() {
  const t = await getTranslations('WaitingList')

  return (
    <div className={`${interfaceSans.className} relative min-h-screen overflow-x-clip bg-white text-zinc-900`}>
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-28 -right-20 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-violet-300/60 via-fuchsia-200/45 to-transparent blur-3xl" />
        <div className="absolute top-1/3 -left-24 h-[360px] w-[360px] rounded-full bg-gradient-to-tr from-purple-300/40 via-violet-200/25 to-transparent blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-violet-100 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 shadow-lg shadow-violet-500/30">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className={`${editorialSerif.className} text-lg font-semibold tracking-tight`}>
                {t('nav.brand')}
              </p>
              <p className="text-[11px] text-zinc-500">{t('nav.sub')}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-3xl flex-col px-4 pb-20 pt-16 sm:px-6 sm:pt-20">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
            {t('hero.badge')}
          </div>

          <h1
            className={`${editorialSerif.className} mt-5 text-4xl leading-[1.05] tracking-tight text-zinc-900 sm:text-5xl`}
          >
            {t('hero.title')}
            <span className="mt-2 block bg-gradient-to-r from-violet-700 via-fuchsia-600 to-violet-500 bg-clip-text text-transparent">
              {t('hero.titleHighlight')}
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg">
            {t('hero.description')}
          </p>
        </div>

        <div className="mx-auto mt-10 w-full max-w-xl rounded-[1.75rem] border border-violet-100 bg-white p-4 shadow-[0_30px_70px_-50px_rgba(100,40,180,0.5)] sm:p-5">
          <WaitingListSignupForm
            placeholder={t('form.placeholder')}
            submitLabel={t('form.submit')}
            helper={t('form.helper')}
            invalidEmail={t('form.invalidEmail')}
            successMessage={t('form.success')}
            errorMessage={t('form.error')}
          />
        </div>

        <ul className="mx-auto mt-10 grid max-w-xl gap-3 sm:grid-cols-3">
          <HighlightCard title={t('highlights.one.title')} body={t('highlights.one.body')} />
          <HighlightCard title={t('highlights.two.title')} body={t('highlights.two.body')} />
          <HighlightCard title={t('highlights.three.title')} body={t('highlights.three.body')} />
        </ul>
      </main>

      <footer className="relative z-10 border-t border-violet-100 py-8">
        <div className="mx-auto max-w-3xl px-4 text-center text-sm text-zinc-500 sm:px-6">
          <p>
            &copy; {new Date().getFullYear()} {t('footer.copyright')}
          </p>
          <p className="mt-1">{t('footer.tagline')}</p>
        </div>
      </footer>
    </div>
  )
}

function HighlightCard({ title, body }: { title: string; body: string }) {
  return (
    <li className="rounded-2xl border border-violet-100 bg-white/90 p-4 text-center shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{body}</p>
    </li>
  )
}
