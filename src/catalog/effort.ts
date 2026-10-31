import { BLOCKS } from '@/catalog/blocks'
import { TEMPLATES } from '@/catalog/templates'
import { daysFor } from './days'
import { FREE_BLOCKS, PRO_COMPONENTS } from './pro'

export { DAYS, daysFor } from './days'

/** Everything in Pro, added up. The blocks anyone can install for free aren't in it. */
export const PRO_BLOCKS = BLOCKS.filter((b) => !FREE_BLOCKS.includes(b.id))
const sum = (ids: string[]) => ids.reduce((n, id) => n + daysFor(id), 0)
/** Each part of Pro added up, so a page can say what a plan with or without the templates is worth. */
export const COMPONENT_DAYS = sum(PRO_COMPONENTS)
export const BLOCK_DAYS = sum(PRO_BLOCKS.map((b) => b.id))
export const TEMPLATE_DAYS = sum(TEMPLATES.map((t) => t.id))
/** Pro without the templates: the components and the blocks. */
export const PRO_DAYS = COMPONENT_DAYS + BLOCK_DAYS
export const TOTAL_DAYS = PRO_DAYS + TEMPLATE_DAYS
/** The same, in months of one engineer's working days. */
export const TOTAL_MONTHS = Math.round(TOTAL_DAYS / 21)
