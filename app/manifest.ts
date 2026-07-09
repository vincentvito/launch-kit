import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'shipdaddy',
    short_name: 'shipdaddy',
    description: 'Turn one product URL into launch copy, exports, and premium growth assets.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#6d28d9',
    icons: [
      {
        src: '/icon.png',
        sizes: '1024x1024',
        type: 'image/png',
      },
    ],
  }
}
