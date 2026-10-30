import { createHmac, timingSafeEqual } from 'node:crypto'
import { planOfProduct } from '@/catalog/licence'
import { recordPurchase } from '@/lib/account/keys'
import { normalEmail } from '@/lib/account/session'

/*
 * What the store tells us: an order paid or refunded. This is what makes a key work, so a request
 * only counts with a good Standard Webhooks signature from POLAR_WEBHOOK_SECRET. Polar signs with
 * the secret's bytes on older endpoints and its decoded base64 on newer ones, so both are tried.
 */

const TOLERANCE = 300

function signed(body: string, headers: Headers, secret: string) {
  const id = headers.get('webhook-id')
  const timestamp = Number(headers.get('webhook-timestamp'))
  const signatures = headers.get('webhook-signature')
  if (!id || !signatures || !Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > TOLERANCE) return false
  const keys = [Buffer.from(secret), Buffer.from(secret.replace(/^whsec_/, ''), 'base64')]
  const expected = keys.map((key) => createHmac('sha256', key).update(`${id}.${Math.floor(timestamp)}.${body}`).digest())
  return signatures.split(' ').some((entry) => {
    const [version, value] = entry.split(',', 2)
    const given = Buffer.from(value ?? '', 'base64')
    return version === 'v1' && expected.some((want) => want.length === given.length && timingSafeEqual(want, given))
  })
}

type Event = { type?: string; data?: { id?: string; status?: string; product_id?: string | null; customer?: { email?: string | null } } }

export async function POST(req: Request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET
  const body = await req.text()
  if (!secret || !signed(body, req.headers, secret)) return Response.json({ error: 'Bad signature.' }, { status: 401 })
  const { type, data } = JSON.parse(body) as Event
  if (type !== 'order.paid' && type !== 'order.refunded') return new Response(null, { status: 204 })
  const email = normalEmail(data?.customer?.email)
  if (!data?.id || !email) return Response.json({ error: 'No order or email.' }, { status: 422 })
  // A partial refund keeps the licence; only a full one ends it.
  await recordPurchase({ id: data.id, email, plan: planOfProduct(data.product_id), refunded: data.status === 'refunded' })
  return new Response(null, { status: 204 })
}
