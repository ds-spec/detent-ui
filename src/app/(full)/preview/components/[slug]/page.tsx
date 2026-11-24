import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ENTRIES, entry } from '@/catalog/meta'
import { Full } from './Full'

export function generateStaticParams() {
  return ENTRIES.map((e) => ({ slug: e.id }))
}

export async function generateMetadata({ params }: PageProps<'/preview/components/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  return { title: entry(slug)?.name ?? 'Preview', robots: { index: false, follow: false } }
}

/** One component, alone on the page, at its own address, so it can be opened, shared and resized. */
export default async function Page({ params }: PageProps<'/preview/components/[slug]'>) {
  const { slug } = await params
  const e = entry(slug)
  if (!e) notFound()
  return <Full id={e.id} bleed={!!e.bleed} zoom={e.zoom} />
}
