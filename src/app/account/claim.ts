'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/lib/account/db'
import { currentEmail } from '@/lib/account/session'

/* A buyer who paid with one email and signed in with another sees no Pro, and may pay twice. Straight back
   from checkout they still hold the payment id, so they can move that purchase onto the account they're
   signed in to. Only for a fresh payment nobody has used yet, and only into an account without Pro. */
const FRESH = 48 * 60 * 60 * 1000

export type Claimable = { paid: string; plan: string }

const mask = (email: string) => {
  const [name, domain] = email.split('@')
  return `${name.slice(0, 2)}${'•'.repeat(Math.max(1, Math.min(4, name.length - 2)))}@${domain}`
}

async function find(paymentId: string, accountEmail: string) {
  if (!/^pay_[A-Za-z0-9]{8,64}$/.test(paymentId)) return null
  const client = await db()
  const { rows } = await client.execute({ sql: 'select email, plan, created_at from purchase where order_id = ? and refunded = 0', args: [paymentId] })
  const row = rows[0]
  if (!row) return null
  const paid = String(row.email)
  if (paid === accountEmail || Date.now() - Number(row.created_at) > FRESH) return null
  /* Already used on the address it was bought with (a key or an install), or this account already has Pro */
  const [used, owns] = await Promise.all([
    client.execute({ sql: 'select (select count(*) from key where email = ?) + (select count(*) from install where email = ?) as n', args: [paid, paid] }),
    client.execute({ sql: 'select count(*) as n from purchase where email = ? and refunded = 0', args: [accountEmail] }),
  ])
  if (Number(used.rows[0]?.n) > 0 || Number(owns.rows[0]?.n) > 0) return null
  return { paid, plan: String(row.plan) }
}

export async function claimableFor(paymentId: string | undefined, accountEmail: string): Promise<Claimable | null> {
  if (!paymentId) return null
  const found = await find(paymentId, accountEmail).catch(() => null)
  return found ? { paid: mask(found.paid), plan: found.plan } : null
}

export async function claimPurchase(form: FormData) {
  const email = await currentEmail()
  if (!email) redirect('/account')
  const paymentId = String(form.get('payment') ?? '')
  const found = await find(paymentId, email)
  if (found) await (await db()).execute({ sql: 'update purchase set email = ? where order_id = ? and email = ?', args: [email, paymentId, found.paid] })
  revalidatePath('/account')
  redirect('/account')
}
