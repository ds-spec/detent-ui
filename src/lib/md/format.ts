/**
 * Shared markdown formatting helpers for the AI-readable renderer registry.
 * Every renderer imports from here so output is consistent across pages.
 */

import { SITE } from '@/catalog/pro'

/** Turn a relative path into an absolute URL pointing at the HTML page. */
export const abs = (path: string) => `${SITE}${path.startsWith('/') ? path : `/${path}`}`

/** Absolute URL for the .md alternate of a page. */
export const mdAbs = (path: string) => `${abs(path)}.md`.replace(/\/\.md$/, '/index.md')

/** Escape pipe characters so they're safe inside markdown table cells. */
export const cell = (s: string) => String(s).replace(/\|/g, '\\|')

/** Format a date string YYYY-MM-DD as "Month D, YYYY". */
export const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

/** Today as YYYY-MM-DD. */
export const today = () => new Date().toISOString().slice(0, 10)

/**
 * Wrap the core content in the standard markdown page envelope:
 *   # Title
 *   > summary
 *   Canonical: …
 *   Last updated: …
 *   <body>
 *   ## Related
 *   - links
 */
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

/** Render an array of two-element [key, value] pairs as a markdown table. */
export function kvTable(rows: [string, string | number][], headers = ['', '']): string {
  const [h1, h2] = headers
  const out = [`| ${h1} | ${h2} |`, `| --- | --- |`]
  for (const [k, v] of rows) {
    out.push(`| ${cell(String(k))} | ${cell(String(v))} |`)
  }
  return out.join('\n')
}

/** Render a list of items with optional descriptions as markdown list entries. */
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
