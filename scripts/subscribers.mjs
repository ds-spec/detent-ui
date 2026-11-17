import { readFileSync } from 'node:fs'
import { createClient } from '@libsql/client'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .map((l) => /^\s*(?:export\s+)?([A-Z0-9_]+)=(.*)$/.exec(l))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim().replace(/^(['"])(.*)\1$/, '$2')]),
)

const url = process.env.DETENT_DB_URL ?? env.DETENT_DB_URL ?? 'file:.detent/account.db'
const client = createClient({ url, authToken: url.startsWith('file:') ? undefined : (process.env.DETENT_DB_TOKEN ?? env.DETENT_DB_TOKEN) })

const rows = async (sql, args = []) => {
  try {
    return (await client.execute({ sql, args })).rows
  } catch (error) {
    if (/no such table/i.test(String(error))) return []
    throw error
  }
}

const now = Date.now()
const today = Date.parse(new Date(now).toISOString().slice(0, 10) + 'T00:00:00Z')
const week = now - 7 * 86_400_000

const [totals] = await rows(
  `select count(*) as total,
     coalesce(sum(unsubscribed_at is null), 0) as active,
     coalesce(sum(unsubscribed_at is not null), 0) as gone,
     coalesce(sum(created_at >= ? and unsubscribed_at is null), 0) as today,
     coalesce(sum(created_at >= ? and unsubscribed_at is null), 0) as week
   from subscriber`,
  [today, week],
)
const sources = await rows(`select coalesce(source, 'other') as source, sum(unsubscribed_at is null) as active, sum(unsubscribed_at is not null) as gone from subscriber group by 1 order by active desc`)
const countries = await rows(`select coalesce(country, '?') as country, count(*) as active from subscriber where unsubscribed_at is null group by 1 order by active desc limit 20`)
const daily = await rows(`select date(created_at / 1000, 'unixepoch') as day, count(*) as joined from subscriber where created_at >= ? group by 1 order by 1`, [week])
const sent = await rows(`select slug, count(*) as sent, max(at) as last from broadcast_sent group by slug order by last desc limit 10`)

const n = (v) => Number(v ?? 0)
console.log(`\nSubscribers: ${n(totals?.active)} active, ${n(totals?.gone)} unsubscribed`)
console.log(`New: ${n(totals?.today)} today (UTC), ${n(totals?.week)} in the last 7 days`)
if (sources.length) console.table(sources.map((r) => ({ source: r.source, active: n(r.active), unsubscribed: n(r.gone) })))
if (countries.length) console.table(countries.map((r) => ({ country: r.country, active: n(r.active) })))
if (daily.length) console.table(daily.map((r) => ({ day: r.day, joined: n(r.joined) })))
if (sent.length) {
  console.log('\nBroadcasts')
  console.table(sent.map((r) => ({ slug: r.slug, sent: n(r.sent), last: new Date(n(r.last)).toISOString().slice(0, 16).replace('T', ' ') })))
}
