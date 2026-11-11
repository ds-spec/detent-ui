import { freeNames, isProName } from '@/catalog/registry'
import { asset } from '@/lib/asset'
import { countFreeFetch } from '@/lib/account/installs'

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const name = (await params).name.replace(/\.json$/, '')
  if (name === 'registry') return Response.json(await asset('index.json'))
  if (name === 'theme') return Response.json(await asset('theme.json'))
  const item = freeNames().includes(name) ? await asset(`items/${name}.json`) : null
  if (item) {
    await countFreeFetch(name, req).catch(() => {})
    return Response.json(item)
  }
  if (isProName(name)) return Response.json({ error: `${name} is part of Detent Pro. Install it from the Pro registry with your key: npx shadcn add @detent-pro/${name}` }, { status: 403 })
  return Response.json({ error: `There's no ${name} in Detent.` }, { status: 404 })
}
