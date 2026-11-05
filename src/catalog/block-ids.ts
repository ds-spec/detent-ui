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
