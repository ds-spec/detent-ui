import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { assertAllRoutesCovered, listMarkdownRoutes, SKIPPED_ROUTES } from '../src/lib/md/registry'

const APP_DIR = join(process.cwd(), 'src/app')

function findPageRoutes(dir: string, base = ''): string[] {
  const routes: string[] = []
  const entries = readdirSync(dir)

  for (const entry of entries) {
    if (entry.startsWith('.') || entry.startsWith('_')) continue
    const full = join(dir, entry)
    const stat = statSync(full)

    if (stat.isDirectory()) {
      routes.push(...findPageRoutes(full, `${base}/${entry}`))
    } else if (entry === 'page.tsx' || entry === 'page.ts' || entry === 'page.js') {
      routes.push(base === '' ? '/' : base)
    }
  }

  return routes
}

const discovered = findPageRoutes(APP_DIR)
const missing = assertAllRoutesCovered(discovered)
const allMdRoutes = listMarkdownRoutes()

console.log('=== Markdown Route Coverage Check ===')
console.log(`Discovered public page routes: ${discovered.length}`)
console.log(`Addressable markdown routes:   ${allMdRoutes.length}`)
console.log(`Skipped route prefixes:        ${Object.keys(SKIPPED_ROUTES).length}`)
for (const [prefix, reason] of Object.entries(SKIPPED_ROUTES)) {
  console.log(`  - ${prefix}: ${reason}`)
}

if (missing.length > 0) {
  console.error('\n❌ Missing markdown renderers for the following routes:')
  for (const r of missing) {
    console.error(`  - ${r}`)
  }
  process.exit(1)
}

console.log('\n✅ All public routes are covered by markdown renderers or explicit skips.\n')
