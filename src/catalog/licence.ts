import { keyEmail, planFor } from '@/lib/account/keys'

export type Plan = 'pro' | 'all'
export type Check = { ok: true; plan: Plan; email: string | null } | { ok: false; reason: string }

const ids = (v: string | undefined) => new Set((v ?? '').split(',').map((s) => s.trim()).filter(Boolean))

export function planOfProduct(id: string | null | undefined): Plan | null {
  if (!id) return null
  if (ids(process.env.DETENT_PLAN_ALL).has(id)) return 'all'
  return ids(process.env.DETENT_PLAN_PRO).has(id) ? 'pro' : null
}

export async function checkLicence(key: string): Promise<Check> {
  const dev = process.env.DETENT_DEV_KEY
  if (dev && key === dev) return { ok: true, plan: 'all', email: null }
  const email = await keyEmail(key)
  if (!email) return { ok: false, reason: 'That key isn’t one of ours.' }
  const plan = await planFor(email)
  return plan ? { ok: true, plan, email } : { ok: false, reason: `No Pro purchase on ${email} yet.` }
}
