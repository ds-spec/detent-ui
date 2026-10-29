import { TEMPLATES } from '@/catalog/templates'
import type { RailGroup } from '../exhibit/Rail'

/** The templates for the list down the side: apps first, then landing pages, each with what it is. */
export const TEMPLATE_RAIL: RailGroup[] = (
  [
    ['app', 'Apps'],
    ['landing', 'Landing pages'],
  ] as const
)
  .map(([form, name]) => ({ id: form, name, items: TEMPLATES.filter((t) => (t.form === 'app') === (form === 'app')).map((t) => ({ id: t.id, name: t.name, line: t.kind, pro: true })) }))
  .filter((g) => g.items.length)

export const TEMPLATE_LINKS: Record<string, string> = Object.fromEntries(TEMPLATES.map((t) => [t.id, `/templates/${t.id}`]))
