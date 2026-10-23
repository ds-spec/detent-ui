import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { codeToHtml } from 'shiki'
import { isProComponent } from './pro'

/** The files that make up each component, as they ship. */
export const FILES: Record<string, string[]> = {
  scaffold: ['components/scaffold/AgentScaffold.tsx', 'components/terminal/Terminal.tsx', 'components/tree/FileTree.tsx'],
  answer: ['components/answer/StreamingAnswer.tsx'],
  trace: ['components/trace/RunTrace.tsx'],
  diff: ['components/diff/DiffReview.tsx'],
  approval: ['components/approval/ApprovalTray.tsx'],
  prompt: ['components/prompt/PromptBox.tsx'],
  tree: ['components/tree/FileTree.tsx'],
  plan: ['components/plan/AgentPlan.tsx'],
  models: ['components/models/ModelPicker.tsx'],
  table: ['components/table/DataTable.tsx'],
  chart: ['components/chart/ScrubChart.tsx'],
  usage: ['components/usage/UsageMeter.tsx'],
  dates: ['components/dates/DateRangePicker.tsx', 'components/dates/parse.ts'],
  voice: ['components/voice/VoiceInput.tsx'],
  select: ['components/select/Select.tsx'],
  rename: ['components/rename/InlineRename.tsx'],
  code: ['components/code/CodeInput.tsx'],
  stepper: ['components/stepper/Stepper.tsx'],
  rewrite: ['components/rewrite/InlineEdit.tsx'],
  tags: ['components/tags/TagInput.tsx'],
  upload: ['components/upload/Upload.tsx'],
  inbox: ['components/inbox/Inbox.tsx'],
  undo: ['components/UndoList.tsx'],
  feedback: ['components/FeedbackPulse.tsx'],
  command: ['components/command/CommandMenu.tsx'],
  presence: ['components/presence/Presence.tsx'],
  kanban: ['components/kanban/Kanban.tsx', 'ui/Orb.tsx'],
  heatmap: ['components/heatmap/ActivityHeatmap.tsx', 'ui/Count.tsx'],
  cropper: ['components/cropper/ImageCropper.tsx'],
  tour: ['components/tour/ProductTour.tsx', 'lib/layer.tsx'],
  composer: ['components/composer/RichComposer.tsx'],
  time: ['components/time/TimePicker.tsx', 'lib/layer.tsx'],
  combobox: ['components/combobox/Combobox.tsx', 'lib/layer.tsx'],
  trend: ['components/charts/TrendChart.tsx', 'components/charts/parts.tsx', 'components/charts/ChartCard.tsx', 'lib/hooks.ts'],
  bars: ['components/charts/BarChart.tsx', 'components/charts/parts.tsx', 'components/charts/ChartCard.tsx'],
  rings: ['components/charts/ActivityRings.tsx', 'components/charts/parts.tsx', 'components/charts/ChartCard.tsx'],
  waffle: ['components/charts/Waffle.tsx', 'components/charts/parts.tsx', 'components/charts/ChartCard.tsx'],
  gauge: ['components/charts/Gauge.tsx', 'components/charts/ChartCard.tsx', 'ui/RollingText.tsx'],
  stats: ['components/charts/StatTile.tsx', 'components/charts/parts.tsx', 'ui/RollingText.tsx', 'lib/hooks.ts'],
  codeblock: ['components/code/CodeBlock.tsx'],
  sidebar: ['components/sidebar/AppSidebar.tsx', 'components/overlays/Tooltip.tsx', 'lib/layer.tsx'],
  timeline: ['components/timeline/Timeline.tsx'],
  carousel: ['components/carousel/Carousel.tsx', 'lib/hooks.ts'],
  toaster: ['components/toast/Toaster.tsx', 'lib/layer.tsx', 'ui/RollingText.tsx'],
  panels: ['components/panels/Panels.tsx'],
  video: ['components/video/VideoPlayer.tsx', 'components/overlays/DropdownMenu.tsx', 'components/overlays/Menu.tsx', 'components/overlays/Tooltip.tsx', 'lib/layer.tsx'],
  flow: ['components/flow/FlowBuilder.tsx', 'components/overlays/DropdownMenu.tsx', 'components/overlays/Menu.tsx', 'components/overlays/Tooltip.tsx', 'lib/layer.tsx'],
  dialog: ['components/overlays/Dialog.tsx', 'lib/layer.tsx'],
  confirm: ['components/overlays/Confirm.tsx', 'components/overlays/Dialog.tsx', 'lib/layer.tsx'],
  popover: ['components/overlays/Popover.tsx', 'lib/layer.tsx'],
  tooltip: ['components/overlays/Tooltip.tsx', 'lib/layer.tsx'],
  dropdown: ['components/overlays/DropdownMenu.tsx', 'components/overlays/Menu.tsx', 'lib/layer.tsx'],
  'context-menu': ['components/overlays/ContextMenu.tsx', 'components/overlays/Menu.tsx', 'lib/layer.tsx'],
  sheet: ['components/overlays/Sheet.tsx', 'lib/layer.tsx'],
  hovercard: ['components/overlays/HoverCard.tsx', 'lib/layer.tsx'],
  buttons: ['ui/Button.tsx'],
  tabs: ['components/DirectionTabs.tsx'],
  waitlist: ['components/site/Waitlist.tsx'],
  versions: ['components/small/Versions.tsx'],
  context: ['components/small/ContextRing.tsx'],
  run: ['components/small/RunButton.tsx'],
  thinking: ['components/small/Thinking.tsx'],
  typing: ['components/small/TypingBubble.tsx'],
  hold: ['components/small/HoldToTalk.tsx'],
  chips: ['components/small/PromptChips.tsx'],
  files: ['components/small/FileChip.tsx'],
  toasts: ['components/small/AgentToasts.tsx'],
  retry: ['components/small/RetryButton.tsx'],
  payments: ['components/wallet/PaymentMethods.tsx'],
  // Pro blocks live beside the lab, in src/pro.
  'prompt-playground': ['../pro/blocks/playground/Playground.tsx', '../pro/blocks/playground/content.ts', '../pro/chat/Reasoning.tsx', '../pro/chat/ModelPicker.tsx', '../pro/chat/LevelSlider.tsx', '../pro/ui/props.tsx', '../pro/ui/DetentMark.tsx'],
  'agent-run': ['../pro/blocks/agent/AgentRun.tsx', '../pro/blocks/agent/content.ts', '../pro/ui/props.tsx'],
  'support-inbox': ['../pro/blocks/inbox/Inbox.tsx', '../pro/blocks/inbox/content.ts', '../pro/ui/props.tsx', '../pro/ui/DetentMark.tsx'],
  'sign-in': ['../pro/blocks/signin/SignIn.tsx', '../pro/ui/props.tsx', '../pro/ui/DetentMark.tsx'],
  billing: ['../pro/blocks/billing/Billing.tsx', '../pro/ui/SettingsNav.tsx', '../pro/ui/props.tsx'],
  settings: ['../pro/blocks/settings/Settings.tsx', '../pro/ui/SettingsNav.tsx', '../pro/ui/props.tsx'],
  'code-review': ['../pro/blocks/review/CodeReview.tsx', '../pro/ui/props.tsx', '../pro/ui/DetentMark.tsx'],
  testimonials: ['../pro/blocks/testimonials/Testimonials.tsx', '../pro/blocks/testimonials/content.ts', '../pro/ui/props.tsx'],
  faq: ['../pro/blocks/faq/FAQ.tsx', '../pro/blocks/faq/content.ts', '../pro/ui/Segmented.tsx', '../lab/lib/hooks.ts', '../pro/ui/props.tsx'],
  cta: ['../pro/blocks/cta/CTA.tsx', '../lab/ui/Count.tsx', '../pro/ui/props.tsx', '../pro/ui/DetentMark.tsx'],
  calendar: ['../pro/blocks/calendar/Calendar.tsx', '../pro/blocks/calendar/content.ts', '../pro/ui/props.tsx', '../pro/ui/DetentMark.tsx'],
  'data-table': ['../pro/blocks/table/ConversationTable.tsx', '../pro/blocks/table/content.ts', '../pro/blocks/analytics/Sidebar.tsx', '../pro/ui/Segmented.tsx', '../pro/ui/Stream.tsx', '../pro/ui/props.tsx', '../pro/ui/DetentMark.tsx'],
  analytics: ['../pro/blocks/analytics/Analytics.tsx', '../pro/blocks/analytics/Sidebar.tsx', '../pro/blocks/analytics/content.ts', '../pro/ui/Segmented.tsx', '../lab/lib/hooks.ts', '../lab/ui/Count.tsx', '../pro/ui/props.tsx', '../pro/ui/DetentMark.tsx'],
  pricing: ['../pro/blocks/pricing/Pricing.tsx', '../pro/ui/Segmented.tsx', '../lab/ui/Count.tsx', '../pro/ui/props.tsx'],
  'feature-bento': ['../pro/blocks/bento/FeatureBento.tsx', '../pro/blocks/bento/tiles.tsx', '../pro/ui/Segmented.tsx', '../pro/ui/Stream.tsx', '../lab/ui/Count.tsx', '../pro/ui/props.tsx', '../pro/ui/DetentMark.tsx'],
  onboarding: ['../pro/blocks/onboarding/Onboarding.tsx', '../pro/ui/props.tsx', '../pro/ui/DetentMark.tsx'],
  evals: ['../pro/blocks/evals/Evals.tsx', '../pro/blocks/evals/content.ts', '../lab/ui/Count.tsx', '../pro/ui/props.tsx'],
  'template-lumen': [
    '../templates/lumen/LumenPage.tsx',
    '../templates/lumen/content.ts',
    '../templates/lumen/Hero.tsx',
    '../templates/lumen/Words.tsx',
    '../templates/lumen/Conversation.tsx',
    '../templates/lumen/Channels.tsx',
    '../templates/lumen/Approvals.tsx',
    '../templates/lumen/Noticed.tsx',
    '../templates/lumen/Proof.tsx',
    '../templates/kit/Frame.tsx',
    '../templates/kit/Play.tsx',
    '../templates/kit/Acting.tsx',
    '../templates/kit/Rings.tsx',
    '../templates/kit/Nav.tsx',
    '../templates/kit/Footer.tsx',
    '../templates/kit/Type.tsx',
    '../templates/kit/Button.tsx',
  ],
  'template-kiln': [
    '../templates/kiln/KilnPage.tsx',
    '../templates/kiln/content.ts',
    '../templates/kiln/fonts.ts',
    '../templates/kiln/paint.ts',
    '../templates/kiln/Landscape.tsx',
    '../templates/kiln/Chapter.tsx',
    '../templates/kiln/Opening.tsx',
    '../templates/kiln/Stage.tsx',
    '../templates/kiln/Proof.tsx',
    '../templates/kiln/Journey.tsx',
    '../templates/kiln/Tty.tsx',
    '../templates/kiln/Bank.tsx',
    '../templates/kiln/Brief.tsx',
    '../templates/kiln/Bento.tsx',
    '../templates/kiln/Firewall.tsx',
    '../templates/kiln/Close.tsx',
    '../templates/kiln/Start.tsx',
    '../templates/kiln/Dock.tsx',
    '../templates/kiln/Mark.tsx',
    '../templates/kit/Play.tsx',
    '../templates/kit/scroll.ts',
    '../templates/kit/Footer.tsx',
  ],
  'template-detent': [
    '../pro/chat/Workspace.tsx',
    '../pro/chat/data.ts',
    '../pro/chat/Sessions.tsx',
    '../pro/chat/Thread.tsx',
    '../pro/chat/Composer.tsx',
    '../pro/chat/ModelPicker.tsx',
    '../pro/chat/LevelSlider.tsx',
    '../pro/chat/Viewer.tsx',
    '../pro/chat/Review.tsx',
    '../pro/chat/Search.tsx',
    '../pro/chat/Settings.tsx',
    '../pro/chat/Automations.tsx',
    '../pro/chat/Modal.tsx',
    '../pro/chat/Mark.tsx',
    '../pro/ui/primitives.tsx',
    '../pro/ui/icons.tsx',
    '../pro/ui/AppIcon.tsx',
  ],
  'voice-mode': ['../pro/blocks/voice/VoiceMode.tsx', '../pro/blocks/voice/content.ts', '../pro/ui/LivingOrb.tsx', '../pro/ui/props.tsx', '../pro/ui/DetentMark.tsx'],
}

