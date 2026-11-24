import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TEMPLATES, template } from '@/catalog/templates'
import { JsonLd, crumbs, page, short } from '@/site/seo'
import { SEARCH } from '@/catalog/search'

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.id }))
}

export async function generateMetadata({ params }: PageProps<'/templates/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const t = template(slug)
  return t ? page({ title: SEARCH[t.id] ?? `${t.name}: ${t.kind} ${t.form === 'app' ? 'app' : 'landing page'} template`, description: short(t.line), path: `/templates/${t.id}` }) : {}
}

// The page checks its slug before streaming so an unknown one is a real 404, so it may block on navigation.
export const instant = false

export default async function TemplatePage({ params }: PageProps<'/templates/[slug]'>) {
  // checked here, outside the Suspense, so an unknown slug answers 404 before anything streams
  if (!template((await params).slug)) notFound()
  return (
    <Suspense fallback={null}>
      <Shown params={params} />
    </Suspense>
  )
}

async function Shown({ params }: { params: PageProps<'/templates/[slug]'>['params'] }) {
  const { slug } = await params
  const t = template(slug)
  if (!t) notFound()
  return (
    <JsonLd
      data={crumbs([
        ['Templates', '/templates'],
        [t.name, `/templates/${t.id}`],
      ])}
    />
  )
}
