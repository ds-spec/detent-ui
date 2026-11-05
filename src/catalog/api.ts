import ts from 'typescript'

export type PropDoc = { name: string; type: string; default?: string; note?: string; required: boolean }
export type Api = { component: string; props: PropDoc[]; methods?: string[]; extends?: string }

const flat = (s: string) => s.replace(/\s+/g, ' ').replace(/\(\s/g, '(').replace(/\s\)/g, ')').replace(/;\s*}/g, ' }').trim()

export function apiFromSource(code: string, file: string, notes: Record<string, string> = {}): Api | null {
  const sf = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const base = file
    .split('/')
    .pop()!
    .replace(/\.tsx?$/, '')
  const aliases = new Map<string, ts.TypeNode | ts.InterfaceDeclaration>()
  type Found = { name: string; param?: ts.ParameterDeclaration; type?: ts.TypeNode }
  const found: Found[] = []

  const isExported = (n: ts.Node) => !!(ts.getCombinedModifierFlags(n as ts.Declaration) & ts.ModifierFlags.Export)
  for (const st of sf.statements) {
    if (ts.isTypeAliasDeclaration(st)) aliases.set(st.name.text, st.type)
    if (ts.isInterfaceDeclaration(st)) aliases.set(st.name.text, st)
    if (ts.isFunctionDeclaration(st) && st.name && isExported(st) && /^[A-Z]/.test(st.name.text)) {
      found.push({ name: st.name.text, param: st.parameters[0], type: st.parameters[0]?.type })
    }
    if (ts.isVariableStatement(st) && isExported(st)) {
      for (const d of st.declarationList.declarations) {
        if (!ts.isIdentifier(d.name) || !/^[A-Z]/.test(d.name.text) || !d.initializer) continue
        const call = d.initializer
        if (ts.isCallExpression(call)) {
          const fn = call.arguments.find((a) => ts.isFunctionExpression(a) || ts.isArrowFunction(a)) as ts.FunctionExpression | ts.ArrowFunction | undefined
          const typed = call.typeArguments?.[1] ?? fn?.parameters[0]?.type
          if (fn) found.push({ name: d.name.text, param: fn.parameters[0], type: typed })
        } else if (ts.isArrowFunction(call) || ts.isFunctionExpression(call)) {
          found.push({ name: d.name.text, param: call.parameters[0], type: call.parameters[0]?.type })
        }
      }
    }
  }
  const main = found.find((f) => f.name === base) ?? found.find((f) => f.param)
  if (!main?.param) return null

  const defaults = new Map<string, string>()
  if (ts.isObjectBindingPattern(main.param.name)) {
    for (const el of main.param.name.elements) {
      const key = el.propertyName && ts.isIdentifier(el.propertyName) ? el.propertyName.text : ts.isIdentifier(el.name) ? el.name.text : null
      if (key && el.initializer) defaults.set(key, flat(el.initializer.getText(sf)))
    }
  }

  const props: PropDoc[] = []
  let extendsEl: string | undefined
  const seen = new Set<string>()
  const members = (node: ts.TypeNode | ts.InterfaceDeclaration | undefined): void => {
    if (!node) return
    if (ts.isInterfaceDeclaration(node) || ts.isTypeLiteralNode(node)) {
      for (const m of node.members) {
        if (!ts.isPropertySignature(m) || !m.name || seen.has(m.name.getText(sf))) continue
        const name = m.name.getText(sf)
        seen.add(name)
        props.push({ name, type: m.type ? flat(m.type.getText(sf)) : 'unknown', default: defaults.get(name), note: notes[name], required: !m.questionToken })
      }
      return
    }
    if (ts.isIntersectionTypeNode(node)) return node.types.forEach(members)
    if (ts.isParenthesizedTypeNode(node)) return members(node.type)
    if (ts.isTypeReferenceNode(node)) {
      const name = node.typeName.getText(sf)
      if (aliases.has(name)) return members(aliases.get(name))
      const el = node.getText(sf).match(/ComponentProps<(?:typeof )?(?:motion\.)?['"]?(\w+)/)
      if (el) extendsEl = el[1]
    }
  }
  members(main.type)

  let methods: string[] | undefined
  const ref = props.find((p) => p.name === 'ref')
  const handle = ref?.type.match(/Ref<(\w+)>/)?.[1] ?? code.match(/forwardRef<\s*(\w+)/)?.[1]
  if (handle && aliases.has(handle)) {
    const h = aliases.get(handle)!
    const lit = ts.isInterfaceDeclaration(h) ? h : ts.isTypeLiteralNode(h) ? h : null
    if (lit) methods = lit.members.map((m) => flat(m.getText(sf)).replace(/;$/, ''))
    if (!ref && methods) props.push({ name: 'ref', type: `Ref<${handle}>`, required: false })
  }
  return { component: main.name, props, methods, extends: extendsEl }
}