/** A file as the Code tab shows it. A teaser is Pro source: only its opening lines, nothing to copy. */
export type SourceFile = { name: string; lines: number; code: string; html: string; teaser?: boolean }

/** How much of a Pro file the public site shows: the imports and the opening comment. */
const TEASER = 18

/** Pro source: a Pro component, any block (their files live in src/pro), any template. */
export const locked = (id: string) => process.env.DETENT_UNLOCK !== '1' && (isProComponent(id) || id.startsWith('template-') || !!FILES[id]?.[0]?.startsWith('../pro/'))

const highlight = (code: string, f: string) =>
  codeToHtml(code, {
    lang: f.endsWith('.ts') ? 'ts' : 'tsx',
    themes: { light: 'github-light', dark: 'github-dark-default' },
    defaultColor: false,
  })

/**
 * Reads a component's files and highlights them for both themes. Cached: it runs once per
 * component, at build time. Pro source never leaves the build whole: the first file's opening
 * lines are highlighted as a teaser, the rest are only named and counted.
 */
export async function source(id: string): Promise<SourceFile[]> {
  'use cache'
  const gated = locked(id)
  return Promise.all(
    (FILES[id] ?? []).map(async (f, i) => {
      const code = await readFile(path.join(process.cwd(), 'src/lab', f), 'utf8')
      const name = f.split('/').pop()!
      const lines = code.split('\n').length
      if (!gated) return { name, lines, code, html: await highlight(code, f) }
      const head = i === 0 ? await highlight(code.split('\n').slice(0, TEASER).join('\n'), f) : ''
      return { name, lines, code: '', html: head, teaser: true }
    }),
  )
}
