import 'server-only'
import { randomBytes, randomUUID } from 'node:crypto'
import type { Plan } from '@/catalog/licence'
import { db } from './db'
import { hash, normalEmail } from './session'

/*
 * Keys and what they open. Anyone signed in can make a key; what it installs follows the email
 * behind it, so a key made before buying starts working the moment the purchase lands, and stops
 * if the purchase is refunded. Only a key's hash is kept, so it's shown once, when it's made.
 */

export const MAX_KEYS = 5
export const MAX_SEATS = 4

export type Key = { id: string; name: string; hint: string; createdAt: number; usedAt: number | null }
const RANK: Plan[] = ['pro', 'all', 'team']
const best = (plans: unknown[]) => plans.reduce<Plan | null>((top, plan) => (RANK.indexOf(plan as Plan) > (top ? RANK.indexOf(top) : -1) ? (plan as Plan) : top), null)

/** The best plan an email has: bought itself, or as a seat on someone's Team. */
export async function planFor(email: string): Promise<Plan | null> {
  const client = await db()
  const { rows } = await client.execute({
    sql: `select plan from purchase where refunded = 0 and email = ?
          union select 'team' from seat join purchase on purchase.email = seat.owner where seat.email = ? and purchase.plan = 'team' and purchase.refunded = 0`,
    args: [email, email],
  })
  return best(rows.map((row) => row.plan))
}

export async function listKeys(email: string): Promise<Key[]> {
  const { rows } = await (await db()).execute({ sql: 'select id, name, hint, created_at, used_at from key where email = ? order by created_at desc', args: [email] })
  return rows.map((row) => ({ id: String(row.id), name: String(row.name), hint: String(row.hint), createdAt: Number(row.created_at), usedAt: row.used_at === null ? null : Number(row.used_at) }))
}

/** Makes a key and returns it, the only time it's readable. Null at the limit. */
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

/** Whose key this is, noting when it was last used at most once an hour. */
export async function keyEmail(secret: string) {
  const client = await db()
  const now = Date.now()
  const { rows } = await client.execute({ sql: 'select id, email, used_at from key where hash = ?', args: [hash(secret)] })
  if (!rows.length) return null
  if (rows[0].used_at === null || Number(rows[0].used_at) < now - 3_600_000) await client.execute({ sql: 'update key set used_at = ? where id = ?', args: [now, rows[0].id] })
  return String(rows[0].email)
}

export async function listSeats(owner: string) {
  const { rows } = await (await db()).execute({ sql: 'select email from seat where owner = ? order by email', args: [owner] })
  return rows.map((row) => String(row.email))
}

/** Adds someone to a Team. Says why not, if it can't. */
export async function addSeat(owner: string, value: unknown) {
  const email = normalEmail(value)
  if (!email) return 'That doesn’t look like an email address.'
  if (email === owner) return 'You’re already on your Team.'
  if ((await planFor(owner)) !== 'team') return 'Adding people comes with Team.'
  const seats = await listSeats(owner)
  if (seats.includes(email)) return null
  if (seats.length >= MAX_SEATS) return `Team covers you and ${MAX_SEATS} others. Remove someone first.`
  await (await db()).execute({ sql: 'insert into seat (owner, email) values (?, ?)', args: [owner, email] })
  return null
}

export async function removeSeat(owner: string, email: string) {
  await (await db()).execute({ sql: 'delete from seat where owner = ? and email = ?', args: [owner, email] })
}

/** Records an order from the store. The store can send the same one twice, and that's fine. */
/** Keeps a refund once it's seen: the store may deliver or retry a paid event after it. */
export async function recordPurchase(order: { id: string; email: string; plan: Plan; refunded: boolean }) {
  await (await db()).execute({
    sql: `insert into purchase (order_id, email, plan, refunded, created_at) values (?, ?, ?, ?, ?)
          on conflict (order_id) do update set refunded = max(refunded, excluded.refunded)`,
    args: [order.id, order.email, order.plan, order.refunded ? 1 : 0, Date.now()],
  })
}
