import { existsSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { BLOCKS } from '@/catalog/blocks'
import { ENTRIES } from './meta'
import { FILES } from './source'
import { FREE_BLOCKS, KITS, SITE, isProBlock, isProComponent } from './pro'
import { TEMPLATES } from './templates'

/*
 * The public shadcn registry, built from the source as it is. Each free item carries every file
 * it imports, with the imports rewritten so the whole set lands in components/detent/ and
 * resolves through the project's `@/` alias, and names the npm packages it needs. One `theme`
 * item carries the design tokens and the CSS the free items actually use, worked out from what
 * their files reference, so a stylesheet change reaches the registry without anyone listing it.
 *
 * Two of our token names mean something else in a shadcn project: `accent` (theirs is a grey
 * hover, ours is the brand) and `card`. Shipped files say `dt-accent` and `dt-card` instead, so
 * installing Detent never repaints the app it's installed into.
 */

const ROOT = process.cwd()
const SRC = path.join(ROOT, 'src')
const BASE = 'components/detent'
const SCHEMA = 'https://ui.shadcn.com/schema/registry-item.json'

export type RegistryFile = { path: string; type: string; target: string; content: string }
export type RegistryItem = {
  $schema: string
  name: string
  type: string
  title: string
  description: string
  author: string
  dependencies?: string[]
  registryDependencies?: string[]
  files: RegistryFile[]
  css?: CssTree
  docs?: string
}
type CssTree = { [key: string]: string | CssTree }

/** Everything anyone can install, by name: free components, the free blocks and kits. */
export function freeNames() {
  return [...ENTRIES.filter((e) => !isProComponent(e.id)).map((e) => e.id), ...FREE_BLOCKS, ...Object.keys(KITS)]
}

/** The name of a Pro thing, so the registry can say so instead of a plain not-found. */
export const isProName = (name: string) => isProComponent(name) || isProBlock(name) || name.startsWith('template-')

/** Everything a licence installs, by name: Pro components, the Pro blocks, and the templates. */
export function proNames() {
  return [...ENTRIES.filter((e) => isProComponent(e.id)).map((e) => e.id), ...BLOCKS.filter((b) => isProBlock(b.id)).map((b) => b.id), ...TEMPLATES.map((t) => `template-${t.id}`)].filter((n) => !!FILES[n]?.length)
}

/** Renames the two tokens that clash with shadcn's, in source and in CSS alike. */
export const brand = (text: string) =>
  text
    .replace(/--(color-)?(accent|card)\b/g, '--$1dt-$2')
    .replace(/\b(bg|text|border|ring|ring-offset|outline|fill|stroke|from|via|to|decoration|caret|divide|shadow|accent)-(accent|card)\b(?![-\w])/g, '$1-dt-$2')

/** A template's routes: what lands in the buyer's own app/ folder rather than under components. */
const ROUTE = /^pro\/templates\/[^/]+\/(app\/.+)$/

/** Where a source file lands in the buyer's project, relative to their root (or src/). */
const targetOf = (rel: string) =>
  rel.match(ROUTE)?.[1] ??
  `${BASE}/${rel
    .replace(/^lab\//, '')
    .replace(/^pro\/components\//, 'components/')
    .replace(/^pro\/blocks\//, 'blocks/')
    .replace(/^pro\/ui\//, 'blocks/kit/')
    // Templates land under their own names, never under the "pro" folder this repo keeps them in.
    .replace(/^pro\/templates\//, 'templates/')
    .replace(/^pro\/chat\//, 'templates/detent/')
    .replace(/^pro\/ai\//, 'ai/')}`

const EXT = ['', '.tsx', '.ts', '/index.tsx', '/index.ts']
/** Resolves an import to a file under src, or null when it isn't one of ours. */
function resolveLocal(from: string, spec: string): string | null {
  let abs: string
  if (spec.startsWith('@/')) abs = path.join(SRC, spec.slice(2))
  else if (spec.startsWith('.')) abs = path.join(SRC, path.dirname(from), spec)
  else return null
  for (const ext of EXT) {
    const p = abs + ext
    if (existsSync(p) && statSync(p).isFile()) return path.relative(SRC, p)
  }
  return null
}

const SPEC = /(from\s+|import\s*\(\s*|import\s+)(['"])([^'"\n]+)\2/g
const BUILT_IN = new Set(['react', 'react-dom', 'next'])
const packageOf = (spec: string) => (spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0])

/** Every file an entry needs, following its imports, and the packages they come from. */
async function gather(entry: string[]) {
  const files = new Map<string, string>()
  const deps = new Set<string>()
  const queue = [...entry]
  while (queue.length) {
    const rel = queue.shift()!
    if (files.has(rel)) continue
    const code = await readFile(path.join(SRC, rel), 'utf8')
    files.set(rel, code)
    for (const m of code.matchAll(SPEC)) {
      const spec = m[3]
      const local = resolveLocal(rel, spec)
      if (local) queue.push(local)
      else if (!spec.startsWith('.') && !spec.startsWith('@/')) {
        const pkg = packageOf(spec)
        // Only real packages: a string in the code that merely looks like an import is left alone.
        if (!BUILT_IN.has(pkg) && existsSync(path.join(ROOT, 'node_modules', pkg))) deps.add(pkg)
      }
    }
  }
  return { files, deps }
}

/** Points every local import at where the file will live in the buyer's project. */
const rewrite = (rel: string, code: string) =>
  code.replace(SPEC, (all, lead: string, q: string, spec: string) => {
    const local = resolveLocal(rel, spec)
    if (!local) return all
    return `${lead}${q}@/${targetOf(local).replace(/\.(tsx|ts)$/, '').replace(/\/index$/, '')}${q}`
  })

const OPENING = /^\s*(?:\/\*[\s\S]*?\*\/\s*|\/\/[^\n]*\n\s*)+/

/**
 * One file as the CLI should write it. The CLI drops any comment before a file's first
 * statement, and ours open with the notes that explain them. A file with nothing for the CLI to
 * rewrite (no client directive, no `@/` import) goes as a plain file, word for word; any other
 * that opens with notes has them moved to just under its imports, where they survive.
 */
function shipped(rel: string, content: string, kind: string): RegistryFile {
  const file = { path: targetOf(rel), target: targetOf(rel) }
  // Routes go in as pages, so the CLI puts them in the app folder (src/app when there's a src).
  const type = ROUTE.test(rel) ? 'registry:page' : kind
  const opening = content.match(OPENING)?.[0]
  if (!opening || /^\s*['"]use client['"]/.test(content)) return { ...file, type, content }
  if (!/from\s+['"]@\//.test(content)) return { ...file, type: ROUTE.test(rel) ? type : 'registry:file', content }
  const rest = content.slice(opening.length)
  const imports = rest.match(/^(?:import[^\n]*\n(?:[ \t]+[^\n]*\n)*\}?[^\n]*\n?)*/)?.[0] ?? ''
  return { ...file, type, content: `${imports.trimEnd()}\n\n${opening.trim()}\n${rest.slice(imports.length)}` }
}

/** The source files an item starts from, relative to src. */
function entryOf(name: string): string[] | null {
  const listed = FILES[name]
  if (!listed?.length) return null
  // The catalog lists files relative to src/lab. Each is a starting point, and what they import is
  // followed from there: most list one file that imports the rest, a set like Buttons lists them all.
  return listed.map((f) => path.normalize(path.join('lab', f)))
}

const describe = (name: string) => {
  if (name.startsWith('template-')) {
    const t = TEMPLATES.find((x) => `template-${x.id}` === name)
    return { title: t?.name ?? name.slice(9), description: t?.line ?? 'A Detent template.', type: 'registry:block' }
  }
  const e = ENTRIES.find((x) => x.id === name)
  if (e) return { title: e.name, description: e.line, type: 'registry:component' }
  const b = BLOCKS.find((x) => x.id === name)
  if (b) return { title: b.name, description: b.line, type: 'registry:block' }
  const k = KITS[name]
  if (k) return { title: k.name, description: k.line, type: 'registry:block' }
  return null
}

export const itemUrl = (name: string) => `${SITE}/r/${name}.json`

/** One item built from its source, its theme named by `theme`. */
async function build(name: string, theme: string): Promise<RegistryItem | null> {
  const about = describe(name)
  if (!about) return null
  const entry = entryOf(name)
  if (!entry) return null
  const { files, deps } = await gather(entry)
  return {
    $schema: SCHEMA,
    name,
    ...about,
    author: 'Detent',
    dependencies: [...deps].sort(),
    registryDependencies: [theme],
    files: [...files].map(([rel, code]) => shipped(rel, brand(rewrite(rel, code)), about.type)),
  }
}

/** One free item, ready to serve, or null if it isn't free. */
export async function registryItem(name: string): Promise<RegistryItem | null> {
  'use cache'
  if (!freeNames().includes(name)) return null
  if (name === 'theme') return null
  const about = describe(name)
  if (!about) return null
  if (KITS[name])
    return { $schema: SCHEMA, name, ...about, author: 'Detent', registryDependencies: KITS[name].items.map(itemUrl), files: [] }
  return build(name, itemUrl('theme'))
}

/**
 * One Pro item. It's built when the site is, by scripts/build-pro-registry.mjs, and served only to a
 * licence; its theme is the Pro registry's own, which also carries the CSS the Pro pieces use.
 */
export async function proItem(name: string): Promise<RegistryItem | null> {
  if (!proNames().includes(name)) return null
  return build(name, '@detent-pro/theme')
}

/* ── The theme ─────────────────────────────────────────────────── */

/** One top-level statement of a stylesheet: its text with the comments before it, and its head. */
type Stmt = { head: string; text: string; body?: string }

/** Splits CSS into top-level statements, keeping each one's comments, and skipping braces inside strings and comments. */
function statements(src: string): Stmt[] {
  const out: Stmt[] = []
  let start = 0
  let depth = 0
  let open = -1
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (ch === '/' && src[i + 1] === '*') {
      i = src.indexOf('*/', i + 2) + 1
      continue
    }
    if (ch === '"' || ch === "'") {
      i = src.indexOf(ch, i + 1)
      continue
    }
    if (ch === '{') {
      if (depth === 0) open = i
      depth++
    } else if (ch === '}' || (ch === ';' && depth === 0)) {
      if (ch === '}') depth--
      if (depth > 0) continue
      const text = src.slice(start, i + 1)
      const bare = text.replace(/\/\*[\s\S]*?\*\//g, '').trim()
      const head = (ch === '}' ? bare.slice(0, bare.indexOf('{')) : bare.replace(/;$/, '')).trim().replace(/\s+/g, ' ')
      out.push({ head, text, body: ch === '}' ? src.slice(open + 1, i) : undefined })
      start = i + 1
    }
  }
  return out
}

const LIGHT = /^(:root, )?\[data-theme="light"\]$|^:root$/
const DARK = /^\[data-theme="dark"\]$/
/** Global rules that would restyle the buyer's whole page, and the site's own: theirs to keep, ours to keep home. */
const SKIP = /^(@import|@custom-variant|@layer base|html|body|html, body|::selection|\*|\.code\b)/

/** Every word in a piece of text. */
const wordsIn = (text: string) => new Set(text.match(/[A-Za-z_][\w-]*/g) ?? [])
/** The words inside the code's strings, where class names and animation names live; comments and identifiers don't count. */
const stringWords = (code: string) => wordsIn((code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').match(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g) ?? []).join(' '))

/** Whether a rule's selector or name is something the code uses. */
function used(head: string, words: Set<string>) {
  if (head.startsWith('@keyframes ')) return words.has(head.slice(11).trim())
  if (head.startsWith('@utility ')) return words.has(head.slice(9).trim())
  if (head.startsWith('@property ')) return words.has(head.slice(12).trim())
  const classes = head.match(/\.([A-Za-z_][\w-]*)/g)
  if (!classes) return false
  // A rule applies when every class in it is used: `.pro-app .chip` needs both.
  return classes.every((c) => words.has(c.slice(1)))
}

/** Dark tokens follow both conventions: our `data-theme` and the `.dark` class shadcn projects use. */
const darkened = (text: string) => text.replace(/\[data-theme="dark"\](?=[^{]*\{)/g, ':is(.dark, [data-theme="dark"])')

/** The statements a stylesheet keeps for the code that uses it, recursing into media queries. */
function keep(stmts: Stmt[], words: Set<string>): string[] {
  const out: string[] = []
  for (const st of stmts) {
    const { head } = st
    if (!head || SKIP.test(head)) continue
    if (head.startsWith('@theme')) {
      // Fonts stay the buyer's: the components set no typeface of their own.
      out.push(st.text.replace(/\n[ \t]*--font-(sans|mono):[^;]*;/g, ''))
    } else if (LIGHT.test(head) || DARK.test(head)) out.push(darkened(bridged(st.text)))
    else if ((head.startsWith('@media') || head.startsWith('@supports')) && st.body !== undefined) {
      const inner = keep(statements(st.body), words)
      if (inner.length) out.push(`\n\n${head} {${inner.map((t) => t.replace(/^\n+/, '\n')).join('')}\n}`)
    } else if (st.body !== undefined && used(head, words)) out.push(darkened(st.text))
  }
  return out
}

/*
 * The bridge to the buyer's theme. Anyone installing with `shadcn add` has shadcn's variables, so
 * each Detent token points at its shadcn counterpart first and keeps Detent's own value as the
 * fallback: change your --primary and Detent's accent follows; switch to .dark and so does
 * Detent. The in-between inks are mixed from yours. Tokens shadcn has no word for (the AI
 * colours, ok and warn, elevations) stay Detent's. Placeholders stand in for shadcn's own
 * --accent and --card until after the rename, which would otherwise take them for ours.
 */
const BRIDGE: Record<string, (own: string) => string> = {
  '--bg': (v) => `var(--background, ${v})`,
  '--surface': (v) => `var(--background, ${v})`,
  '--surface-2': (v) => `var(--muted, ${v})`,
  '--surface-3': (v) => `var(__SHADCN_ACCENT__, ${v})`,
  '--line': (v) => `var(--border, ${v})`,
  '--line-strong': (v) => `var(--input, ${v})`,
  '--ink': (v) => `var(--foreground, ${v})`,
  '--ink-2': (v) => `color-mix(in oklch, var(--foreground, ${v}) 42%, var(--muted-foreground, ${v}))`,
  '--ink-3': (v) => `var(--muted-foreground, ${v})`,
  '--quiet': (v) => `color-mix(in oklch, var(--muted-foreground, ${v}) 72%, var(--background, transparent))`,
  '--danger': (v) => `var(--destructive, ${v})`,
  '--accent': (v) => `var(--primary, ${v})`,
  '--accent-ink': (v) => `color-mix(in oklch, var(--primary, ${v}) 86%, var(--foreground, ${v}))`,
  '--card': (v) => `var(__SHADCN_CARD__, ${v})`,
  '--sheet': (v) => `var(--popover, ${v})`,
}
/** Points a token block's declarations at the buyer's shadcn variables, keeping ours as fallbacks. */
const bridged = (text: string) =>
  text.replace(/(^|\n)([ \t]*)(--[\w-]+):\s*([^;]+);/g, (all, nl: string, pad: string, name: string, value: string) => {
    if (!(name in BRIDGE) || value.includes('var(--')) return all
    return `${nl}${pad}${name}: ${BRIDGE[name](value.trim())};`
  })

/** The tokens and the CSS every free item needs: one stylesheet, its comments intact, beside the components. */
export async function registryTheme(): Promise<RegistryItem> {
  'use cache'
  return themeFor(freeNames())
}

/** The theme for a set of items: the tokens, and the CSS their code uses. The Pro registry's covers everything. */
export async function themeFor(names: string[]): Promise<RegistryItem> {
  const all = statements(await readFile(path.join(SRC, 'app/globals.css'), 'utf8'))
  // Everything the items' code mentions, then whatever the kept CSS mentions in turn: a class's animation names its keyframes.
  let words = new Set<string>()
  for (const name of names) {
    const entry = !KITS[name] && entryOf(name)
    if (!entry) continue
    for (const code of (await gather(entry)).files.values()) stringWords(code).forEach((w) => words.add(w))
  }
  let kept = keep(all, words)
  for (let pass = 0; pass < 3; pass++) {
    words = new Set([...words, ...wordsIn(kept.join('').replace(/\/\*[\s\S]*?\*\//g, ''))])
    kept = keep(all, words)
  }
  const css = brand(
    `/*
 * Detent's theme: the tokens every Detent component is drawn with (surfaces, inks, lines, the
 * accent, the type scale, radii, elevation) and the few classes and keyframes they use, in
 * light and dark. Dark follows either a .dark class or data-theme="dark" on an ancestor.
 *
 * It follows your shadcn theme: surfaces, inks, lines, the accent, danger and cards read your
 * --background, --foreground, --muted-foreground, --border, --primary, --destructive and --card,
 * with Detent's own values as the fallback. Change yours and Detent changes with it.
 * Detent's accent and card are named dt-accent and dt-card, so they never touch your own.
 * Imported once from your global stylesheet, after Tailwind.
 */
${kept.join('').trim()}
`,
  )
    .replace(/__SHADCN_ACCENT__/g, '--accent')
    .replace(/__SHADCN_CARD__/g, '--card')
  return {
    $schema: SCHEMA,
    name: 'theme',
    type: 'registry:style',
    title: 'Detent theme',
    description: 'The tokens every Detent component is drawn with, in light and dark, as one stylesheet beside the components.',
    author: 'Detent',
    files: [{ path: `${BASE}/detent.css`, type: 'registry:file', target: `${BASE}/detent.css`, content: css }],
    css: { [`@import "../${BASE}/detent.css"`]: {} },
  }
}

/** The index the shadcn CLI and anyone browsing read: every free item, without its files. */
export async function registryIndex() {
  'use cache'
  const items = (await Promise.all(freeNames().map(registryItem))).filter((x): x is RegistryItem => !!x)
  return {
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    name: 'detent',
    homepage: SITE,
    items: [await registryTheme(), ...items].map(({ files, ...rest }) => ({ ...rest, files: files.map(({ path, type, target }) => ({ path, type, target })) })),
  }
}
