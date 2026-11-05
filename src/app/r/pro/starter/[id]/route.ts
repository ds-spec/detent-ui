import { checkLicence } from '@/catalog/licence'
import type { Plan } from '@/catalog/licence'
import { proItemByName } from '@/catalog/pro-items'
import { SITE } from '@/catalog/pro'
import { starterFiles, zip } from '@/catalog/starter'
import { getAuth } from '@/lib/account/auth'
import { planFor, recordInstall } from '@/lib/account/keys'
import { normalEmail } from '@/lib/account/session'

const answer = (status: number, error: string) => Response.json({ error }, { status, headers: { 'cache-control': 'private, no-store' } })
const busy = () => answer(503, 'Couldn’t check your plan just now. Try again in a minute.')

async function planOf(req: Request): Promise<{ plan: Plan | null; email: string | null } | Response> {
  const key = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (key) {
    try {
      const check = await checkLicence(key)
      return check.ok ? { plan: check.plan, email: check.email } : answer(403, check.reason)
    } catch {
      return busy()
    }
  }
  try {
    const session = await (await getAuth()).api.getSession({ headers: req.headers })
    const email = session?.user.emailVerified ? normalEmail(session.user.email) : null
    if (!email) return answer(401, `Sign in, or enter your key to download the project. Generate one at ${SITE}/account`)
    return { plan: await planFor(email), email }
  } catch {
    return busy()
  }
}

async function send(req: Request, id: string) {
  const who = await planOf(req)
  if (who instanceof Response) return who
  if (who.plan !== 'all') return answer(403, `Templates come with Pro + Templates. See ${SITE}/pro`)
  const item = proItemByName(`template-${id}`)
  const theme = proItemByName('theme')
  if (!item || !theme) return answer(404, `There’s no ${id} template to download.`)
  if (who.email) await recordInstall(who.email, `template-${id}`, 'template').catch(() => {})
  const body = zip(starterFiles(id, item, theme), `${id}-app`)
  return new Response(body, {
    headers: {
      'content-type': 'application/zip',
      'content-disposition': `attachment; filename="${id}-app.zip"`,
      'cache-control': 'private, no-store',
    },
  })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return send(req, (await params).id.replace(/\.zip$/, ''))
}
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return send(req, (await params).id.replace(/\.zip$/, ''))
}
