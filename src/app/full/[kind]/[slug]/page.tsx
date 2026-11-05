import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { ENTRIES } from '@/catalog/meta'
import { BLOCKS } from '@/catalog/blocks'
import { FullPiece } from '@/site/FullPiece'

export const viewport: Viewport = { maximumScale: 1 }

const KINDS = { components: ENTRIES, blocks: BLOCKS } as const

export function generateStaticParams() {
  return [...ENTRIES.map((e) => ({ kind: 'components', slug: e.id })), ...BLOCKS.map((b) => ({ kind: 'blocks', slug: b.id }))]
}

export async function generateMetadata({ params }: PageProps<'/full/[kind]/[slug]'>): Promise<Metadata> {
  const { kind, slug } = await params
  const item = KINDS[kind as keyof typeof KINDS]?.find((x) => x.id === slug)
  return item ? { title: `${item.name} — full screen`, robots: { index: false, follow: false } } : {}
}

export default async function Full({ params }: PageProps<'/full/[kind]/[slug]'>) {
  const { kind, slug } = await params
  const list = KINDS[kind as keyof typeof KINDS]
  if (!list?.some((x) => x.id === slug)) notFound()
  return <FullPiece kind={kind as keyof typeof KINDS} id={slug} />
}
