import { BLOCKS, block } from '@/catalog/blocks'
import { CONTENT_TYPE, OG, pageImage } from '@/site/og'

export const alt = 'A Detent block: a whole screen for an AI product, already working'
export const size = OG
export const contentType = CONTENT_TYPE

export function generateStaticParams() {
  return BLOCKS.map((b) => ({ slug: b.id }))
}

const KIND = { app: 'App screen', flow: 'Flow', section: 'Page section' } as const

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const b = block(slug)
  if (!b) return pageImage({ kicker: 'Block', title: 'Detent' })
  return pageImage({ kicker: `Block · ${KIND[b.kind]}`, title: b.name, tag: 'Pro' })
}
