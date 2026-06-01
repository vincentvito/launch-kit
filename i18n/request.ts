import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

const locales = ['en', 'es'] as const
type Locale = (typeof locales)[number]

export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get('locale')?.value
  const locale: Locale = locales.includes(cookieLocale as Locale) ? (cookieLocale as Locale) : 'en'

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
