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
    'For coding agents: before using a piece, fetch its page with `.md` appended (it has when to use it, the import path, props and an example). Free pieces install from the URLs below; Pro pieces need the @detent-pro registry and DETENT_PRO_KEY (see Get started). Setting up a project for Detent: follow ' + `${SITE}/setup.md` + '. Connecting a Pro key: ' + `${SITE}/pro-setup.md` + '. Rules to keep in AGENTS.md or CLAUDE.md: ' + `${SITE}/agents.md` + '.',
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
    `- [Set up with an agent](${SITE}/setup.md): Steps a coding agent follows to prepare a project, install the theme, add the agent rules and connect Pro`,
    `- [Connect Pro](${SITE}/pro-setup.md): Steps a coding agent follows to connect a Detent Pro key`,
    `- [Agent rules](${SITE}/agents.md): A compact index to paste into AGENTS.md or CLAUDE.md: when to use each piece, when not to, and how to install it`,
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
    `- [Refunds](${SITE}/refunds.md): all sales are final`,
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
