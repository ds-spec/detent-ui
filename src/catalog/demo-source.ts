/* The live demo on each piece's page, as code an agent can follow: just the demo and what it uses, with demo-only
   helpers from other demo files pulled in, and imports pointing where an install puts the piece. Build time only. */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { resolveLocal, rewrite } from './registry'

const SRC = path.join(process.cwd(), 'src')
const DEMO = /^(lab|pro)\/demos\//

type Decl = { node: ts.Statement; names: string[] }

function parse(rel: string) {
  const code = readFileSync(path.join(SRC, rel), 'utf8')
  const sf = ts.createSourceFile(rel, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const decls: Decl[] = []
  const imports: ts.ImportDeclaration[] = []
  for (const node of sf.statements) {
    if (ts.isImportDeclaration(node)) imports.push(node)
    else if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node)) {
      if (node.name) decls.push({ node, names: [node.name.text] })
    } else if (ts.isVariableStatement(node)) {
      const names: string[] = []
      for (const d of node.declarationList.declarations) collectNames(d.name, names)
      decls.push({ node, names })
    }
  }
  return { sf, code, decls, imports }
}

function collectNames(name: ts.BindingName, out: string[]) {
  if (ts.isIdentifier(name)) out.push(name.text)
  else for (const el of name.elements) if (!ts.isOmittedExpression(el)) collectNames(el.name, out)
}

function usedIn(node: ts.Node, sf: ts.SourceFile): Set<string> {
  const out = new Set<string>()
  const walk = (n: ts.Node) => {
    if (ts.isIdentifier(n)) out.add(n.text)
    n.forEachChild(walk)
  }
  walk(node)
  void sf
  return out
}

/* one demo export, and everything it needs, from its file and any demo files it borrows from */
export function demoSource(rel: string, exportName: string, rename: string): string | null {
  const files = new Map<string, ReturnType<typeof parse>>()
  const load = (r: string) => {
    if (!files.has(r)) files.set(r, parse(r))
    return files.get(r)!
  }
  const start = load(rel).decls.find((d) => d.names.includes(exportName))
  if (!start) return null

  const kept = new Map<string, Set<ts.Statement>>()
  const importsNeeded = new Map<string, Map<ts.ImportDeclaration, Set<string>>>()
  const keep = (r: string, decl: Decl) => {
    const set = kept.get(r) ?? new Set()
    if (set.has(decl.node)) return
    set.add(decl.node)
    kept.set(r, set)
    const f = load(r)
    for (const id of usedIn(decl.node, f.sf)) {
      if (decl.names.includes(id)) continue
      const local = f.decls.find((d) => d.names.includes(id))
      if (local) {
        keep(r, local)
        continue
      }
      for (const imp of f.imports) {
        const bound = boundNames(imp)
        if (!bound.includes(id)) continue
        const spec = (imp.moduleSpecifier as ts.StringLiteral).text
        const target = resolveLocal(r, spec)
        /* a helper that lives in another demo file is copied in, since it ships with no piece */
        if (target && DEMO.test(target)) {
          const theirs = load(target).decls.find((d) => d.names.includes(importedAs(imp, id)))
          if (theirs) {
            keep(target, theirs)
            continue
          }
        }
        const byFile = importsNeeded.get(r) ?? new Map()
        const names = byFile.get(imp) ?? new Set()
        names.add(id)
        byFile.set(imp, names)
        importsNeeded.set(r, byFile)
      }
    }
  }
  keep(rel, start)

  /* imports, merged per module and pointed at installed paths */
  const merged = new Map<string, { named: Set<string>; types: Set<string>; def?: string; ns?: string }>()
  for (const [r, byImp] of importsNeeded) {
    for (const [imp, names] of byImp) {
      const spec = (imp.moduleSpecifier as ts.StringLiteral).text
      const target = resolveLocal(r, spec)
      const to = target ? rewrite(r, `from '${spec}'`).replace(/^from '|'$/g, '') : spec
      const entry = merged.get(to) ?? { named: new Set(), types: new Set() }
      const clause = imp.importClause
      if (clause?.name && names.has(clause.name.text)) entry.def = clause.name.text
      const nb = clause?.namedBindings
      if (nb && ts.isNamespaceImport(nb) && names.has(nb.name.text)) entry.ns = nb.name.text
      if (nb && ts.isNamedImports(nb))
        for (const el of nb.elements) {
          if (!names.has(el.name.text)) continue
          const text = el.propertyName ? `${el.propertyName.text} as ${el.name.text}` : el.name.text
          ;(clause?.isTypeOnly || el.isTypeOnly ? entry.types : entry.named).add(text)
        }
      merged.set(to, entry)
    }
  }
  const importLines = [...merged]
    .sort(([a], [b]) => (a.startsWith('@/') ? 1 : 0) - (b.startsWith('@/') ? 1 : 0) || a.localeCompare(b))
    .flatMap(([mod, e]) => {
      const lines: string[] = []
      if (e.ns) lines.push(`import * as ${e.ns} from '${mod}'`)
      const parts = [e.def, e.named.size ? `{ ${[...e.named].sort().join(', ')} }` : ''].filter(Boolean)
      if (parts.length) lines.push(`import ${parts.join(', ')} from '${mod}'`)
      if (e.types.size) lines.push(`import type { ${[...e.types].sort().join(', ')} } from '${mod}'`)
      return lines
    })

  /* borrowed helpers first, then this file's, each in source order, the demo itself renamed and exported */
  const order = [...kept.keys()].sort((a, b) => (a === rel ? 1 : 0) - (b === rel ? 1 : 0))
  const body = order.flatMap((r) => {
    const f = load(r)
    const set = kept.get(r)!
    return f.sf.statements
      .filter((n) => set.has(n))
      .map((n) => {
        let text = f.code.slice(n.getStart(f.sf), n.end)
        text = text.replace(/^export\s+(default\s+)?/, '')
        if (r === rel && n === start.node) text = `export ${text.replace(new RegExp(`\\b${exportName}\\b`), rename)}`
        return text
      })
  })
  return unbench(["'use client'", '', ...importLines, '', ...body].join('\n')).replace(/\n{3,}/g, '\n\n').trim() + '\n'
}

