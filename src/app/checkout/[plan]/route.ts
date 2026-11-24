import { checkoutFor } from '@/catalog/pro'
import { getAuth } from '@/lib/account/auth'
import { planFor } from '@/lib/account/keys'
import { capture, isLocal } from '@/lib/posthog-server'
import { normalEmail } from '@/lib/account/session'
import { NOTRACK, cookieOf, sourceMetadata } from '@/site/source'

const PLANS = ['pro'] as const
const BUYER = 'dt_buyer'
type Asked = (typeof PLANS)[number]

/* A guest who gave their email in BuyGate. The address arrives in the form body, never in a URL. */
export async function POST(req: Request, ctx: { params: Promise<{ plan: string }> }) {
  const form = await req.formData().catch(() => null)
  return start(req, ctx, normalEmail(form?.get('email')))
}

export async function GET(req: Request, ctx: { params: Promise<{ plan: string }> }) {
  return start(req, ctx, null)
}

async function start(req: Request, { params }: { params: Promise<{ plan: string }> }, guestEmail: string | null) {
  const asked = (await params).plan as Asked
  const to = (path: string) => Response.redirect(new URL(path, req.url), 303)
  if (!PLANS.includes(asked)) return to('/pro')

  /* Where the buyer came from rides along to Dodo, so the payment and the webhook both know it. */
  const cookies = req.headers.get('cookie')
  const meta = sourceMetadata(cookies)
  const counted = !isLocal(req) && !cookieOf(cookies, NOTRACK)
  const country = req.headers.get('cf-ipcountry') ?? undefined
  if (country) meta.country = country
  const sid = cookieOf(cookies, 'dt_ph')
  const props = { plan: asked, source: meta.source, last_source: meta.last_source, last_campaign: meta.last_campaign, country, $geoip_disable: true, $raw_user_agent: req.headers.get('user-agent') ?? undefined, ...(sid ? { $session_id: sid } : {}) }

  const session = await (await getAuth()).api.getSession({ headers: req.headers })
  const user = session?.user.emailVerified ? session.user : null
  if (!user) {
    /* That address already owns Pro: send them to sign in, not to pay twice */
    if (guestEmail && (await planFor(guestEmail))) return to('/account?have=1')
    const store = checkoutFor(asked, null, meta, guestEmail ?? undefined)
    if (!store) return to('/pro')
    if (counted && meta.visitor) await capture(meta.visitor, 'checkout_redirected', { ...props, signed_in: false, email_first: !!guestEmail })
    if (!guestEmail) return Response.redirect(store, 303)
    /* The thank-you page names the address Pro went to. It reads it from here, not from the return link,
       because the email is taken out of every URL before analytics runs. */
    return new Response(null, { status: 303, headers: { Location: store, 'Set-Cookie': `${BUYER}=${encodeURIComponent(guestEmail)}; Path=/account; Max-Age=3600; HttpOnly; Secure; SameSite=Lax` } })
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
