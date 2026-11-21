import type { Metadata } from 'next'
import { BLOCKS } from '@/catalog/blocks'
import { latest } from '@/catalog/latest'
import { isProBlock, PRO_COMPONENTS } from '@/catalog/pro'
import { TEMPLATES } from '@/catalog/templates'
import { libraryIndex } from '@/site/home/library'
import { Home } from '@/site/home/long/Home'
import { SitePage } from '@/site/sheets'
import { BRAND, DESCRIPTION, JsonLd, page, siteGraph } from '@/site/seo'

export const metadata: Metadata = page({ title: `${BRAND}: React Components for shadcn and AI Apps`, absolute: true, description: DESCRIPTION, path: '/' })

/** Home: library first, proof, screens, charts, code you own, before and after, questions. No pricing on home. */
export default function Page() {
  const lib = libraryIndex()
  const free = lib.filter((x) => !x.pro).length + BLOCKS.filter((b) => !isProBlock(b.id)).length
  return (
    <SitePage>
      <JsonLd data={siteGraph()} />
      <Home total={lib.length} free={free} blocks={BLOCKS.length} templates={TEMPLATES.length} pro={PRO_COMPONENTS.length} fresh={latest()} />
    </SitePage>
  )
}
