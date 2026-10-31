import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { apiOf } from '@/catalog/api-of'
import { ENTRIES, entry } from '@/catalog/meta'
import { Example } from '@/site/bench/Example'
import { PropsPanel } from '@/site/bench/Panel'
import { isProComponent } from '@/catalog/pro'
import { asset } from '@/lib/asset'
import { JsonLd, crumbs, page, short } from '@/site/seo'

export function generateStaticParams() {
  return ENTRIES.map((e) => ({ slug: e.id }))
}

export async function generateMetadata({ params }: PageProps<'/components/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const e = entry(slug)
  if (!e) return {}
  const pro = isProComponent(e.id)
  const said = `${e.line} ${pro ? 'Part of Detent Pro.' : 'Free under MIT.'}`
  return page({ title: `${e.name} — React component`, description: short(said.length <= 160 ? said : e.line), path: `/components/${e.id}` })
}

// The layout draws the stage and notes from the URL; the page adds the props, read from the source.
export default function ComponentPage({ params }: PageProps<'/components/[slug]'>) {
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
      {api?.props.length ? <PropsPanel id={slug} api={api} /> : null}
      {example ? <Example {...example} /> : null}
    </>
  )
}
