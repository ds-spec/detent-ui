import { ENTRIES } from '@/catalog/meta'
import { source } from '@/catalog/source'
import { BLOCKS } from '@/catalog/blocks'
import { TEMPLATES } from '@/catalog/templates'

export function generateStaticParams() {
  return [...ENTRIES, ...BLOCKS, ...TEMPLATES.map((t) => ({ id: `template-${t.id}` }))].map((e) => ({ slug: e.id }))
}

export async function GET(_req: Request, { params }: RouteContext<'/source/[slug]'>) {
  const { slug } = await params
  return Response.json(await source(slug))
}
