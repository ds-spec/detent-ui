import { createHmac, timingSafeEqual } from 'node:crypto'
import { planOfProduct } from '@/catalog/licence'
import { getAuth } from '@/lib/account/auth'
import { emailOfAccount, recordPurchase } from '@/lib/account/keys'
import { deliver } from '@/lib/account/mail'
import { normalEmail } from '@/lib/account/session'
import { welcomeMail } from '@/lib/account/welcome'
import { capture } from '@/lib/posthog-server'

const TOLERANCE = 300

function signed(body: string, headers: Headers, secret: string) {
  const id = headers.get('webhook-id')
  const timestamp = Number(headers.get('webhook-timestamp'))
  const signatures = headers.get('webhook-signature')
  if (!id || !signatures || !Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE) return false
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const want = createHmac('sha256', key).update(`${id}.${Math.floor(timestamp)}.${body}`).digest()
  return signatures.split(' ').some((entry) => {
    const [version, value] = entry.split(',', 2)
    const given = Buffer.from(value ?? '', 'base64')
    return version === 'v1' && want.length === given.length && timingSafeEqual(want, given)
  })
}

type Event = {
  type?: string
  data?: {
    payment_id?: string
    is_partial?: boolean
    total_amount?: number
    currency?: string
    settlement_amount?: number
    settlement_currency?: string
    customer?: { email?: string | null } | null
    product_cart?: { product_id: string }[] | null
    metadata?: Record<string, unknown> | null
  }
}

/* Set by /checkout from the visitor's cookies (see src/site/source.ts). */
const SOURCE_KEYS = ['source', 'medium', 'campaign', 'referrer', 'landing', 'first_seen', 'last_source', 'last_medium', 'last_campaign', 'last_content'] as const

function sourceOfPayment(metadata: Record<string, unknown> | null | undefined) {
  const out: Record<string, string> = {}
  for (const key of SOURCE_KEYS) if (typeof metadata?.[key] === 'string') out[key] = metadata[key]
  return out
}

async function welcome(email: string, signedIn: boolean) {
  try {
    if (signedIn) return await deliver({ to: email, ...welcomeMail({ signedIn: true }) })
    const auth = await getAuth()
    await auth.api.signInMagicLink({ body: { email, callbackURL: '/account' }, headers: new Headers({ 'cf-connecting-ip': 'purchase', 'x-detent-purchase': '1' }) })
  } catch (error) {
    console.error('[dodo] welcome email', error)
  }
}

export async function POST(req: Request) {
  const secret = process.env.DODO_WEBHOOK_SECRET
  const body = await req.text()
  if (!secret || !signed(body, req.headers, secret)) return Response.json({ error: 'Bad signature.' }, { status: 401 })
  const { type, data } = JSON.parse(body) as Event
  const id = data?.payment_id
  const account = typeof data?.metadata?.detent_user === 'string' ? await emailOfAccount(data.metadata.detent_user) : null
  const email = account ?? normalEmail(data?.customer?.email) ?? ''
  /* Signed-in buyer: their account id. Guest: the PostHog visitor id from checkout, so the purchase joins
     the same person as their page views. Email only when neither exists. */
  const visitor = typeof data?.metadata?.visitor === 'string' ? data.metadata.visitor : null
  const person = typeof data?.metadata?.detent_user === 'string' ? data.metadata.detent_user : (visitor ?? email)
  const from = sourceOfPayment(data?.metadata)

  if (type === 'payment.succeeded') {
    if (!id || !email) return Response.json({ error: 'No payment or email.' }, { status: 422 })
    const plan = data?.product_cart?.map((p) => planOfProduct(p.product_id)).find(Boolean)
    if (!plan) return Response.json({ error: 'Not a Detent product.' }, { status: 422 })
    await recordPurchase({ id, email, plan, refunded: false })
    const cents = data?.settlement_amount ?? data?.total_amount
    await capture(person, 'purchase', {
      plan,
      payment_id: id,
      revenue: typeof cents === 'number' ? cents / 100 : undefined,
      currency: data?.settlement_currency ?? data?.currency,
      ...from,
      $set: { email, customer: true, plan },
      $set_once: { first_source: from.source, first_campaign: from.campaign, first_referrer: from.referrer, bought_from: from.last_source ?? from.source },
    })
    await welcome(email, !!account)
  } else if (type === 'dispute.lost' || (type === 'refund.succeeded' && !data?.is_partial)) {
    if (!id) return Response.json({ error: 'No payment.' }, { status: 422 })
    await recordPurchase({ id, email, plan: 'pro', refunded: true })
    await capture(person, 'refund', { payment_id: id, reason: type })
  }
  return new Response(null, { status: 204 })
}
