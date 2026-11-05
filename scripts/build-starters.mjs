import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createJiti } from 'jiti'

const root = process.cwd()
const jiti = createJiti(import.meta.url, { alias: { '@/': path.join(root, 'src/') } })
const { starterFiles, zip } = await jiti.import('../src/catalog/starter.ts')
const registry = JSON.parse(readFileSync(path.join(root, '.detent/pro-registry.json'), 'utf8'))
const items = registry.items
for (const item of Object.values(items)) for (const file of item.files ?? []) if (file.shared !== undefined) file.content = registry.shared[file.shared]
const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(items).filter((n) => n.startsWith('template-')).map((n) => n.slice(9))

for (const id of ids) {
  const out = path.join(root, '.detent/starters', id)
  rmSync(out, { recursive: true, force: true })
  const files = starterFiles(id, items[`template-${id}`], items.theme)
  for (const [p, c] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(out, p)), { recursive: true })
    writeFileSync(path.join(out, p), c)
  }
  const z = zip(files, `${id}-app`)
  writeFileSync(`${out}.zip`, z)
  console.log(`${id}: ${Object.keys(files).length} files, ${(z.length / 1024).toFixed(0)} KB zipped`)
}
