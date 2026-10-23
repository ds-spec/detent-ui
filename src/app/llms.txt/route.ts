import { ENTRIES } from '@/catalog/meta'
import { KITS, PRO_COMPONENTS, SITE, installCommand, isProComponent } from '@/catalog/pro'
import { BLOCKS } from '@/pro/blocks/meta'
import { TEMPLATES } from '@/templates/meta'

// For coding agents and AI assistants: what Detent is, what's free, what's Pro, and the exact command for each piece.
export function GET() {
  const free = ENTRIES.filter((e) => !isProComponent(e.id))
  const pro = ENTRIES.filter((e) => isProComponent(e.id))
  const lines = [
    '# Detent',
    '',
    '> React components for AI products and the software around them. Every state designed, every key handled, no layout shift. Installed as source with the shadcn CLI. React 19, Tailwind v4, Motion.',
    '',
    'Install any free item with no setup. Each one brings the Detent theme with it (tokens, light and dark), and its files land in components/detent/.',
    '',
    '## Kits',
    ...Object.entries(KITS).map(([id, k]) => `- [${k.name}](${SITE}/r/${id}.json): ${k.line} \`${installCommand(id, true)}\``),
    '',
    '## Free components',
    ...free.map((e) => `- [${e.name}](${SITE}/components/${e.id}): ${e.line} \`${installCommand(e.id, true)}\``),
    '',
    '## Pro',
    `${PRO_COMPONENTS.length} components, ${BLOCKS.length} blocks and ${TEMPLATES.length} templates need a Pro licence (${SITE}/pro). They install from the private registry once a licence key is set up.`,
    '',
    '### Pro components',
    ...pro.map((e) => `- [${e.name}](${SITE}/components/${e.id}): ${e.line} \`${installCommand(e.id, false)}\``),
    '',
    '### Blocks: whole screens, already working',
    ...BLOCKS.map((b) => `- [${b.name}](${SITE}/blocks/${b.id}): ${b.line} \`${installCommand(b.id, false)}\``),
    '',
    '### Templates: whole landing pages and apps',
    ...TEMPLATES.map((t) => `- [${t.name}](${SITE}/templates/${t.id}) (${t.form === 'app' ? 'app' : 'landing page'}, ${t.kind}): ${t.line} \`${installCommand(`template-${t.id}`, false)}\``),
    '',
    '## Registry',
    `- Index: ${SITE}/r/registry.json`,
    `- Theme: ${SITE}/r/theme.json`,
  ]
  return new Response(lines.join('\n') + '\n', { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
