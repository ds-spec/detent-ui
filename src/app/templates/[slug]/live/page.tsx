import { Suspense } from 'react'
import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { TEMPLATES, template } from '@/catalog/templates'
import { TemplateView } from '@pro'
import { page, short } from '@/site/seo'

export const viewport: Viewport = { maximumScale: 1 }

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.id }))
}

export async function generateMetadata({ params }: PageProps<'/templates/[slug]/live'>): Promise<Metadata> {
  const { slug } = await params
  const t = template(slug)
  return t ? page({ title: `${t.name} — live`, description: short(t.line), path: `/templates/${t.id}`, noindex: true, image: `/templates/${t.id}/opengraph-image` }) : {}
}

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
