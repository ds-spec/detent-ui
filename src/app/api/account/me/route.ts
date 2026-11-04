import { getAuth } from '@/lib/account/auth'
import { purchaseFor } from '@/lib/account/keys'
import { normalEmail } from '@/lib/account/session'

/*
 * Who's signed in, for the header's menu: a name, the email, a picture when GitHub or Google gave
 * one, and the plan. Only ever to the person themselves, and never cached on the way.
 */
const PRIVATE = { 'cache-control': 'private, no-store' }

export async function GET(req: Request) {
  const session = await (await getAuth()).api.getSession({ headers: req.headers })
  const email = session?.user.emailVerified ? normalEmail(session.user.email) : null
  if (!session || !email) return Response.json(null, { status: 401, headers: PRIVATE })
  const purchase = await purchaseFor(email)
  return Response.json({ name: session.user.name?.trim() || email.split('@')[0], email, image: session.user.image ?? null, plan: purchase?.plan ?? null }, { headers: PRIVATE })
}