/* The site's props panel ("bench") is threaded through some demos. An app has no bench: b.get(name, value) is the
   value, b.on(name, fn) is fn, b.on(name) is nothing, b.log(...) goes, and the bench itself is dropped. */
function unbench(code: string): string {
  if (!/\buseBench\b/.test(code)) return code
  const call = (src: string, head: string, swap: (args: string[]) => string) => {
    let out = ''
    let i = 0
    for (;;) {
      const at = src.indexOf(head, i)
      if (at < 0) return out + src.slice(i)
      let depth = 1
      let j = at + head.length
      const args: string[] = []
      let start = j
      let quote = ''
      for (; j < src.length && depth; j++) {
        const ch = src[j]
        if (quote) {
          if (ch === quote && src[j - 1] !== '\\') quote = ''
          continue
        }
        if (ch === "'" || ch === '"' || ch === '`') quote = ch
        else if ('([{'.includes(ch)) depth++
        else if (')]}'.includes(ch)) depth--
        if (depth === 1 && ch === ',') {
          args.push(src.slice(start, j).trim())
          start = j + 1
        }
      }
      args.push(src.slice(start, j - 1).trim())
      out += src.slice(i, at) + swap(args)
      i = j
    }
  }
  let out = code
  out = call(out, 'b.get(', (a) => a[1] ?? 'undefined')
  out = call(out, 'b.on(', (a) => a[1] ?? 'undefined')
  out = call(out, 'b.log(', () => '')
  out = out
    .replace(/\(\s*,\s*/g, '(')
    .replace(/\s+\w+=\{undefined\}/g, '')
    .replace(/^type Bench = .*\n/m, '')
    .replace(/^const BenchContext = .*\n/m, '')
    .replace(/^function useBench\(\)[\s\S]*?\n\}\n/m, '')
    .replace(/^\s*const b = useBench\(\)\n/gm, '')
  /* drop imports nothing uses any more */
  return out.replace(/^import \{ ([^}]+) \} from '([^']+)'$/gm, (line, names: string, mod: string) => {
    const rest = out.replace(line, '')
    const kept = names.split(',').map((n) => n.trim()).filter((n) => new RegExp(`\\b${n.split(' as ').pop()}\\b`).test(rest))
    return kept.length ? `import { ${kept.join(', ')} } from '${mod}'` : ''
  })
}

function boundNames(imp: ts.ImportDeclaration): string[] {
  const out: string[] = []
  const c = imp.importClause
  if (!c) return out
  if (c.name) out.push(c.name.text)
  const nb = c.namedBindings
  if (nb && ts.isNamespaceImport(nb)) out.push(nb.name.text)
  if (nb && ts.isNamedImports(nb)) for (const el of nb.elements) out.push(el.name.text)
  return out
}

function importedAs(imp: ts.ImportDeclaration, local: string): string {
  const nb = imp.importClause?.namedBindings
  if (nb && ts.isNamedImports(nb)) for (const el of nb.elements) if (el.name.text === local) return el.propertyName?.text ?? local
  return local
}

/* which demo shows which piece, read from the two demo maps the site renders */
export function demoMap(): Record<string, { rel: string; name: string }> {
  const out: Record<string, { rel: string; name: string }> = {}
  const read = (file: string, base: string) => {
    let text = ''
    try {
      text = readFileSync(path.join(SRC, file), 'utf8')
    } catch {
      return
    }
    for (const m of text.matchAll(/'?([a-z0-9-]+)'?:\s*lazy\('[a-z0-9-]+',\s*\(\)\s*=>\s*import\('([^']+)'\)\.then\(\(m\)\s*=>\s*m\.(\w+)\)\)/g)) {
      const [, id, spec, name] = m
      const target = resolveLocal(file, spec.startsWith('@/') ? spec : spec)
      if (target) out[id] ??= { rel: target, name }
      void base
    }
  }
  read('catalog/demos.tsx', 'lab')
  read('pro/demos/index.tsx', 'pro')
  return out
}
