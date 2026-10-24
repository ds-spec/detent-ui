import type { MetadataRoute } from 'next'
import { ENTRIES } from '@/catalog/meta'
import { RELEASES } from '@/catalog/trust'
import { BLOCKS } from '@/pro/blocks/meta'
import { url } from '@/site/seo'
import { TEMPLATES } from '@/templates/meta'

/** Every page worth finding: the site's own, then each component, block and template. */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(`${RELEASES[0].date}T00:00:00Z`)
  const at = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] = 'weekly') => ({ url: url(path), lastModified, changeFrequency, priority })
  return [
    at('/', 1, 'daily'),
    at('/pro', 0.9),
    at('/blocks', 0.8),
    at('/templates', 0.8),
    ...ENTRIES.map((e) => at(`/components/${e.id}`, 0.7)),
    ...BLOCKS.map((b) => at(`/blocks/${b.id}`, 0.7)),
    ...TEMPLATES.map((t) => at(`/templates/${t.id}`, 0.7)),
    at('/changelog', 0.5),
    at('/system', 0.4, 'monthly'),
    at('/licence', 0.3, 'monthly'),
    at('/refunds', 0.2, 'yearly'),
    at('/terms', 0.2, 'yearly'),
  ]
}
