import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BLOCKS, block } from '@/catalog/blocks'
import { BlockViewer } from '@/site/blocks/BlockViewer'
import { JsonLd, crumbs, page, short } from '@/site/seo'

export function generateStaticParams() {
  return BLOCKS.map((b) => ({ slug: b.id }))
}

export async function generateMetadata({ params }: PageProps<'/blocks/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const b = block(slug)
  return b ? page({ title: `${b.name} — React block for AI products`, description: short(`${b.line} A Detent Pro block.`), path: `/blocks/${b.id}` }) : {}
}

export default function BlockPage({ params }: PageProps<'/blocks/[slug]'>) {
  return (
    // The block's page is an app of its own: the frame with every block down its side, and the block in its panel.
    <Suspense fallback={<div className="min-h-[100dvh]" style={{ background: 'var(--shell)' }} />}>
      <Shown params={params} />
    </Suspense>
  )
}

async function Shown({ params }: { params: PageProps<'/blocks/[slug]'>['params'] }) {
  const { slug } = await params
  const b = block(slug)
  if (!b) notFound()
  return (
    <>
      <JsonLd
        data={crumbs([
          ['Blocks', '/blocks'],
          [b.name, `/blocks/${b.id}`],
        ])}
      />
      <BlockViewer id={slug} />
    </>
  )
}
