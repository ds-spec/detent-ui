/*
 * Checks a licence key with the store that sold it, for the Pro registry. The store is set by
 * DETENT_LICENSE_PROVIDER: 'polar' (with POLAR_ORGANIZATION_ID) or 'lemonsqueezy'. Which plan a key
 * is for comes from the store's ids: DETENT_PLAN_ALL and DETENT_PLAN_TEAM each list, comma
 * separated, the benefit ids (Polar) or product and variant ids (Lemon Squeezy) of that plan; any
 * other valid key is Pro. DETENT_DEV_KEY, when set, is a key that always passes, for testing.
 *
 * Answers are kept for a few minutes, so an install that fetches many items asks the store once.
 */

export type Plan = 'pro' | 'all' | 'team'
export type Check = { ok: true; plan: Plan } | { ok: false; reason: string }

const ids = (v: string | undefined) => new Set((v ?? '').split(',').map((s) => s.trim()).filter(Boolean))
const planOf = (...found: (string | number | null | undefined)[]): Plan => {
  const all = ids(process.env.DETENT_PLAN_ALL)
  const team = ids(process.env.DETENT_PLAN_TEAM)
  const has = (set: Set<string>) => found.some((x) => x != null && set.has(String(x)))
  return has(team) ? 'team' : has(all) ? 'all' : 'pro'
}

async function polar(key: string): Promise<Check> {
  const organization_id = process.env.POLAR_ORGANIZATION_ID
  if (!organization_id) return { ok: false, reason: 'The store isn’t set up yet.' }
  const res = await fetch('https://api.polar.sh/v1/customer-portal/license-keys/validate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ key, organization_id }),
  })
  if (res.status === 404 || res.status === 422) return { ok: false, reason: 'That licence key isn’t one of ours.' }
  if (!res.ok) throw new Error(`Polar answered ${res.status}`)
  const k = (await res.json()) as { status?: string; benefit_id?: string; expires_at?: string | null }
  if (k.status !== 'granted') return { ok: false, reason: `That licence key is ${k.status ?? 'not active'}.` }
  if (k.expires_at && new Date(k.expires_at) < new Date()) return { ok: false, reason: 'That licence key has expired.' }
  return { ok: true, plan: planOf(k.benefit_id) }
}

async function lemonsqueezy(key: string): Promise<Check> {
  const res = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ license_key: key }),
  })
  if (res.status >= 500) throw new Error(`Lemon Squeezy answered ${res.status}`)
  const k = (await res.json()) as { valid?: boolean; error?: string | null; license_key?: { status?: string }; meta?: { product_id?: number; variant_id?: number } }
  if (!k.valid) return { ok: false, reason: k.license_key?.status && k.license_key.status !== 'active' ? `That licence key is ${k.license_key.status}.` : 'That licence key isn’t one of ours.' }
  return { ok: true, plan: planOf(k.meta?.product_id, k.meta?.variant_id) }
}

const seen = new Map<string, { check: Check; until: number }>()

/** Whether a key may install Pro, and which plan it's for. */
export async function checkLicence(key: string): Promise<Check> {
  const dev = process.env.DETENT_DEV_KEY
  if (dev && key === dev) return { ok: true, plan: 'team' }
  const kept = seen.get(key)
  if (kept && kept.until > Date.now()) return kept.check
  const provider = process.env.DETENT_LICENSE_PROVIDER
  const check = provider === 'polar' ? await polar(key) : provider === 'lemonsqueezy' ? await lemonsqueezy(key) : { ok: false as const, reason: 'The store isn’t set up yet.' }
  // A good answer is kept ten minutes, a refusal one, so a key bought a moment ago works straight away.
  seen.set(key, { check, until: Date.now() + (check.ok ? 10 : 1) * 60_000 })
  if (seen.size > 500) seen.delete(seen.keys().next().value!)
  return check
}
