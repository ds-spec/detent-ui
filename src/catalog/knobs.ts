/**
 * Which props each component's demo lets you change on the components page, and the value the
 * demo starts from. Booleans become switches, numbers steppers (within `range`), strings text
 * fields, and anything with `options` a segmented choice. Every other prop is still listed,
 * read from the source; callbacks light up when they fire.
 *
 * The demo reads each of these with `useBench().get(name, ownValue)`, so its own value here and
 * in the demo must match.
 */
export type Knob = { value: boolean } | { value: number; range: [number, number]; step?: number } | { value: string | number; options: (string | number)[] } | { value: string }

const SIDES = ['top', 'right', 'bottom', 'left']

export const KNOBS: Record<string, Record<string, Knob>> = {
  scaffold: { name: { value: 'support-bot' } },
  answer: { compact: { value: false } },
  trace: { rows: { value: 10, range: [4, 12] } },
  diff: { title: { value: 'Apply the Q3 refund rules' }, file: { value: 'src/billing/refunds.ts' } },
  rewrite: { assistant: { value: 'Detent' } },
  approval: { agent: { value: 'support-bot' }, autoFocus: { value: false } },
  prompt: { placeholder: { value: 'Ask anything' } },
  tree: { label: { value: 'Agent files' } },
  plan: { goal: { value: 'Ship the Q3 refund rules' } },
  table: { hints: { value: true } },
  chart: { title: { value: 'Revenue' } },
  voice: { placeholder: { value: 'Message Copilot, or tap the mic' } },
  select: { label: { value: 'Status' }, placeholder: { value: 'Unassigned' } },
  rename: { label: { value: 'Title' }, activate: { value: 'click', options: ['click', 'double-click'] } },
  code: { resendAfter: { value: 30, range: [5, 60], step: 5 } },
  stepper: {
    min: { value: 1, range: [0, 10] },
    max: { value: 50, range: [10, 100], step: 10 },
    step: { value: 1, options: [1, 5, 10] },
    label: { value: 'Seats' },
  },
  tags: { label: { value: 'Topics' }, max: { value: 8, range: [3, 12] }, placeholder: { value: 'Add a topic…' } },
  upload: { accept: { value: 'PNG, JPG, PDF or MP4' } },
  inbox: { align: { value: 'center', options: ['start', 'center', 'end'] } },
  undo: { title: { value: 'Recent files' }, seconds: { value: 5, range: [2, 15] } },
  feedback: { question: { value: 'Was this helpful?' } },
  command: { placeholder: { value: 'Search projects, people and actions…' } },
  presence: { max: { value: 4, range: [2, 6] } },
  buttons: { size: { value: 'md', options: ['sm', 'md', 'lg'] } },
  waitlist: { action: { value: 'Join waitlist' }, placeholder: { value: 'you@company.com' }, joined: { value: 1283, range: [1000, 9999] } },
  run: { label: { value: 'Run agent' } },
  thinking: { expanded: { value: false } },
  hold: { placeholder: { value: 'Message' } },
  files: { empty: { value: 'Attach files, or drop them here' } },
  toasts: { max: { value: 3, range: [1, 5] }, expanded: { value: false } },
  retry: { title: { value: 'Rate limited' }, base: { value: 5, range: [1, 30] } },
  flow: { follow: { value: true } },
  heatmap: { label: { value: 'commits' } },
  dialog: { dismissable: { value: true } },
  confirm: { confirmLabel: { value: 'Delete project' }, doneLabel: { value: 'Deleted' } },
  popover: { side: { value: 'bottom', options: SIDES }, arrow: { value: true } },
  tooltip: { side: { value: 'top', options: SIDES } },
  dropdown: { side: { value: 'bottom', options: SIDES } },
  hovercard: { openDelay: { value: 450, range: [0, 1500], step: 50 }, side: { value: 'bottom', options: SIDES } },
}
