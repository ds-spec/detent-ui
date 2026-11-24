import 'server-only'
import { block } from '@/catalog/blocks'
import { entry } from '@/catalog/meta'
import { template } from '@/catalog/templates'
import { db } from './db'
import { feedbackFor, saveFeedback } from './keys'
import { orderOfToken, type Mood } from './pulse-token'

export type Piece = { id: string; name: string }
export type Pulse = { mood: Mood; favourite: string | null; text: string; share: boolean }

const pretty = (id: string) => id.replace(/[-_]/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

export function pieceName(id: string) {
  if (id.startsWith('template-')) return template(id.slice(9))?.name ?? pretty(id.slice(9))
  return entry(id)?.name ?? block(id)?.name ?? pretty(id)
}

export async function piecesFor(email: string): Promise<Piece[]> {
  const { rows } = await (await db()).execute({ sql: 'select item from install where email = ? order by at desc limit 12', args: [email] })
  return rows.map((r) => ({ id: String(r.item), name: pieceName(String(r.item)) }))
}

export async function pulseFor(email: string): Promise<Pulse | null> {
  const [{ rows }, note] = await Promise.all([(await db()).execute({ sql: 'select mood, favourite from pulse where email = ?', args: [email] }), feedbackFor(email)])
  const r = rows[0]
  if (!r && !note) return null
  return { mood: (r?.mood as Mood) ?? 'great', favourite: r?.favourite ? String(r.favourite) : null, text: note?.text ?? '', share: note?.share ?? false }
}

export async function savePulse(email: string, change: { mood?: Mood; favourite?: string | null; text?: string; share?: boolean }) {
  const client = await db()
  if (change.mood || change.favourite !== undefined) {
    await client.execute({
      sql: `insert into pulse (email, mood, favourite, at) values (?, ?, ?, ?)
            on conflict (email) do update set mood = coalesce(?, mood), favourite = coalesce(?, favourite), at = excluded.at`,
      args: [email, change.mood ?? 'great', change.favourite ?? null, Date.now(), change.mood ?? null, change.favourite ?? null],
    })
  }
  if (change.text !== undefined && change.text.trim().length >= 3) await saveFeedback(email, change.text.trim().slice(0, 600), !!change.share)
}

export async function emailOfToken(token: string) {
  const orderId = orderOfToken(token)
  if (!orderId) return null
  const { rows } = await (await db()).execute({ sql: 'select email from purchase where order_id = ? and refunded = 0', args: [orderId] })
  return rows[0] ? String(rows[0].email) : null
}
