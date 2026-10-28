import { BLOCKS } from '@/catalog/blocks'
import { TEMPLATES } from '@/catalog/templates'
import { PRO_COMPONENTS } from './pro'

/**
 * Roughly how many working days it takes a good engineer to build each piece of Pro to this
 * standard: every state, the keyboard, both themes, every width, and nothing on the page ever
 * jumping. Estimates, and said so wherever they're shown; the Pro page adds them up.
 */
export const DAYS: Record<string, number> = {
  // Components
  answer: 10,
  diff: 15,
  trace: 12,
  approval: 8,
  rewrite: 8,
  table: 15,
  chart: 8,
  usage: 6,
  dates: 8,
  payments: 6,
  flow: 15,
  kanban: 10,
  heatmap: 6,
  video: 8,
  cropper: 8,
  tour: 8,
  composer: 12,
  // Blocks
  'live-features': 8,
  pricing: 6,
  testimonials: 4,
  faq: 4,
  cta: 4,
  calendar: 12,
  'data-table': 10,
  analytics: 10,
  'prompt-playground': 14,
  'agent-chat': 12,
  'task-to-merge': 15,
  'voice-mode': 15,
  evals: 12,
  'support-inbox': 15,
  onboarding: 8,
  'sign-in': 5,
  billing: 10,
  settings: 10,
  'code-review': 12,
  // Templates
  lumen: 12,
  kiln: 15,
  detent: 24,
  tandem: 24,
  rapport: 30,
}

export const daysFor = (id: string) => DAYS[id] ?? 8

/** Everything in Pro, added up. */
export const PRO_BLOCKS = BLOCKS
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
