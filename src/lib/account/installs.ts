import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { db } from './db'

const BOT = /bot|crawl|spider|slurp|preview|headless|monitor/i
const AGENT = /chatgpt|claude|perplexity|openai|anthropic|mistral|gemini|copilot|cursor/i

export type Via = 'cli' | 'browser' | 'agent' | 'other'

export function viaOf(agent: string): Via | null {
  if (/^shadcn\b/i.test(agent)) return 'cli'
  if (BOT.test(agent)) return null
  if (AGENT.test(agent)) return 'agent'
  if (agent.startsWith('Mozilla/')) return 'browser'
  return 'other'
}

let salt: { day: string; value: string } | undefined

async function saltFor(day: string) {
  if (salt?.day === day) return salt.value
  const client = await db()
  await client.execute({ sql: 'insert or ignore into install_salt (day, value) values (?, ?)', args: [day, randomBytes(16).toString('hex')] })
  await client.execute({ sql: 'delete from install_salt where day < ?', args: [day] })
  const { rows } = await client.execute({ sql: 'select value from install_salt where day = ?', args: [day] })
  salt = { day, value: String(rows[0].value) }
  return salt.value
}

export async function countFreeFetch(item: string, req: Request) {
  const via = viaOf(req.headers.get('user-agent') ?? '')
  if (!via) return
  const day = new Date().toISOString().slice(0, 10)
  const client = await db()
  if (via !== 'cli') {
    await client.execute({ sql: 'insert into free_fetch (item, day, via, n) values (?, ?, ?, 1) on conflict (item, day, via) do update set n = n + 1', args: [item, day, via] })
    return
  }
  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? ''
  const who = createHash('sha256').update(`${await saltFor(day)}:${ip}`).digest('base64url').slice(0, 22)
  await client.execute({ sql: 'insert or ignore into free_installer (item, day, who) values (?, ?, ?)', args: [item, day, who] })
}
