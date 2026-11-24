import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { apiOf } from '@/catalog/api-of'
import { ENTRIES, entry } from '@/catalog/meta'
import { Example } from '@/site/bench/Example'
import { PropsPanel } from '@/site/bench/Panel'
import { installCommand, isProComponent } from '@/catalog/pro'
import { asset } from '@/lib/asset'
import { JsonLd, crumbs, page, short, sourceCode } from '@/site/seo'
import { SEARCH, searchDescription } from '@/catalog/search'

export function generateStaticParams() {
  return ENTRIES.map((e) => ({ slug: e.id }))
}

export async function generateMetadata({ params }: PageProps<'/components/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const e = entry(slug)
  if (!e) return {}
  const pro = isProComponent(e.id)
  return page({ title: SEARCH[e.id] ?? `${e.name}: React component`, description: short(searchDescription(e.id, e.line, pro)), path: `/components/${e.id}` })
}

// The page checks its slug before streaming so an unknown one is a real 404, so it may block on navigation.
export const instant = false

export default async function ComponentPage({ params }: PageProps<'/components/[slug]'>) {
  // checked here, outside the Suspense, so an unknown slug answers 404 before anything streams
  if (!entry((await params).slug)) notFound()
  return (
    <Suspense fallback={null}>
      <Props params={params} />
    </Suspense>
  )
}

async function Props({ params }: { params: PageProps<'/components/[slug]'>['params'] }) {
  const { slug } = await params
  const e = entry(slug)
  if (!e) notFound()
  const [api, example] = await Promise.all([apiOf(slug), asset<{ code: string; html: string }>(`examples/${slug}.json`)])
  return (
    <>
      <JsonLd data={crumbs([[e.name, `/components/${e.id}`]])} />
      <JsonLd data={sourceCode({ name: e.name, description: searchDescription(e.id, e.line, isProComponent(e.id)), path: `/components/${e.id}`, free: !isProComponent(e.id), install: installCommand(e.id, !isProComponent(e.id)) })} />
      {api?.props.length ? <PropsPanel id={slug} api={api} /> : null}
      {example ? <Example {...example} /> : null}
    </>
  )
}
