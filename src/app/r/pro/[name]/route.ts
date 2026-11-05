import { checkLicence } from '@/catalog/licence'
import { hasProItems, proItemByName } from '@/catalog/pro-items'
import { SITE } from '@/catalog/pro'

/*
 * The Pro registry: what `npx shadcn add @detent-pro/<name>` fetches once a project has the
 * registry and a key from /account in components.json. Every item was built with the site
 * (scripts/build-pro-registry.mjs) and is served only to a key whose email has bought Pro; the
 * templates need a plan that includes them. Nothing here is a public file, and nothing is cached
 * on the way.
 */
import { recordInstall } from '@/lib/account/keys'

const SETUP = `${SITE}/pro#install`
const answer = (status: number, error: string) => Response.json({ error }, { status, headers: { 'cache-control': 'private, no-store' } })

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const name = (await params).name.replace(/\.json$/, '')
  const key = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!key) return answer(401, `Detent Pro needs your key. Add the @detent-pro registry to components.json with your key: ${SETUP}`)
  let check
  try {
    check = await checkLicence(key)
  } catch {
    return answer(503, 'Couldn’t check your key just now. Try again in a minute.')
  }
  if (!check.ok) return answer(403, `${check.reason} Your keys are at ${SITE}/account, or write to us.`)
  const item = proItemByName(name)
  if (!item) return answer(404, hasProItems() ? `There’s no ${name} in Detent Pro.` : 'The Pro registry isn’t available on this build.')
  if (name.startsWith('template-') && check.plan === 'pro') return answer(403, `${item.title} comes with Pro + Templates. Upgrade at ${SITE}/pro`)
  const kind = name.startsWith('template-') ? 'template' : item.type === 'registry:component' || item.type === 'registry:block' ? 'component' : null
  if (kind && check.email) await recordInstall(check.email, name, kind).catch(() => {})
  return Response.json(item, { headers: { 'cache-control': 'private, no-store' } })
}
