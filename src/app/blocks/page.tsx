import type { Metadata } from 'next'
import { Footer } from '@/site/Footer'
import { Header } from '@/site/Header'
import { Library } from '@/site/library/Library'
import { BLOCKS } from '@/catalog/blocks'
import { page } from '@/site/seo'

export const metadata: Metadata = page({
  title: `${BLOCKS.length} React Blocks for AI Apps and SaaS`,
  description: `${BLOCKS.length} shadcn blocks for React: AI agent chat, support inbox, evals, pricing, onboarding and more, built from Detent components and playing live. Drop one in and it fits.`,
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
