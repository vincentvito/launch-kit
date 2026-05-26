import { getRequestConfig } from 'next-intl/server'

// The app is English-only for now. To re-enable multilingual support, read the
// locale from a cookie/header again (see git history) and restore the dynamic import.
const locale = 'en'

export default getRequestConfig(async () => {
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  }
})
