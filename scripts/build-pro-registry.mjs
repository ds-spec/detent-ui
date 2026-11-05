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

const uses = new Map()
for (const item of Object.values(items)) for (const file of item.files ?? []) uses.set(file.content, (uses.get(file.content) ?? 0) + 1)
const shared = []
const at = new Map()
for (const item of Object.values(items)) {
  for (const file of item.files ?? []) {
    if (uses.get(file.content) < 2) continue
    if (!at.has(file.content)) at.set(file.content, shared.push(file.content) - 1)
    file.shared = at.get(file.content)
    delete file.content
  }
}
writeFileSync(out, JSON.stringify({ items, shared }))
console.log(`Pro registry: ${Object.keys(items).length - 1} items and the theme, in .detent/pro-registry.json, with ${shared.length} shared files.`)
