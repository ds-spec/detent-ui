import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BLOCKS, block } from '@/pro/blocks/meta'
import { BlockViewer } from '@/site/blocks/BlockViewer'
import { Footer } from '@/site/Footer'
import { Header } from '@/site/Header'
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
    <>
      <Header />
      {/* The placeholder holds the page's height, so the footer never shows above the block and then drops. */}
      <Suspense fallback={<div className="min-h-[100dvh]" />}>
        <Shown params={params} />
      </Suspense>
      <Footer />
    </>
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
