import { ENTRIES } from '@/catalog/meta'
import { SITE, installCommand, isProBlock, isProComponent } from '@/catalog/pro'
import { BLOCKS } from '@/catalog/blocks'
import { TEMPLATES } from '@/catalog/templates'
import { CONTACT } from '@/catalog/trust'
import { NAME, DESCRIPTION, TAGLINE } from '@/site/seo'

export function GET() {
  const free = ENTRIES.filter((e) => !isProComponent(e.id))
  const pro = ENTRIES.filter((e) => isProComponent(e.id))

  const lines = [
    `# ${NAME}`,
    '',
    `> ${DESCRIPTION}`,
    '',
    `${NAME} is a library of premium React components for products and websites: everyday controls, live charts, whole-screen blocks and app templates, each with its motion and states worked out. They install with the shadcn CLI as source you own. Built with React 19, Tailwind CSS v4, and Motion. Free components are open-source under the MIT license; Pro is a one-time purchase with every update for life. Contact: ${CONTACT}.`,
    '',
    '## Core pages',
    `- [Home](${SITE}/index.md): ${NAME} — ${TAGLINE}`,
    `- [Pro](${SITE}/pro.md): Pro components, whole-screen blocks, and production templates with lifetime updates`,
    `- [Components](${SITE}/components.md): All ${ENTRIES.length} premium React components`,
    `- [Blocks](${SITE}/blocks.md): Production-ready screens built from Detent components`,
    `- [Templates](${SITE}/templates.md): Full landing pages and applications ready to clone`,
    '',
    '## Docs & Guides',
    `- [Get started](${SITE}/docs.md): Set up a project, install a first component, connect Pro, and hand it to a coding agent`,
    `- [Design System](${SITE}/system.md): Tokens, typography, layout principles, and styling rules`,
    '',
    '## Free components',
    ...free.map(
      (e) => `- [${e.name}](${SITE}/components/${e.id}.md): ${e.line} \`${installCommand(e.id, true)}\``,
    ),
    '',
    '## Pro components',
    ...pro.map(
      (e) => `- [${e.name}](${SITE}/components/${e.id}.md): ${e.line} \`${installCommand(e.id, false)}\``,
    ),
    '',
    '## Blocks',
    ...BLOCKS.map(
      (b) => `- [${b.name}](${SITE}/blocks/${b.id}.md): ${b.line} \`${installCommand(b.id, !isProBlock(b.id))}\``,
    ),
    '',
    '## Templates',
    ...TEMPLATES.map(
      (t) =>
        `- [${t.name}](${SITE}/templates/${t.id}.md) (${t.form === 'app' ? 'app' : 'landing page'}, ${t.kind}): ${t.line} \`${installCommand(`template-${t.id}`, false)}\``,
    ),
    '',
    '## Machine-readable',
    `- [Full content](${SITE}/llms-full.txt): Every page concatenated in a single text document`,
    `- [Markdown catalog](${SITE}/api/md/_catalog): JSON catalog of all addressable markdown routes`,
    `- [Sitemap](${SITE}/sitemap.xml): XML sitemap listing all canonical HTML pages`,
    `- [AI usage policy](${SITE}/ai.txt): Permissions, restrictions, and attribution policy for AI crawlers`,
    `- [Theme tokens](${SITE}/r/theme.json): Design tokens and Tailwind configuration`,
    `- [Registry index](${SITE}/r/registry.json): CLI registry index for all components`,
    '',
    '## Optional',
    `- [Changelog](${SITE}/changelog.md): Release history, component updates, and new features`,
    `- [Licence](${SITE}/licence.md): MIT and Pro license terms`,
    `- [Terms](${SITE}/terms.md): Terms of service`,
    `- [Refunds](${SITE}/refunds.md): 14-day refund policy`,
    `- [Privacy](${SITE}/privacy.md): What we keep and how to have it removed`,
  ]

  return new Response(lines.join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
