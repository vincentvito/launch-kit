import type { MetadataRoute } from 'next'
import { getAppUrl } from '@/lib/env'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppUrl()
  const now = new Date()

  return ['/', '/pricing', '/changelog', '/privacy', '/terms'].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : 0.7,
  }))
}
