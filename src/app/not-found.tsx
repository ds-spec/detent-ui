import type { Metadata } from 'next'
import { Footer } from '@/site/Footer'
import { Header } from '@/site/Header'
import { NotFound } from '@/site/NotFound'

export const metadata: Metadata = { title: 'Page not found' }

export default function RootNotFound() {
  return (
    <>
      <Header />
      <NotFound />
      <Footer />
    </>
  )
}
