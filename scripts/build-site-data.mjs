import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createJiti } from 'jiti'
import { codeToHtml } from 'shiki'

delete process.env.DETENT_UNLOCK
const root = process.cwd()
const dir = path.join(root, '.detent')
mkdirSync(dir, { recursive: true })
writeFileSync(path.join(dir, 'og-font.json'), JSON.stringify({ data: readFileSync(path.join(root, 'src/site/fonts/geist-og.ttf')).toString('base64') }))

const jiti = createJiti(import.meta.url, { alias: { '@/': path.join(root, 'src/') } })
const { EXAMPLES } = await jiti.import('../src/catalog/examples.ts')
const { AI_FILES } = await jiti.import('../src/site/ai/snippets.ts')
const { FILES } = await jiti.import('../src/catalog/source.ts')
const { buildSource } = await jiti.import('../src/catalog/source-build.ts')
const { isProBlock, isProComponent } = await jiti.import('../src/catalog/pro.ts')
const { apiFromSource } = await jiti.import('../src/catalog/api.ts')
const notes = JSON.parse(readFileSync(path.join(root, 'src/catalog/notes.json'), 'utf8'))
const { freeNames, registryItem, registryTheme, registryIndex } = await jiti.import('../src/catalog/registry.ts')
const { demoMap, demoSource } = await jiti.import('../src/catalog/demo-source.ts')
const { AGENT_EXAMPLES } = await jiti.import('../src/catalog/agent-examples.ts')
const { ENTRIES } = await jiti.import('../src/catalog/meta.ts')

const source = {}
const api = {}
for (const id of Object.keys(FILES)) {
  source[id] = await buildSource(id)
  const f = FILES[id][0]
  let code = null
  try { code = readFileSync(path.join(root, 'src/lab', f), 'utf8') } catch {}
  api[id] = code === null ? null : apiFromSource(code, f, notes[id])
}
const linesFile = path.join(root, 'src/catalog/lines.json')
const lines = JSON.parse(readFileSync(linesFile, 'utf8'))
for (const [id, files] of Object.entries(source)) {
  if (!isProComponent(id) && !isProBlock(id) && !id.startsWith('template-')) continue
  const total = files.reduce((n, f) => n + f.lines, 0)
  if (total && files.every((f) => f.lines)) lines[id] = total
}
writeFileSync(linesFile, `${JSON.stringify(Object.fromEntries(Object.entries(lines).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`)
const items = {}
for (const name of freeNames()) {
  const item = await registryItem(name)
  if (item) items[name] = item
}
const aiFiles = await Promise.all(AI_FILES.map(async (f) => ({ ...f, html: await codeToHtml(f.code, { lang: 'tsx', themes: { light: 'github-light', dark: 'github-dark-default' }, defaultColor: false }) })))
const data = path.join(root, 'public/_data')
rmSync(data, { recursive: true, force: true })
const put = (file, value) => {
  mkdirSync(path.dirname(path.join(data, file)), { recursive: true })
  writeFileSync(path.join(data, file), JSON.stringify(value))
}
for (const [id, files] of Object.entries(source)) put(`source/${id}.json`, files)
for (const [id, props] of Object.entries(api)) if (props) put(`api/${id}.json`, props)
for (const [name, item] of Object.entries(items)) put(`items/${name}.json`, item)
put('theme.json', await registryTheme())
put('index.json', await registryIndex())
put('ai-files.json', aiFiles)
for (const [id, code] of Object.entries(EXAMPLES)) {
  put(`examples/${id}.json`, { code, html: await codeToHtml(code, { lang: 'tsx', themes: { light: 'github-light', dark: 'github-dark-default' }, defaultColor: false }) })
}
/* the example each piece's markdown shows an agent: a written one, else the site demo when it has no autoplay */
const demos = demoMap()
const SCRIPTED = /lib\/hand|blocks\/kit\/director|ui\/Orb|ui\/DetentMark/
let shown = 0
for (const e of ENTRIES) {
  let code = EXAMPLES[e.id] ?? AGENT_EXAMPLES[e.id] ?? null
  if (!code && demos[e.id]) {
    const name = `${e.name.replace(/[^A-Za-z0-9]+(.)?/g, (_, c) => (c ? c.toUpperCase() : '')).replace(/^./, (c) => c.toUpperCase())}Example`
    const demo = demoSource(demos[e.id].rel, demos[e.id].name, name)
    if (demo && !SCRIPTED.test(demo)) code = demo
  }
  if (code) {
    put(`usage/${e.id}.json`, { code })
    shown++
  }
}
console.log(`Site data: ${Object.keys(source).length} sources, ${Object.keys(items).length} free items, ${shown} usage examples.`)
