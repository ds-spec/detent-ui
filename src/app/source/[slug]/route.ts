import { ENTRIES } from '@/catalog/meta'
import { source } from '@/catalog/source'
import { BLOCKS } from '@/pro/blocks/meta'
import { TEMPLATES } from '@/templates/meta'

export function generateStaticParams() {
  return [...ENTRIES, ...BLOCKS, ...TEMPLATES.map((t) => ({ id: `template-${t.id}` }))].map((e) => ({ slug: e.id }))
}

// Each component's highlighted source, as static JSON, fetched only when someone opens the code.
export async function GET(_req: Request, { params }: RouteContext<'/source/[slug]'>) {
  const { slug } = await params
  return Response.json(await source(slug))
}
