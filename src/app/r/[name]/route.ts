import { freeNames, isProName } from '@/catalog/registry'
import { asset } from '@/lib/asset'
import { SITE } from '@/catalog/pro'
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
  if (isProName(name)) {
    const message = `${name} is part of Detent Pro, so it isn't on the free registry. Install it with: npx shadcn add @detent-pro/${name} (needs the @detent-pro registry in components.json and DETENT_PRO_KEY in .env.local, see ${SITE}/docs.md)`
    return Response.json({ error: 'Pro piece', message, code: 'PRO_ONLY' }, { status: 403 })
  }
  const message = `There's no ${name} in Detent. Every piece and its install name: ${SITE}/agents.md`
  return Response.json({ error: 'Not in Detent', message, code: 'NOT_FOUND' }, { status: 404 })
}
