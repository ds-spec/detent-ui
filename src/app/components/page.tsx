import type { Metadata } from 'next'
import { Library } from '@/site/library/Library'
import { page } from '@/site/seo'

export const metadata: Metadata = page({
  title: 'Components — every piece, live',
  description: 'Every Detent component, running live. Press, drag and type on any of them, then open one for its code and props.',
  path: '/components',
})

export default function ComponentsPage() {
  return <Library shelf="components" />
}
