import type { MetadataRoute } from 'next'
import { url } from '@/site/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/preview/', '/preview-fit/', '/api/', '/account'],
      },
      {
        userAgent: [
          'OAI-SearchBot',
          'ChatGPT-User',
          'Claude-SearchBot',
          'Claude-User',
          'PerplexityBot',
          'Perplexity-User',
        ],
        allow: '/',
        disallow: ['/preview/', '/preview-fit/', '/api/', '/account'],
      },
    ],
    sitemap: url('/sitemap.xml'),
    host: url(),
  }
}
