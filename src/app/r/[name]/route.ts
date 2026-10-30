import { freeNames, isProName } from '@/catalog/registry'
import { asset } from '@/lib/asset'

export function generateStaticParams() {
  return ['registry', 'theme', ...freeNames()].flatMap((n) => [{ name: n }, { name: `${n}.json` }])
}

// The public registry: what `npx shadcn add <site>/r/<name>` fetches. Built once, served as static JSON.
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const name = (await params).name.replace(/\.json$/, '')
  if (name === 'registry') return Response.json(await asset('index.json'))
  if (name === 'theme') return Response.json(await asset('theme.json'))
  const item = freeNames().includes(name) ? await asset(`items/${name}.json`) : null
  if (item) return Response.json(item)
  if (isProName(name)) return Response.json({ error: `${name} is part of Detent Pro. Install it from the Pro registry with your key: npx shadcn add @detent-pro/${name}` }, { status: 403 })
  return Response.json({ error: `There's no ${name} in Detent.` }, { status: 404 })
}
