import { checkLicence } from '@/catalog/licence'
import { hasProItems, proItemByName } from '@/catalog/pro-items'
import { SITE } from '@/catalog/pro'
import { recordInstall } from '@/lib/account/keys'

const SETUP = `${SITE}/docs#pro`
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
  const kind = name.startsWith('template-') ? 'template' : item.type === 'registry:component' || item.type === 'registry:block' ? 'component' : null
  if (kind && check.email) await recordInstall(check.email, name, kind).catch(() => {})
  return Response.json(item, { headers: { 'cache-control': 'private, no-store' } })
}
