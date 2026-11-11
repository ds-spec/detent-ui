import { readFileSync } from 'node:fs'
import { createClient } from '@libsql/client'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .map((l) => /^\s*(?:export\s+)?([A-Z0-9_]+)=(.*)$/.exec(l))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim().replace(/^(['"])(.*)\1$/, '$2')]),
)

const days = Math.max(1, Number(process.argv[2]) || 7)
const since = new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10)
const client = createClient({ url: env.DETENT_DB_URL ?? 'file:.detent/account.db', authToken: env.DETENT_DB_TOKEN })

const table = async (sql, args) => {
  try {
    return (await client.execute({ sql, args })).rows
  } catch (error) {
    if (/no such table/i.test(String(error))) return []
    throw error
  }
}

const free = await table('select item, sum(n) as n from free_install where day >= ? group by item order by n desc', [since])
const pro = await table('select item, count(*) as n from install where at >= ? group by item order by n desc', [Date.parse(`${since}T00:00:00Z`)])

const show = (title, rows) => {
  const total = rows.reduce((sum, r) => sum + Number(r.n), 0)
  console.log(`\n${title}: ${total} in the last ${days} day${days === 1 ? '' : 's'}`)
  if (rows.length) console.table(rows.map((r) => ({ piece: r.item, installs: Number(r.n) })))
}

show('Free installs', free)
show('Pro installs', pro)
