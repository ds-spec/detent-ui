import { CATEGORIES, ENTRIES, entry } from '@/catalog/meta'
import { isProComponent } from '@/catalog/pro'
import { CONTENT_TYPE, OG, pageImage } from '@/site/og'

export const alt = 'A premium Detent React component'
export const size = OG
export const contentType = CONTENT_TYPE

export function generateStaticParams() {
  return ENTRIES.map((e) => ({ slug: e.id }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const e = entry(slug)
  if (!e) return pageImage({ kicker: 'Component', title: 'Detent' })
  const pro = isProComponent(e.id)
  return pageImage({ kicker: `React component · ${CATEGORIES.find((c) => c.id === e.category)?.name ?? 'Detent'}`, title: e.name, tag: pro ? 'Pro' : 'Free · MIT' })
}
