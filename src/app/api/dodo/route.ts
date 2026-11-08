import { createHmac, timingSafeEqual } from 'node:crypto'
import { planOfProduct } from '@/catalog/licence'
import { getAuth } from '@/lib/account/auth'
import { emailOfAccount, recordPurchase } from '@/lib/account/keys'
import { normalEmail } from '@/lib/account/session'

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
  data?: { payment_id?: string; is_partial?: boolean; customer?: { email?: string | null } | null; product_cart?: { product_id: string }[] | null; metadata?: Record<string, unknown> | null }
}

async function welcome(email: string) {
  try {
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

  if (type === 'payment.succeeded') {
    if (!id || !email) return Response.json({ error: 'No payment or email.' }, { status: 422 })
    const plan = data?.product_cart?.map((p) => planOfProduct(p.product_id)).find(Boolean)
    if (!plan) return Response.json({ error: 'Not a Detent product.' }, { status: 422 })
    await recordPurchase({ id, email, plan, refunded: false })
    if (!account) await welcome(email)
  } else if (type === 'dispute.lost' || (type === 'refund.succeeded' && !data?.is_partial)) {
    if (!id) return Response.json({ error: 'No payment.' }, { status: 422 })
    await recordPurchase({ id, email, plan: 'pro', refunded: true })
  }
  return new Response(null, { status: 204 })
}
