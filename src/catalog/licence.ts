/*
 * Checks a key for the Pro registry. Keys are made in /account; the plan comes from what the email
 * behind the key has bought, which the store reports to /api/dodo. DETENT_PLAN_PRO and
 * DETENT_PLAN_ALL each list, comma separated, the store's product ids of that plan; any other
 * product buys nothing. DETENT_DEV_KEY, when set, is a key that always passes, for testing.
 *
 * Nothing is kept between checks, so a removed key or a refund takes effect at once.
 */

import { keyEmail, planFor } from '@/lib/account/keys'

export type Plan = 'pro' | 'all'
export type Check = { ok: true; plan: Plan; email: string | null } | { ok: false; reason: string }

const ids = (v: string | undefined) => new Set((v ?? '').split(',').map((s) => s.trim()).filter(Boolean))

/** Which plan a product in the store belongs to, or null: a product we don't list buys nothing. */
export function planOfProduct(id: string | null | undefined): Plan | null {
  if (!id) return null
  if (ids(process.env.DETENT_PLAN_ALL).has(id)) return 'all'
  return ids(process.env.DETENT_PLAN_PRO).has(id) ? 'pro' : null
}

/** Whether a key may install Pro, and which plan it's for. */
export async function checkLicence(key: string): Promise<Check> {
  const dev = process.env.DETENT_DEV_KEY
  if (dev && key === dev) return { ok: true, plan: 'all', email: null }
  const email = await keyEmail(key)
  if (!email) return { ok: false, reason: 'That key isn’t one of ours.' }
  const plan = await planFor(email)
  return plan ? { ok: true, plan, email } : { ok: false, reason: `No Pro purchase on ${email} yet.` }
}
