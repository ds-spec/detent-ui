/**
 * Every block's id, and nothing else. Small on purpose: what only needs to count or name the
 * blocks (the plans, the shell) reads this instead of the whole block catalogue. blocks.ts types
 * each block's id against this list, so the two can't drift apart.
 */
export const BLOCK_IDS = [
  'live-features',
  'pricing',
  'integrations',
  'testimonials',
  'faq',
  'cta',
  'calendar',
  'data-table',
  'agent-chat',
  'task-to-merge',
  'voice-mode',
  'evals',
  'support-inbox',
  'onboarding',
  'sign-in',
  'settings',
  'code-review',
] as const

export type BlockId = (typeof BLOCK_IDS)[number]
