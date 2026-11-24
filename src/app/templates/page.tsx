import type { Metadata } from 'next'
import { TEMPLATES } from '@/catalog/templates'
import { Footer } from '@/site/Footer'
import { Header } from '@/site/Header'
import { Library } from '@/site/library/Library'
import { JsonLd, list, page } from '@/site/seo'

export const metadata: Metadata = page({
  title: 'React Templates: landing pages and apps, ready to run',
  description: 'Landing pages and apps to start from, built in React from Detent components, live in light and dark at any width. More templates are on the way.',
  path: '/templates',
})

export default function TemplatesPage() {
  return (
    <>
      <Header />
      <JsonLd
        data={list(
          'Detent templates',
          TEMPLATES.map((t) => ({ name: t.name, path: `/templates/${t.id}` })),
        )}
      />
      <Library shelf="templates" />
      <Footer />
    </>
  )
}
