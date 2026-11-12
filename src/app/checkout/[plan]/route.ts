import { checkoutFor } from '@/catalog/pro'
import { getAuth } from '@/lib/account/auth'
import { planFor } from '@/lib/account/keys'
import { capture, isLocal } from '@/lib/posthog-server'
import { NOTRACK, cookieOf, sourceMetadata } from '@/site/source'

const PLANS = ['pro'] as const
type Asked = (typeof PLANS)[number]

export async function GET(req: Request, { params }: { params: Promise<{ plan: string }> }) {
  const asked = (await params).plan as Asked
  const to = (path: string) => Response.redirect(new URL(path, req.url), 303)
  if (!PLANS.includes(asked)) return to('/pro')

  /* Where the buyer came from rides along to Dodo, so the payment and the webhook both know it. */
  const cookies = req.headers.get('cookie')
  const meta = sourceMetadata(cookies)
  const counted = !isLocal(req) && !cookieOf(cookies, NOTRACK)
  const props = { plan: asked, source: meta.source, last_source: meta.last_source, last_campaign: meta.last_campaign }

  const session = await (await getAuth()).api.getSession({ headers: req.headers })
  const user = session?.user.emailVerified ? session.user : null
  if (!user) {
    const store = checkoutFor(asked, null, meta)
    if (!store) return to('/pro')
    if (counted && meta.visitor) await capture(meta.visitor, 'checkout_redirected', { ...props, signed_in: false })
    return Response.redirect(store, 303)
  }
  const email = user.email.toLowerCase()
  const owned = await planFor(email)
  if (owned) return to('/account')
  const store = checkoutFor(asked, { id: user.id, email }, meta)
  if (store) {
    if (counted) await capture(user.id, 'checkout_redirected', { ...props, signed_in: true })
    return Response.redirect(store, 303)
  }
  return to('/pro')
}
