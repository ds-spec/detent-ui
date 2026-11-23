import type { Metadata } from 'next'
import { BLOCKS } from '@/catalog/blocks'
import { ENTRIES } from '@/catalog/meta'
import { Agencies } from '@/site/agencies/Agencies'
import { page } from '@/site/seo'
import { SitePage } from '@/site/sheets'

export const metadata: Metadata = page({
  title: 'Detent for agencies: AI products your clients think cost $20k · Detent UI',
  absolute: true,
  description: `An AI workspace template, ${BLOCKS.length} screens and ${ENTRIES.length} React components for shadcn, restyled by each client's theme. Unlimited client projects, $99 once.`,
  path: '/agencies',
})

export default function AgenciesPage() {
  return (
    <SitePage>
      <Agencies />
    </SitePage>
  )
}
