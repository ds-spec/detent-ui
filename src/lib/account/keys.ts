import 'server-only'
import { randomBytes, randomUUID } from 'node:crypto'
import type { Plan } from '@/catalog/licence'
import { REFUND_DAYS } from '@/catalog/trust'
import { db } from './db'
import { hash } from './session'

export const MAX_KEYS = 5

export type Key = { id: string; name: string; hint: string; createdAt: number; usedAt: number | null }
const RANK: Plan[] = ['pro', 'all']
const best = (plans: unknown[]) => plans.reduce<Plan | null>((top, plan) => (RANK.indexOf(plan as Plan) > (top ? RANK.indexOf(top) : -1) ? (plan as Plan) : top), null)

export async function planFor(email: string): Promise<Plan | null> {
  const client = await db()
  const { rows } = await client.execute({
    sql: 'select plan from purchase where refunded = 0 and email = ?',
    args: [email],
  })
  return best(rows.map((row) => row.plan))
}

export async function purchaseFor(email: string): Promise<{ plan: Plan; since: number } | null> {
  const { rows } = await (await db()).execute({ sql: 'select plan, min(created_at) as since from purchase where refunded = 0 and email = ? group by plan', args: [email] })
  const plan = best(rows.map((row) => row.plan))
  const row = rows.find((r) => r.plan === plan)
  return plan && row ? { plan, since: Number(row.since) } : null
}

export async function emailOfAccount(id: string) {
  const { rows } = await (await db()).execute({ sql: 'select email from auth_user where id = ? and "emailVerified" = 1', args: [id] })
  return rows.length ? String(rows[0].email).toLowerCase() : null
}

export async function listKeys(email: string): Promise<Key[]> {
  const { rows } = await (await db()).execute({ sql: 'select id, name, hint, created_at, used_at from key where email = ? order by created_at desc', args: [email] })
  return rows.map((row) => ({ id: String(row.id), name: String(row.name), hint: String(row.hint), createdAt: Number(row.created_at), usedAt: row.used_at === null ? null : Number(row.used_at) }))
}

export async function createKey(email: string, name: string) {
  const client = await db()
  const { rows } = await client.execute({ sql: 'select count(*) as n from key where email = ?', args: [email] })
  if (Number(rows[0].n) >= MAX_KEYS) return null
  const secret = `dtnt_${randomBytes(32).toString('base64url')}`
  await client.execute({ sql: 'insert into key (id, hash, email, name, hint, created_at) values (?, ?, ?, ?, ?, ?)', args: [randomUUID(), hash(secret), email, name, secret.slice(-4), Date.now()] })
  return secret
}

export async function removeKey(email: string, id: string) {
  await (await db()).execute({ sql: 'delete from key where id = ? and email = ?', args: [id, email] })
}

export async function keyEmail(secret: string) {
  const client = await db()
  const now = Date.now()
  const { rows } = await client.execute({ sql: 'select id, email, used_at from key where hash = ?', args: [hash(secret)] })
  if (!rows.length) return null
  if (rows[0].used_at === null || Number(rows[0].used_at) < now - 3_600_000) await client.execute({ sql: 'update key set used_at = ? where id = ?', args: [now, rows[0].id] })
  return String(rows[0].email)
}

export type Usage = { components: number; templates: number; until: number; open: boolean }

export async function recordInstall(email: string, item: string, kind: 'component' | 'template') {
  await (await db()).execute({ sql: 'insert or ignore into install (email, item, kind, at) values (?, ?, ?, ?)', args: [email, item, kind, Date.now()] })
}

export async function usageFor(email: string, since: number): Promise<Usage> {
  const { rows } = await (await db()).execute({ sql: 'select kind, count(*) as n from install where email = ? group by kind', args: [email] })
  const n = (kind: string) => Number(rows.find((r) => r.kind === kind)?.n ?? 0)
  const until = since + REFUND_DAYS * 86_400_000
  return { components: n('component'), templates: n('template'), until, open: Date.now() <= until }
}

export async function recordPurchase(order: { id: string; email: string; plan: Plan; refunded: boolean }) {
  await (await db()).execute({
    sql: `insert into purchase (order_id, email, plan, refunded, created_at) values (?, ?, ?, ?, ?)
          on conflict (order_id) do update set refunded = max(refunded, excluded.refunded)`,
    args: [order.id, order.email, order.plan, order.refunded ? 1 : 0, Date.now()],
  })
}
