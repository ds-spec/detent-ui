import { BLOCKS } from '@/catalog/blocks'
import { TEMPLATES } from '@/catalog/templates'
import { daysFor } from './days'
import { FREE_BLOCKS, PRO_COMPONENTS } from './pro'

export { DAYS, daysFor } from './days'

export const PRO_BLOCKS = BLOCKS.filter((b) => !FREE_BLOCKS.includes(b.id))
const sum = (ids: string[]) => ids.reduce((n, id) => n + daysFor(id), 0)
export const COMPONENT_DAYS = sum(PRO_COMPONENTS)
export const BLOCK_DAYS = sum(PRO_BLOCKS.map((b) => b.id))
export const TEMPLATE_DAYS = sum(TEMPLATES.map((t) => t.id))
export const PRO_DAYS = COMPONENT_DAYS + BLOCK_DAYS
export const TOTAL_DAYS = PRO_DAYS + TEMPLATE_DAYS
export const TOTAL_MONTHS = Math.round(TOTAL_DAYS / 21)
