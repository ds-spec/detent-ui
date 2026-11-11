import { readFileSync } from 'node:fs'
import { createClient } from '@libsql/client'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .map((l) => /^\s*(?:export\s+)?([A-Z0-9_]+)=(.*)$/.exec(l))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim().replace(/^(['"])(.*)\1$/, '$2')]),
)

const client = createClient({ url: env.DETENT_DB_URL ?? 'file:.detent/account.db', authToken: env.DETENT_DB_TOKEN })

let rows = []
try {
  rows = (await client.execute('select email, text, share, at from feedback order by at desc')).rows
} catch (error) {
  if (!/no such table/i.test(String(error))) throw error
}

console.log(`\nFeedback: ${rows.length}`)
for (const r of rows) {
  const when = new Date(Number(r.at)).toISOString().slice(0, 16).replace('T', ' ')
  console.log(`\n${r.email} · ${when} · ${Number(r.share) ? 'ok to show on the site' : 'private'}\n${r.text}`)
}
