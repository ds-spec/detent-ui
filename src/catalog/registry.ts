import { existsSync, statSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { BLOCKS } from '@/catalog/blocks'
import { ENTRIES } from './meta'
import { FILES } from './source'
import { FREE_BLOCKS, SITE, isProBlock, isProComponent } from './pro'
import { TEMPLATES } from './templates'

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

export function freeNames() {
  return [...ENTRIES.filter((e) => !isProComponent(e.id)).map((e) => e.id), ...FREE_BLOCKS]
}

export const isProName = (name: string) => isProComponent(name) || isProBlock(name) || name.startsWith('template-')

export function proNames() {
  return [...ENTRIES.filter((e) => isProComponent(e.id)).map((e) => e.id), ...BLOCKS.filter((b) => isProBlock(b.id)).map((b) => b.id), ...TEMPLATES.map((t) => `template-${t.id}`)].filter((n) => !!FILES[n]?.length)
}

export const brand = (text: string) =>
  text
    .replace(/--(color-)?(accent|card)\b/g, '--$1dt-$2')
    .replace(/\b(bg|text|border|ring|ring-offset|outline|fill|stroke|from|via|to|decoration|caret|divide|shadow|accent)-(accent|card)\b(?![-\w])/g, '$1-dt-$2')

function literalEnd(code: string, i: number): number {
  const q = code[i]
  for (let k = i + 1; k < code.length; k++) {
    const ch = code[k]
    if (ch === '\\') k++
    else if (ch === q) return k + 1
    else if (q !== '`' && ch === '\n') return -1
    else if (q === '`' && ch === '$' && code[k + 1] === '{') {
      let depth = 1
      for (k += 2; depth; k++) {
        if (k >= code.length) return -1
        const c = code[k]
        if (c === '{') depth++
        else if (c === '}') depth--
        else if (c === "'" || c === '"' || c === '`') {
          const end = literalEnd(code, k)
          if (end > 0) k = end - 1
        }
      }
      k--
    }
  }
  return -1
}

function mapLiterals(code: string, change: (text: string) => string) {
  let out = ''
  let i = 0
  while (i < code.length) {
    const ch = code[i]
    const comment = ch === '/' && code[i + 1] === '*' ? code.indexOf('*/', i) + 2 : ch === '/' && code[i + 1] === '/' && !/:$/.test(code.slice(Math.max(0, i - 1), i)) ? code.indexOf('\n', i) : 0
    const regex = ch === '/' && !comment && /[(,=:[!&|?]\s*$/.test(code.slice(Math.max(0, i - 8), i)) ? code.slice(i).match(/^\/(?:[^/\\\n[]|\\.|\[(?:[^\]\\\n]|\\.)*\])+\/[a-z]*/)?.[0].length : 0
    if (regex) {
      out += code.slice(i, i + regex)
      i += regex
      continue
    }
    const end = comment > 0 ? comment : ch === "'" || ch === '"' || ch === '`' ? literalEnd(code, i) : -1
    if (end <= i) {
      if (comment < 0) return out + code.slice(i)
      out += ch
      i++
      continue
    }
    out += comment > 0 ? code.slice(i, end) : change(code.slice(i, end))
    i = end
  }
  return out
}

const TRANSITION = /(^|[\s'"`])((?:[\w-]+:)*transition(?:-(?:colors|opacity|shadow|transform|\[[^\]\s]+\]))?)(?=$|[\s'"`])/

export const curved = (code: string) =>
  mapLiterals(code, (text) => {
    if (!TRANSITION.test(text) || /(^|[\s'"`:])ease-\[/.test(text)) return text
    const named = text.replace(/(^|[\s'"`:])ease-out(?=$|[\s'"`])/g, '$1ease-detent')
    if (named.includes('ease-detent')) return named
    return named.replace(text.includes('${') ? new RegExp(TRANSITION, 'g') : TRANSITION, '$1$2 ease-detent')
  })

const ROUTE = /^pro\/(?:templates\/[^/]+|chat)\/(app\/.+)$/

const targetOf = (rel: string) =>
  rel.match(ROUTE)?.[1] ??
  `${BASE}/${rel
    .replace(/^lab\//, '')
    .replace(/^pro\/components\//, 'components/')
    .replace(/^pro\/blocks\//, 'blocks/')
    .replace(/^pro\/ui\//, 'blocks/kit/')
    .replace(/^pro\/templates\//, 'templates/')
    .replace(/^pro\/chat\//, 'templates/detent/')
    .replace(/^pro\/ai\//, 'ai/')}`

const EXT = ['', '.tsx', '.ts', '/index.tsx', '/index.ts']
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
        if (!BUILT_IN.has(pkg) && existsSync(path.join(ROOT, 'node_modules', pkg))) deps.add(pkg)
      }
    }
  }
  return { files, deps }
}

const rewrite = (rel: string, code: string) =>
  code.replace(SPEC, (all, lead: string, q: string, spec: string) => {
    const local = resolveLocal(rel, spec)
    if (!local) return all
    return `${lead}${q}@/${targetOf(local).replace(/\.(tsx|ts)$/, '').replace(/\/index$/, '')}${q}`
  })

const OPENING = /^\s*(?:\/\*[\s\S]*?\*\/\s*|\/\/[^\n]*\n\s*)+/

function shipped(rel: string, content: string, kind: string): RegistryFile {
  const file = { path: targetOf(rel), target: targetOf(rel) }
  const type = ROUTE.test(rel) ? 'registry:page' : kind
  const opening = content.match(OPENING)?.[0]
  if (!opening || /^\s*['"]use client['"]/.test(content)) return { ...file, type, content }
  if (!/from\s+['"]@\//.test(content)) return { ...file, type: ROUTE.test(rel) ? type : 'registry:file', content }
  const rest = content.slice(opening.length)
  const imports = rest.match(/^(?:import[^\n]*\n(?:[ \t]+[^\n]*\n)*\}?[^\n]*\n?)*/)?.[0] ?? ''
  return { ...file, type, content: `${imports.trimEnd()}\n\n${opening.trim()}\n${rest.slice(imports.length)}` }
}

function entryOf(name: string): string[] | null {
  const listed = FILES[name]
  if (!listed?.length) return null
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
  return null
}

export const itemUrl = (name: string) => `${SITE}/r/${name}.json`

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
    files: [...files].map(([rel, code]) => shipped(rel, curved(brand(rewrite(rel, code))), about.type)),
  }
}

export async function registryItem(name: string): Promise<RegistryItem | null> {
  'use cache'
  if (!freeNames().includes(name)) return null
  if (name === 'theme') return null
  const about = describe(name)
  if (!about) return null
  return build(name, itemUrl('theme'))
}

export async function proItem(name: string): Promise<RegistryItem | null> {
  if (!proNames().includes(name)) return null
  return build(name, '@detent-pro/theme')
}

type Stmt = { head: string; text: string; body?: string }

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
const SKIP = /^(@import|@custom-variant|@layer base|html|body|html, body|::selection|\*|\.code\b)/

const wordsIn = (text: string) => new Set(text.match(/[A-Za-z_][\w-]*/g) ?? [])
const stringWords = (code: string) => wordsIn((code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').match(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g) ?? []).join(' '))

function used(head: string, words: Set<string>) {
  if (head.startsWith('@keyframes ')) return words.has(head.slice(11).trim())
  if (head.startsWith('@utility ')) return words.has(head.slice(9).trim())
  if (head.startsWith('@property ')) return words.has(head.slice(12).trim())
  const classes = head.match(/\.([A-Za-z_][\w-]*)/g)
  if (!classes) return false
  return classes.every((c) => words.has(c.slice(1)))
}

const darkened = (text: string) => text.replace(/\[data-theme="dark"\](?=[^{]*\{)/g, ':is(.dark, [data-theme="dark"])')

function keep(stmts: Stmt[], words: Set<string>): string[] {
  const out: string[] = []
  for (const st of stmts) {
    const { head } = st
    if (!head || SKIP.test(head)) continue
    if (head.startsWith('@theme')) {
      out.push(st.text.replace(/\n[ \t]*--(font-(sans|mono)|ease-out|default-transition-timing-function):[^;]*;/g, ''))
    } else if (LIGHT.test(head) || DARK.test(head)) out.push(darkened(bridged(st.text)))
    else if ((head.startsWith('@media') || head.startsWith('@supports')) && st.body !== undefined) {
      const inner = keep(statements(st.body), words)
      if (inner.length) out.push(`\n\n${head} {${inner.map((t) => t.replace(/^\n+/, '\n')).join('')}\n}`)
    } else if (st.body !== undefined && used(head, words)) out.push(darkened(st.text))
  }
  return out
}

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
const bridged = (text: string) =>
  text.replace(/(^|\n)([ \t]*)(--[\w-]+):\s*([^;]+);/g, (all, nl: string, pad: string, name: string, value: string) => {
    if (!(name in BRIDGE) || value.includes('var(--')) return all
    return `${nl}${pad}${name}: ${BRIDGE[name](value.trim())};`
  })

export async function registryTheme(): Promise<RegistryItem> {
  'use cache'
  return themeFor(freeNames())
}

export async function themeFor(names: string[]): Promise<RegistryItem> {
  const all = statements(await readFile(path.join(SRC, 'app/globals.css'), 'utf8'))
  let words = new Set<string>()
  for (const name of names) {
    const entry = entryOf(name)
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
    docs: 'Detent respects reduced motion when your app is wrapped once in <MotionConfig reducedMotion="user"> from motion/react, in your root layout.',
  }
}

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
