import type { MetadataRoute } from 'next'
import { DESCRIPTION, NAME } from '@/site/seo'

/** For a home-screen shortcut and anything else that reads the app's name and colours. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${NAME} — premium React components`,
    short_name: NAME,
    description: DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  }
}
