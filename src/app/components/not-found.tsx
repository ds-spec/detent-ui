import type { Metadata } from 'next'
import { NotFound } from '@/site/NotFound'

export const metadata: Metadata = { title: 'Page not found' }

// The components layout already draws the header and footer around it.
export default function ComponentNotFound() {
  return <NotFound />
}
