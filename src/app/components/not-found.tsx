import type { Metadata } from 'next'
import { NotFound } from '@/site/NotFound'

export const metadata: Metadata = { title: 'Page not found' }

export default function ComponentNotFound() {
  return <NotFound />
}
