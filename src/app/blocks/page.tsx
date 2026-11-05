import type { Metadata } from 'next'
import { Footer } from '@/site/Footer'
import { Header } from '@/site/Header'
import { Library } from '@/site/library/Library'
import { page } from '@/site/seo'

export const metadata: Metadata = page({
  title: 'Blocks — whole screens, ready',
  description: 'Sections and app screens built from Detent components, playing live. Drop one in and it fits.',
  path: '/blocks',
})

export default function BlocksPage() {
  return (
    <>
      <Header />
      <Library shelf="blocks" />
      <Footer />
    </>
  )
}
