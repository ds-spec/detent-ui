import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BLOCKS, block } from '@/catalog/blocks'
import { installCommand, isProBlock } from '@/catalog/pro'
import { JsonLd, crumbs, page, short, sourceCode } from '@/site/seo'
import { SEARCH, searchDescription } from '@/catalog/search'

export function generateStaticParams() {
  return BLOCKS.map((b) => ({ slug: b.id }))
}

export async function generateMetadata({ params }: PageProps<'/blocks/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const b = block(slug)
  return b ? page({ title: SEARCH[b.id] ?? `${b.name}: React block`, description: short(searchDescription(b.id, b.line, isProBlock(b.id))), path: `/blocks/${b.id}` }) : {}
}

// The page checks its slug before streaming so an unknown one is a real 404, so it may block on navigation.
export const instant = false

export default async function BlockPage({ params }: PageProps<'/blocks/[slug]'>) {
  // checked here, outside the Suspense, so an unknown slug answers 404 before anything streams
  if (!block((await params).slug)) notFound()
  return (
    <Suspense fallback={null}>
      <Shown params={params} />
    </Suspense>
  )
}

async function Shown({ params }: { params: PageProps<'/blocks/[slug]'>['params'] }) {
  const { slug } = await params
  const b = block(slug)
  if (!b) notFound()
  const free = !isProBlock(b.id)
  return (
    <>
      <JsonLd
        data={crumbs([
          ['Blocks', '/blocks'],
          [b.name, `/blocks/${b.id}`],
        ])}
      />
      <JsonLd data={sourceCode({ name: b.name, description: searchDescription(b.id, b.line, !free), path: `/blocks/${b.id}`, free, install: installCommand(b.id, free) })} />
    </>
  )
}
