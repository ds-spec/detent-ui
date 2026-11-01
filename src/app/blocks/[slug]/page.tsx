import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BLOCKS, block } from '@/catalog/blocks'
import { isProBlock } from '@/catalog/pro'
import { JsonLd, crumbs, page, short } from '@/site/seo'

export function generateStaticParams() {
  return BLOCKS.map((b) => ({ slug: b.id }))
}

export async function generateMetadata({ params }: PageProps<'/blocks/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const b = block(slug)
  return b ? page({ title: `${b.name} — premium React block`, description: short(`${b.line} ${isProBlock(b.id) ? 'A Detent Pro block.' : 'Free under MIT.'}`), path: `/blocks/${b.id}` }) : {}
}

export default function BlockPage({ params }: PageProps<'/blocks/[slug]'>) {
  return (
    // The layout draws the frame and the block from the URL; the page adds what only the server knows.
    <Suspense fallback={null}>
      <Shown params={params} />
    </Suspense>
  )
}

async function Shown({ params }: { params: PageProps<'/blocks/[slug]'>['params'] }) {
  const { slug } = await params
  const b = block(slug)
  if (!b) notFound()
  return (
    <JsonLd
      data={crumbs([
        ['Blocks', '/blocks'],
        [b.name, `/blocks/${b.id}`],
      ])}
    />
  )
}
