import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { apiOf } from '@/catalog/api-of'
import { ENTRIES, entry } from '@/catalog/meta'
import { Example } from '@/site/bench/Example'
import { PropsPanel } from '@/site/bench/Panel'
import { isProComponent } from '@/catalog/pro'
import { asset } from '@/lib/asset'
import { JsonLd, crumbs, faqPage, page, short } from '@/site/seo'
import { SEARCH, searchDescription } from '@/catalog/search'
import { DOCS } from '@/catalog/docs'

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
      {DOCS[e.id]?.faq.length ? <JsonLd data={faqPage(DOCS[e.id].faq)} /> : null}
      {api?.props.length ? <PropsPanel id={slug} api={api} /> : null}
      {example ? <Example {...example} /> : null}
    </>
  )
}
