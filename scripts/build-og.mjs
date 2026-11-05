import { appendFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createJiti } from 'jiti'

const root = process.cwd()
const client = path.join(root, 'dist/client')
const jiti = createJiti(import.meta.url, { jsx: { runtime: 'automatic' }, alias: { '@/': path.join(root, 'src/') } })
const ROUTES = ['', 'components', 'blocks', 'pro', 'templates', 'blocks/[slug]', 'components/[slug]', 'templates/[slug]']

let count = 0
for (const route of ROUTES) {
  const mod = await jiti.import(`../src/app/${route ? route + '/' : ''}opengraph-image.tsx`)
  const params = route.includes('[slug]') ? await mod.generateStaticParams() : [{}]
  for (const p of params) {
    const res = await mod.default({ params: Promise.resolve(p) })
    const file = path.join(client, route.replace('[slug]', p.slug ?? ''), 'opengraph-image')
    mkdirSync(path.dirname(file), { recursive: true })
    writeFileSync(file, Buffer.from(await res.arrayBuffer()))
    count++
  }
}
appendFileSync(path.join(client, '_headers'), '\n/opengraph-image\n  Content-Type: image/png\n/*/opengraph-image\n  Content-Type: image/png\n')
rmSync(path.join(root, 'dist/server/prerendered-routes'), { recursive: true, force: true })
console.log(`Share images: ${count}.`)
