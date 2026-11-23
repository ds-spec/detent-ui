import { AI_SDK } from '@/catalog/site'
import type { MetadataRoute } from 'next'
import { ENTRIES } from '@/catalog/meta'
import { RELEASES } from '@/catalog/trust'
import { BLOCKS } from '@/catalog/blocks'
import { url } from '@/site/seo'
import { TEMPLATES } from '@/catalog/templates'
// Filled from git by scripts/build-lastmod.mjs at deploy; empty in the repo, so dev falls back to the last release.
import LASTMOD from '@/catalog/lastmod.json'

export default function sitemap(): MetadataRoute.Sitemap {
  const days: Record<string, string> = LASTMOD
  const at = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] = 'weekly') => ({
    url: url(path),
    lastModified: new Date(`${days[path] ?? RELEASES[0].date}T00:00:00Z`),
    changeFrequency,
    priority,
  })
  return [
    at('/', 1, 'daily'),
    at('/pro', 0.9),
    at('/agencies', 0.8),
    at('/components', 0.9),
    at('/blocks', 0.8),
    at('/premium-shadcn-components', 0.8),
    at('/templates', 0.8),
    ...(AI_SDK ? [at('/ai-sdk', 0.8)] : []),
    ...ENTRIES.map((e) => at(`/components/${e.id}`, 0.7)),
    ...BLOCKS.map((b) => at(`/blocks/${b.id}`, 0.7)),
    ...TEMPLATES.map((t) => at(`/templates/${t.id}`, 0.7)),
    at('/docs', 0.6),
    at('/changelog', 0.5),
    at('/system', 0.4, 'monthly'),
    at('/licence', 0.3, 'monthly'),
    at('/refunds', 0.2, 'yearly'),
    at('/terms', 0.2, 'yearly'),
    at('/privacy', 0.2, 'yearly'),
  ]
}
