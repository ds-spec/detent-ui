// Photographs every component and block for its share image, from a running site:
//   npm run dev, then node scripts/shoot-og.mjs [http://localhost:3000] [id ...]
// Needs Playwright, kept out of the dependencies: npm i --no-save playwright && npx playwright install
// chromium. The shots are committed, so a build never needs a browser; re-run this when a piece
// changes how it looks.
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { createJiti } from 'jiti'
import { chromium } from 'playwright'

const root = process.cwd()
const [base = 'http://localhost:3000', ...only] = process.argv.slice(2)
const jiti = createJiti(import.meta.url, { alias: { '@/': path.join(root, 'src/') } })
const { ENTRIES } = await jiti.import('../src/catalog/meta.ts')
const { BLOCKS } = await jiti.import('../src/catalog/blocks.ts')
const { SHOT } = await jiti.import('../src/site/og-shot.ts')

const SLOW = new Set(['hello', 'voice-mode', 'glyph'])
const SKIP = new Set(['threads', 'agent-canvas'])
const pieces = [...ENTRIES.map((e) => ['components', e.id]), ...BLOCKS.map((b) => ['blocks', b.id])].filter(([, id]) => !SKIP.has(id) && (!only.length || only.includes(id)))
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: SHOT.width, height: SHOT.height }, deviceScaleFactor: 1, colorScheme: 'light' })
let failed = 0
for (const [kind, id] of pieces) {
  const file = path.join(root, 'public/media/og/shots', kind, `${id}.jpg`)
  mkdirSync(path.dirname(file), { recursive: true })
  try {
    await page.goto(`${base}/full/${kind}/${id}`, { waitUntil: 'networkidle', timeout: 120_000 })
    await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' })
    await page.waitForTimeout(SLOW.has(id) ? 14000 : 5000)
    await page.screenshot({ path: file, type: 'jpeg', quality: 82 })
    console.log(`${kind}/${id}`)
  } catch (error) {
    failed++
    console.error(`${kind}/${id}: ${error.message.split('\n')[0]}`)
  }
}
await browser.close()
console.log(`Shots: ${pieces.length - failed} of ${pieces.length}.`)
if (failed) process.exit(1)
