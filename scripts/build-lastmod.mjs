// The date each sitemap page last really changed, from git: a piece's page moves when its own source,
// examples, docs or search title change, not on every deploy. Google trusts lastmod only while it's honest.
// usage: node scripts/build-lastmod.mjs <out.json>   (run at the repo root, where .git and src/pro/.git are)
import { execFileSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createJiti } from 'jiti'

const root = process.cwd()
const out = process.argv[2] ?? path.join(root, 'src/catalog/lastmod.json')
const jiti = createJiti(import.meta.url, { alias: { '@/': path.join(root, 'src/') } })
const { FILES } = await jiti.import('../src/catalog/source.ts')
const { ENTRIES } = await jiti.import('../src/catalog/meta.ts')
const { BLOCKS } = await jiti.import('../src/catalog/blocks.ts')
const { TEMPLATES } = await jiti.import('../src/catalog/templates.ts')
const { DOCS } = await jiti.import('../src/catalog/docs.ts')

const PRO = path.join(root, 'src/pro')
const seen = new Map()

/** Last commit date (YYYY-MM-DD) touching a file or folder, in whichever repo holds it. */
function changed(abs) {
  if (seen.has(abs)) return seen.get(abs)
  const pro = abs.startsWith(PRO + path.sep)
  const cwd = pro ? PRO : root
  let day = ''
  try {
    day = execFileSync('git', ['log', '-1', '--format=%cs', '--', path.relative(cwd, abs)], { cwd, encoding: 'utf8' }).trim()
  } catch {}
  seen.set(abs, day)
  return day
}

const latest = (paths) => paths.map((p) => changed(path.join(root, p))).filter(Boolean).sort().at(-1) ?? ''
const newest = (days) => days.filter(Boolean).sort().at(-1) ?? ''

// What every piece's page shares that changes what it says: its search title.
const SHARED = ['src/catalog/search.ts']

function piece(id) {
  const own = (FILES[id] ?? []).map((f) => path.join('src/lab', f))
  const docs = DOCS[id] ? ['src/catalog/docs.ts', `src/lab/examples/${id}.tsx`, `src/pro/examples/${id}.tsx`].filter((p) => existsSync(path.join(root, p))) : []
  return latest([...own, ...docs, ...SHARED])
}

const days = {}
for (const e of ENTRIES) days[`/components/${e.id}`] = piece(e.id)
for (const b of BLOCKS) days[`/blocks/${b.id}`] = piece(b.id)
for (const t of TEMPLATES) days[`/templates/${t.id}`] = newest([piece(`template-${t.id}`), latest(['src/catalog/templates.ts'])])

const under = (prefix) => newest(Object.entries(days).filter(([p]) => p.startsWith(prefix)).map(([, d]) => d))
days['/components'] = newest([under('/components/'), latest(['src/app/components/page.tsx'])])
days['/blocks'] = newest([under('/blocks/'), latest(['src/app/blocks/page.tsx'])])
days['/templates'] = newest([under('/templates/'), latest(['src/app/templates/page.tsx'])])
days['/'] = newest([days['/components'], days['/blocks'], days['/templates'], latest(['src/app/page.tsx', 'src/site/home'])])
days['/pro'] = latest(['src/app/pro', 'src/site/pro'])
days['/ai-sdk'] = latest(['src/app/ai-sdk', 'src/site/ai'])
days['/docs'] = latest(['src/app/docs', 'src/catalog/agent.ts'])
for (const p of ['/changelog', '/system', '/licence', '/refunds', '/terms', '/privacy']) days[p] = latest([`src/app${p}`, 'src/catalog/trust.ts'])

const clean = Object.fromEntries(Object.entries(days).filter(([, d]) => d).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(out, `${JSON.stringify(clean, null, 2)}\n`)
console.log(`lastmod: ${Object.keys(clean).length} pages, newest ${newest(Object.values(clean))}`)
