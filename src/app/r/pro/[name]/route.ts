import registry from '@pro-registry'
import { checkLicence } from '@/catalog/licence'
import type { RegistryItem } from '@/catalog/registry'
import { SITE } from '@/catalog/pro'

/*
 * The Pro registry: what `npx shadcn add @detent-pro/<name>` fetches once a project has the
 * registry and its licence key in components.json. Every item was built with the site
 * (scripts/build-pro-registry.mjs) and is served only to a key the store says is good; the
 * templates need a plan that includes them. Nothing here is a public file, and nothing is cached
 * on the way.
 */

const items = (registry as { items: Record<string, RegistryItem> }).items
const SETUP = `${SITE}/pro#install`
const answer = (status: number, error: string) => Response.json({ error }, { status, headers: { 'cache-control': 'private, no-store' } })

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const name = (await params).name.replace(/\.json$/, '')
  const key = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!key) return answer(401, `Detent Pro needs your licence key. Add the @detent-pro registry to components.json with your key: ${SETUP}`)
  let check
  try {
    check = await checkLicence(key)
  } catch {
    return answer(503, 'Couldn’t check your licence just now. Try again in a minute.')
  }
  if (!check.ok) return answer(403, `${check.reason} Your key is in the email from your purchase, or write to us.`)
  const item = items[name]
  if (!item) return answer(404, Object.keys(items).length ? `There’s no ${name} in Detent Pro.` : 'The Pro registry isn’t available on this build.')
  if (name.startsWith('template-') && check.plan === 'pro') return answer(403, `${item.title} comes with Pro + Templates. Upgrade at ${SITE}/pro`)
  return Response.json(item, { headers: { 'cache-control': 'private, no-store' } })
}
