import type { MetadataRoute } from 'next'
import { url } from '@/site/seo'

/** Everything is open to crawl but the unlisted previews; the sitemap says where everything is. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/preview/', '/preview-fit/'] }],
    sitemap: url('/sitemap.xml'),
    host: url(),
  }
}
