import { readFileSync } from 'node:fs'
import { createClient } from '@libsql/client'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .map((l) => /^\s*(?:export\s+)?([A-Z0-9_]+)=(.*)$/.exec(l))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim().replace(/^(['"])(.*)\1$/, '$2')]),
)

const read = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}
const titles = new Map(
  [...(read('public/_data/index.json')?.items ?? []), ...Object.values(read('.detent/pro-registry.json')?.items ?? {})].map((i) => [i.name, i.title]),
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

const people = await table('select item, count(*) as n from free_installer where day >= ? group by item order by n desc', [since])
const daily = await table('select day, count(distinct who) as n from free_installer where day >= ? group by day order by day', [since])
const fetches = await table('select item, via, sum(n) as n from free_fetch where day >= ? group by item, via', [since])
const legacy = await table('select sum(n) as n from free_install where day >= ?', [since])
const pro = await table('select item, count(*) as n from install where at >= ? group by item order by n desc', [Date.parse(`${since}T00:00:00Z`)])

const span = `in the last ${days} day${days === 1 ? '' : 's'}`
const sum = (rows) => rows.reduce((total, r) => total + Number(r.n), 0)
const name = (item) => titles.get(item) ?? item

console.log(`\nFree installs: ${sum(people)} ${span}`)
console.log('From the shadcn CLI only, one per person per component per day.')
if (people.length) console.table(people.map((r) => ({ piece: name(r.item), id: r.item, installs: Number(r.n) })))
if (daily.length) console.table(daily.map((r) => ({ day: r.day, people: Number(r.n) })))

const via = (item, kind) => Number(fetches.find((r) => r.item === item && r.via === kind)?.n ?? 0)
const looked = [...new Set(fetches.map((r) => r.item))].map((item) => ({ piece: name(item), id: item, browser: via(item, 'browser'), agent: via(item, 'agent'), other: via(item, 'other') }))
console.log(`\nOpened without installing: ${sum(fetches)} ${span}`)
console.log('Browsers, AI agents, and scripts like curl. Not installs.')
if (looked.length) console.table(looked.sort((a, b) => b.browser + b.agent + b.other - (a.browser + a.agent + a.other)))

const before = Number(legacy[0]?.n ?? 0)
if (before) console.log(`\nBefore this counter: ${before} raw requests, not people. One CLI install made two, and browsers and scripts counted too.`)

console.log(`\nPro installs: ${sum(pro)} ${span}`)
if (pro.length) console.table(pro.map((r) => ({ piece: name(r.item), id: r.item, installs: Number(r.n) })))
