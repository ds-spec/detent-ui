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
  'agent-dashboard',
  'support-inbox',
  'onboarding',
  'sign-in',
  'settings',
  'code-review',
  'incident',
] as const

export type BlockId = (typeof BLOCK_IDS)[number]
