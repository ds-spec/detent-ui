import { SITE } from '@/catalog/pro'

export const abs = (path: string) => `${SITE}${path.startsWith('/') ? path : `/${path}`}`

export const mdAbs = (path: string) => `${abs(path)}.md`.replace(/\/\.md$/, '/index.md')

export const cell = (s: string) => String(s).replace(/\|/g, '\\|')

export const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

export const today = () => new Date().toISOString().slice(0, 10)

export function envelope({
  title,
  summary,
  path,
  updatedAt,
  body,
  related = [],
}: {
  title: string
  summary: string
  path: string
  updatedAt?: string
  body: string
  related?: { label: string; href: string }[]
}): string {
  const lines: string[] = [
    `# ${title}`,
    '',
    `> ${summary}`,
    '',
    `Canonical: ${abs(path)}`,
    `Last updated: ${updatedAt ?? today()}`,
    '',
    body.trim(),
  ]

  if (related.length > 0) {
    lines.push('', '## Related')
    for (const r of related) {
      lines.push(`- [${r.label}](${r.href})`)
    }
  }

  return lines.join('\n') + '\n'
}

export function kvTable(rows: [string, string | number][], headers = ['', '']): string {
  const [h1, h2] = headers
  const out = [`| ${h1} | ${h2} |`, `| --- | --- |`]
  for (const [k, v] of rows) {
    out.push(`| ${cell(String(k))} | ${cell(String(v))} |`)
  }
  return out.join('\n')
}

export function itemList(
  items: { label: string; href?: string; desc?: string }[],
): string {
  return items
    .map(({ label, href, desc }) => {
      const linked = href ? `[${label}](${href})` : label
      return desc ? `- ${linked} — ${desc}` : `- ${linked}`
    })
    .join('\n')
}
