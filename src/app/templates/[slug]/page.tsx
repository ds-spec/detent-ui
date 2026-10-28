import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TEMPLATES, template } from '@/catalog/templates'
import { TemplateViewer } from '@/site/templates/TemplateViewer'
import { JsonLd, crumbs, page, short } from '@/site/seo'

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.id }))
}

export async function generateMetadata({ params }: PageProps<'/templates/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const t = template(slug)
  return t ? page({ title: `${t.name} — ${t.kind} ${t.form === 'app' ? 'app' : 'landing page'} template`, description: short(t.line), path: `/templates/${t.id}` }) : {}
}

export default function TemplatePage({ params }: PageProps<'/templates/[slug]'>) {
  return (
    <Suspense fallback={<div className="min-h-[100dvh]" />}>
      <Shown params={params} />
    </Suspense>
  )
}

async function Shown({ params }: { params: PageProps<'/templates/[slug]'>['params'] }) {
  const { slug } = await params
  const t = template(slug)
  if (!t) notFound()
  return (
    <>
      <JsonLd
        data={crumbs([
          ['Templates', '/templates'],
          [t.name, `/templates/${t.id}`],
        ])}
      />
      <TemplateViewer id={slug} />
    </>
  )
}
