// What visitors asked Detent to build next: the corner wish card and the hero's "What are you building?".
// Usage: node scripts/wishes.mjs [days]   (default 30)
// Reads only text, picks, country and time from piece_request. Never reads or prints the email column.
import { readFileSync } from 'node:fs'
import { createClient } from '@libsql/client'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .map((l) => /^\s*(?:export\s+)?([A-Z0-9_]+)=(.*)$/.exec(l))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim().replace(/^(['"])(.*)\1$/, '$2')]),
)

const days = Math.max(1, Number(process.argv[2]) || 30)
const since = Date.now() - days * 86_400_000
const client = createClient({ url: env.DETENT_DB_URL ?? 'file:.detent/account.db', authToken: env.DETENT_DB_TOKEN })

let rows = []
try {
  rows = (await client.execute({ sql: 'select text, picks, country, at from piece_request where at >= ? order by at desc', args: [since] })).rows
} catch (error) {
  console.log(`No piece_request table yet (${error.message}).`)
  process.exit(0)
}

const wishes = rows.filter((r) => String(r.picks).split(',')[0] === 'wish')
const requests = rows.filter((r) => String(r.picks).split(',')[0] !== 'wish')

const KINDS = ['components', 'screens', 'templates', 'charts']
const tally = new Map()
for (const w of wishes) for (const p of String(w.picks).split(',').slice(1)) tally.set(p, (tally.get(p) ?? 0) + 1)
const line = (label, n, of) => `  ${label.padEnd(14)} ${String(n).padStart(3)}  ${'█'.repeat(Math.round((n / Math.max(1, of)) * 24))}`

console.log(`\nLast ${days} days: ${wishes.length} wishes, ${requests.length} piece requests\n`)
if (wishes.length) {
  console.log('What to build (step 1)')
  for (const k of KINDS) console.log(line(k, tally.get(k) ?? 0, wishes.length))
  console.log('\nFor what product (step 2)')
  for (const [k, n] of [...tally].filter(([k]) => !KINDS.includes(k)).sort((a, b) => b[1] - a[1])) console.log(line(k, n, wishes.length))
  const notes = wishes.map((w) => String(w.text).split(' · ').slice(1).find((x) => !x.startsWith('for '))).filter(Boolean)
  if (notes.length) {
    console.log('\nNotes')
    for (const n of notes.slice(0, 20)) console.log(`  · ${n}`)
  }
}
if (requests.length) {
  console.log('\nPiece requests (hero)')
  for (const r of requests.slice(0, 20)) console.log(`  · ${r.text}${r.country ? `  (${r.country})` : ''}`)
}
console.log('')
