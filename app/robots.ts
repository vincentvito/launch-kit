import type { MetadataRoute } from 'next'
import { getAppUrl } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/auth/', '/billing/', '/dashboard'],
    },
    sitemap: `${getAppUrl()}/sitemap.xml`,
  }
}
