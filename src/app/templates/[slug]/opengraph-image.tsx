import { CONTENT_TYPE, OG, pageImage } from '@/site/og'
import { TEMPLATES, template } from '@/templates/meta'

export const alt = 'A Detent template for an AI product'
export const size = OG
export const contentType = CONTENT_TYPE

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.id }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const t = template(slug)
  if (!t) return pageImage({ kicker: 'Template', title: 'Detent' })
  // The app template carries Detent's own name, which the image already shows, so it goes by what it is.
  const own = t.name === 'Detent'
  return pageImage({ kicker: `${t.form === 'app' ? 'App' : 'Landing page'} template${own ? '' : ` · ${t.kind}`}`, title: own ? t.kind : t.name, tag: 'Pro' })
}
