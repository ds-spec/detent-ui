// Builds the Pro registry when the site is built: every Pro component, block and template as a shadcn
// registry item, written to .detent/pro-registry.json. The server bundles that file and serves an item
// only to a licence (src/app/r/pro/[name]/route.ts), so Pro source is never a public file, and the
// route needs no filesystem, which Cloudflare Workers don't have. Without Pro checked out, it writes
// an empty registry and the site builds locked.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createJiti } from 'jiti'

const root = process.cwd()
const out = path.join(root, '.detent/pro-registry.json')
mkdirSync(path.dirname(out), { recursive: true })

if (!existsSync(path.join(root, 'src/pro/index.ts'))) {
  writeFileSync(out, JSON.stringify({ items: {} }))
  console.log('Pro registry: no Detent Pro checked out, so it is empty.')
  process.exit(0)
}

const jiti = createJiti(import.meta.url, { alias: { '@/': path.join(root, 'src/') } })
const { proNames, proItem, themeFor, freeNames } = await jiti.import('../src/catalog/registry.ts')

const names = proNames()
const items = {}
for (const name of names) {
  const item = await proItem(name)
  if (item) items[name] = item
}
const theme = await themeFor([...freeNames(), ...names])
items.theme = { ...theme, description: 'The tokens and CSS every Detent Pro component, block and template is drawn with.' }
writeFileSync(out, JSON.stringify({ items }))
console.log(`Pro registry: ${Object.keys(items).length - 1} items and the theme, in .detent/pro-registry.json.`)
