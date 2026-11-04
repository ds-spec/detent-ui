import { checkoutFor } from '@/catalog/pro'
import { getAuth } from '@/lib/account/auth'

/*
 * Every Buy button lands here. Pro belongs to an account, so a buyer signs in first (which makes
 * their account), comes back here, and goes on to the store with that account's email filled in and
 * locked. When Dodo reports the payment, /api/dodo puts Pro on the account, and the store sends
 * them back to /account to make their key.
 */
export async function GET(req: Request, { params }: { params: Promise<{ plan: string }> }) {
  const plan = (await params).plan
  if (plan !== 'pro' && plan !== 'all') return Response.redirect(new URL('/pro', req.url), 303)
  const session = await (await getAuth()).api.getSession({ headers: req.headers })
  const user = session?.user.emailVerified ? session.user : null
  if (!user) return Response.redirect(new URL(`/account?next=/checkout/${plan}`, req.url), 303)
  const store = checkoutFor(plan, { id: user.id, email: user.email.toLowerCase() })
  return Response.redirect(store ?? new URL('/pro', req.url), 303)
}
