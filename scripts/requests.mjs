// What people asked the homepage for that Detent didn't have. Prints the words, newest first; emails are
// counted, never printed. Run: node scripts/requests.mjs [days=30]
import { createClient } from '@libsql/client'
import fs from 'node:fs'

const env = Object.fromEntries(
  (fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8') : '')
    .split('\n')
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^["']|["']$/g, '')]),
)
const db = createClient({ url: process.env.DETENT_DB_URL ?? env.DETENT_DB_URL, authToken: process.env.DETENT_DB_TOKEN ?? env.DETENT_DB_TOKEN })
const days = Number(process.argv[2] ?? 30)
const since = Date.now() - days * 864e5
const has = await db.execute("select name from sqlite_master where type = 'table' and name = 'piece_request'")
if (!has.rows.length) {
  console.log('No requests yet.')
  process.exit(0)
}
const { rows } = await db.execute({ sql: 'select text, picks, email is not null as mail, country, at from piece_request where at > ? order by at desc', args: [since] })
console.log(`${rows.length} requests in ${days} days, ${rows.filter((r) => r.mail).length} want a note when it ships\n`)
for (const r of rows) console.log(new Date(Number(r.at)).toISOString().slice(0, 10), r.country ?? '--', r.mail ? '✉' : ' ', JSON.stringify(r.text), r.picks ? `(matched: ${r.picks})` : '(no match)')
