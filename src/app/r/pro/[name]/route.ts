import { checkLicence } from '@/catalog/licence'
import { hasProItems, proItemByName } from '@/catalog/pro-items'
import { SITE } from '@/catalog/pro'
import { PRO_ENV, PRO_REGISTRY } from '@/catalog/agent'
import { recordInstall } from '@/lib/account/keys'
import { planItem } from '@pro-server'

const SETUP = `${SITE}/docs.md`
/* Written for the coding agent that usually runs the install: what went wrong and the exact fix. The shadcn CLI
   prints "[error] message", so error is the short title and message the fix. */
const TITLE: Record<string, string> = { PRO_KEY_MISSING: 'Detent Pro key missing', KEY_CHECK_UNAVAILABLE: 'Key check unavailable', PRO_KEY_REJECTED: 'Detent Pro key rejected', NOT_FOUND: 'Not in Detent Pro' }
const answer = (status: number, message: string, code: string) =>
  Response.json({ error: TITLE[code] ?? code, message, code, docs: SETUP }, { status, headers: { 'cache-control': 'private, no-store' } })
const NEEDS_KEY = (name: string) =>
  `@detent-pro/${name} needs a Detent Pro key. Set ${PRO_ENV}=<your key> in .env.local (make one at ${SITE}/account after buying Pro), and add this to components.json: ${PRO_REGISTRY.replace(/\s+/g, ' ')}. Then run the install again from the project root. Setup: ${SETUP}`

export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const name = (await params).name.replace(/\.json$/, '')
  const key = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!key || key.startsWith('${')) return answer(401, NEEDS_KEY(name), 'PRO_KEY_MISSING')
  let check
  try {
    check = await checkLicence(key)
  } catch {
    return answer(503, 'Couldn’t check the Detent Pro key just now. Wait a minute and run the same install again.', 'KEY_CHECK_UNAVAILABLE')
  }
  if (!check.ok) return answer(403, `${check.reason} Make or copy a working key at ${SITE}/account, put it in ${PRO_ENV} in .env.local, and run the install again. Still stuck: hello@detentui.com`, 'PRO_KEY_REJECTED')
  const plan = planItem(name)
  if (plan) return Response.json(plan, { headers: { 'cache-control': 'private, no-store' } })
  const item = proItemByName(name)
  if (!item) return answer(404, hasProItems() ? `There’s no ${name} in Detent Pro. Every piece and its install name: ${SITE}/agents.md` : 'The Pro registry isn’t available on this build.', 'NOT_FOUND')
  const kind = name.startsWith('template-') ? 'template' : item.type === 'registry:component' || item.type === 'registry:block' ? 'component' : null
  if (kind && check.email) await recordInstall(check.email, name, kind).catch(() => {})
  return Response.json(item, { headers: { 'cache-control': 'private, no-store' } })
}
