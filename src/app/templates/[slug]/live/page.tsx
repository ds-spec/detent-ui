import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TEMPLATES, template } from '@/catalog/templates'
import { TemplateView } from '@pro'
import { page, short } from '@/site/seo'

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.id }))
}

export async function generateMetadata({ params }: PageProps<'/templates/[slug]/live'>): Promise<Metadata> {
  const { slug } = await params
  const t = template(slug)
  // The template on its own repeats its page on the site, so search engines are sent there instead.
  return t ? page({ title: `${t.name} — live`, description: short(t.line), path: `/templates/${t.id}`, noindex: true, image: `/templates/${t.id}/opengraph-image` }) : {}
}

/** A template on its own, full-bleed, the way it would ship: no Detent chrome around it. */
export default function TemplateLive({ params }: PageProps<'/templates/[slug]/live'>) {
  return (
    <Suspense fallback={<div className="min-h-[100dvh]" />}>
      <Shown params={params} />
    </Suspense>
  )
}

async function Shown({ params }: { params: PageProps<'/templates/[slug]/live'>['params'] }) {
  const { slug } = await params
  if (!template(slug)) notFound()
  return <TemplateView id={slug} />
}
