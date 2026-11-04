import type { Metadata } from 'next'
import { ENTRIES } from '@/catalog/meta'
import { PLANS, PRO_COMPONENTS, SITE } from '@/catalog/pro'
import { BLOCKS } from '@/catalog/blocks'
import { TEMPLATE_COUNT } from '@/catalog/templates'

/**
 * What search engines and link previews read: each page's title, the sentence under it in a
 * result, where it lives, and how a link to it unfurls. The numbers come from the catalog, so
 * they never go stale. Plain data, safe for the server.
 */

export const NAME = 'Detent'
export const TAGLINE = 'Most apps look the same. Yours won’t.'
export const FREE_COUNT = ENTRIES.length - PRO_COMPONENTS.length

/** What Detent is, in one sentence: the default description, and the one structured data uses. */
export const DESCRIPTION = `Well-made React components for your product. Installed with shadcn, styled by your theme, yours to change. ${FREE_COUNT} of ${ENTRIES.length} are free.`

export const url = (path = '/') => `${SITE}${path === '/' ? '' : path}`

/** A search result shows about 160 characters: longer ones end at a word, with an ellipsis. */
export const short = (s: string, n = 158) => (s.length <= n ? s : `${s.slice(0, s.lastIndexOf(' ', n - 1)).replace(/[,;:]$/, '')}…`)

/**
 * A page's metadata. `title` gets " · Detent" after it unless it's `absolute`; the link preview
 * repeats it, since templates don't reach Open Graph. `path` is the canonical address. A page
 * with an image of its own beside it gets that one; one without names the image it borrows, since
 * setting Open Graph here stops the site's image being inherited.
 */
export function page({ title, description, path, absolute = false, noindex = false, image }: { title: string; description: string; path: string; absolute?: boolean; noindex?: boolean; image?: string }): Metadata {
  const full = absolute ? title : `${title} · ${NAME}`
  const images = image ? { images: [{ url: image, width: 1200, height: 630, alt: full }] } : {}
  const mdUrl = path === '/' ? `${SITE}/index.md` : `${SITE}${path}.md`
  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: {
      canonical: path,
      types: {
        'text/markdown': mdUrl,
      },
    },
    other: {
      'ai-summary': description,
    },
    openGraph: { title: full, description, url: path, siteName: NAME, type: 'website', locale: 'en_US', ...images },
    twitter: { card: 'summary_large_image', site: '@next_gendev', creator: '@next_gendev', title: full, description, ...images },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  }
}

/** Structured data, set in the page as JSON-LD. `<` is escaped so no string can close the tag. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />
}

const org = { '@type': 'Organization', '@id': `${url()}/#organization`, name: NAME, url: url(), logo: url('/icon.svg'), sameAs: ['https://x.com/next_gendev', 'https://github.com/ds-spec/detent-ui'] }

/** The site, who makes it, and what it is: for the home page. */
export const siteGraph = () => ({
  '@context': 'https://schema.org',
  '@graph': [
    org,
    { '@type': 'WebSite', '@id': `${url()}/#website`, name: NAME, url: url(), description: DESCRIPTION, publisher: { '@id': `${url()}/#organization` }, inLanguage: 'en' },
    {
      '@type': 'SoftwareApplication',
      name: NAME,
      url: url(),
      description: DESCRIPTION,
      applicationCategory: 'DeveloperApplication',
      applicationSubCategory: 'React component library',
      operatingSystem: 'Web',
      publisher: { '@id': `${url()}/#organization` },
      offers: [{ '@type': 'Offer', name: 'Free components', price: 0, priceCurrency: 'USD' }, ...PLANS.map((p) => ({ '@type': 'Offer', name: p.name, price: p.price, priceCurrency: 'USD', url: url('/pro#pricing') }))],
    },
  ],
})

/** Pro as a product with its plans, and its questions answered. */
export const proGraph = (faq: [string, string][]) => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Product',
      name: `${NAME} Pro`,
      description: `${PRO_COMPONENTS.length} advanced React components, ${BLOCKS.length} whole screens and ${TEMPLATE_COUNT}, installed as source you own.`,
      brand: { '@type': 'Brand', name: NAME },
      url: url('/pro'),
      image: url('/pro/opengraph-image'),
      offers: PLANS.map((p) => ({ '@type': 'Offer', name: p.name, price: p.price, priceCurrency: 'USD', availability: 'https://schema.org/InStock', url: url('/pro#pricing') })),
    },
    { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ],
})

/** A section's index: everything in it, in order, each with its address. */
export const list = (name: string, items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name,
  numberOfItems: items.length,
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, url: url(it.path) })),
})

/** Where a page sits: Detent, its section, and the page itself. */
export const crumbs = (trail: [string, string][]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [[NAME, '/'] as [string, string], ...trail].map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url(path) })),
})
