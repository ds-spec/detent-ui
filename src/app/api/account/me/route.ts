import { getAuth } from '@/lib/account/auth'
import { purchaseFor } from '@/lib/account/keys'
import { normalEmail } from '@/lib/account/session'

const PRIVATE = { 'cache-control': 'private, no-store' }

export async function GET(req: Request) {
  const session = await (await getAuth()).api.getSession({ headers: req.headers })
  const email = session?.user.emailVerified ? normalEmail(session.user.email) : null
  if (!session || !email) return Response.json(null, { status: 401, headers: PRIVATE })
  const purchase = await purchaseFor(email)
  return Response.json({ id: session.user.id, name: session.user.name?.trim() || email.split('@')[0], email, image: session.user.image ?? null, plan: purchase?.plan ?? null }, { headers: PRIVATE })
}
