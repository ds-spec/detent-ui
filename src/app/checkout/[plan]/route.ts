import { checkoutFor } from '@/catalog/pro'
import { getAuth } from '@/lib/account/auth'
import { planFor } from '@/lib/account/keys'

const PLANS = ['pro'] as const
type Asked = (typeof PLANS)[number]

export async function GET(req: Request, { params }: { params: Promise<{ plan: string }> }) {
  const asked = (await params).plan as Asked
  const to = (path: string) => Response.redirect(new URL(path, req.url), 303)
  if (!PLANS.includes(asked)) return to('/pro')
  const session = await (await getAuth()).api.getSession({ headers: req.headers })
  const user = session?.user.emailVerified ? session.user : null
  if (!user) return to(`/account?next=/checkout/${asked}`)
  const email = user.email.toLowerCase()
  const owned = await planFor(email)
  if (owned) return to('/account')
  const store = checkoutFor(asked, { id: user.id, email })
  return store ? Response.redirect(store, 303) : to('/pro')
}
