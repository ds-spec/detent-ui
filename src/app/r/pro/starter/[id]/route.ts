import registry from '@pro-registry'
import { checkLicence } from '@/catalog/licence'
import type { RegistryItem } from '@/catalog/registry'
import { SITE } from '@/catalog/pro'
import { starterFiles, zip } from '@/catalog/starter'

/*
 * A template as a whole project, zipped: what the Download button on a template's page fetches,
 * and what `curl -H "Authorization: Bearer $DETENT_PRO_KEY"` gets too. Made from the Pro registry
 * on request, for a key whose plan includes the templates; nothing here is a public file.
 */

const items = (registry as { items: Record<string, RegistryItem> }).items
const answer = (status: number, error: string) => Response.json({ error }, { status, headers: { 'cache-control': 'private, no-store' } })

async function send(req: Request, id: string) {
  const key = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!key) return answer(401, 'Enter your licence key to download the project. It’s in the email from your purchase.')
  let check
  try {
    check = await checkLicence(key)
  } catch {
    return answer(503, 'Couldn’t check your licence just now. Try again in a minute.')
  }
  if (!check.ok) return answer(403, check.reason)
  if (check.plan === 'pro') return answer(403, `Templates come with Pro + Templates. Upgrade at ${SITE}/pro`)
  const item = items[`template-${id}`]
  if (!item || !items.theme) return answer(404, `There’s no ${id} template to download.`)
  const body = zip(starterFiles(id, item, items.theme), `${id}-app`)
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
