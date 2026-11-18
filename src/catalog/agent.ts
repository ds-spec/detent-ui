/* What a coding agent needs before it picks a piece: when it fits, when it doesn't, and what to reach for
   instead. Plain strings, so the same words feed the per-piece markdown, agents.md and the registry items. */
import { FILES } from './source'
import { SITE } from './pro'

export { GUIDE } from './guide'
export type { Guide } from './guide'

const BASE = 'components/detent'

/* Where the piece lands after install, as an import path */
export function importOf(id: string): string | null {
  const first = FILES[id]?.[0]
  if (!first) return null
  const rel = first
    .replace(/^\.\.\/pro\//, '')
    .replace(/\.(tsx|ts)$/, '')
    .replace(/\/index$/, '')
  return `@/${BASE}/${rel}`
}

export const mdOf = (kind: 'components' | 'blocks', id: string) => `${SITE}/${kind}/${id}.md`

export const PRO_ENV = 'DETENT_PRO_KEY'

export const PRO_REGISTRY = `"registries": {
  "@detent-pro": {
    "url": "${SITE}/r/pro/{name}.json",
    "headers": { "Authorization": "Bearer \${${PRO_ENV}}" }
  }
}`

/* What the shadcn CLI prints after an install: where the docs are, and the one setup step everything needs */
export const installDocs = (kind: 'components' | 'blocks', id: string) =>
  `Usage, props and when to use it: ${mdOf(kind, id)} . Wrap your root layout once in <MotionConfig reducedMotion="user"> from motion/react so the motion respects reduced-motion settings.`
