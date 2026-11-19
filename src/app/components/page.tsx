import type { Metadata } from 'next'
import { Library } from '@/site/library/Library'
import { ENTRIES } from '@/catalog/meta'
import { FREE_COUNT, page } from '@/site/seo'

export const metadata: Metadata = page({
  title: `${ENTRIES.length} React Components for shadcn (${new Date().getFullYear()})`,
  description: `${ENTRIES.length} React components for shadcn: AI chat, agent traces, charts and inputs, ${FREE_COUNT} free under MIT. Every one runs live here; open one for its code and props.`,
  path: '/components',
})

export default function ComponentsPage() {
  return <Library shelf="components" />
}
