import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { codeToHtml } from 'shiki'
import { isProComponent } from './pro'

/** The files that make up each component, as they ship. */
export const FILES: Record<string, string[]> = {
  scaffold: ['components/scaffold/AgentScaffold.tsx', 'components/terminal/Terminal.tsx', 'components/tree/FileTree.tsx'],
  answer: ['../pro/components/answer/StreamingAnswer.tsx'],
  trace: ['../pro/components/trace/RunTrace.tsx'],
  diff: ['../pro/components/diff/DiffReview.tsx'],
  approval: ['../pro/components/approval/ApprovalTray.tsx'],
  prompt: ['components/prompt/PromptBox.tsx'],
  tree: ['components/tree/FileTree.tsx'],
  activity: ['components/activity/AgentActivity.tsx', 'components/small/Thinking.tsx'],
  models: ['components/models/ModelPicker.tsx'],
  filter: ['../pro/components/filter/AskFilter.tsx'],
  chart: ['../pro/components/chart/ScrubChart.tsx'],
  usage: ['../pro/components/usage/UsageLimit.tsx'],
  dates: ['../pro/components/dates/DateRangePicker.tsx', '../pro/components/dates/parse.ts'],
  voice: ['components/voice/VoiceInput.tsx'],
  select: ['components/select/Select.tsx'],
  rename: ['components/rename/InlineRename.tsx'],
  code: ['components/code/CodeInput.tsx'],
  stepper: ['components/stepper/Stepper.tsx'],
  rewrite: ['../pro/components/rewrite/Rewrite.tsx'],
  tags: ['components/tags/TagInput.tsx'],
  upload: ['components/upload/Upload.tsx'],
  inbox: ['components/inbox/Inbox.tsx'],
  undo: ['components/UndoList.tsx'],
  feedback: ['components/FeedbackPulse.tsx'],
  command: ['components/command/CommandMenu.tsx'],
  presence: ['components/presence/HereNow.tsx'],
  kanban: ['../pro/components/kanban/Kanban.tsx', 'ui/Orb.tsx'],
  forecast: ['../pro/components/forecast/CashForecast.tsx'],
  cropper: ['../pro/components/cropper/ImageCropper.tsx'],
  tour: ['../pro/components/tour/ProductTour.tsx', 'lib/layer.tsx'],
  composer: ['../pro/components/composer/RichComposer.tsx'],
  time: ['../pro/components/time/TimePicker.tsx', 'lib/layer.tsx'],
  combobox: ['../pro/components/combobox/Combobox.tsx', 'lib/layer.tsx'],
  trend: ['../pro/components/charts/TrendChart.tsx', '../pro/components/charts/parts.tsx', '../pro/components/charts/ChartCard.tsx', 'lib/hooks.ts'],
  bars: ['../pro/components/charts/BarChart.tsx', '../pro/components/charts/parts.tsx', '../pro/components/charts/ChartCard.tsx'],
  rings: ['../pro/components/charts/GoalNumerals.tsx', 'ui/DotType.tsx', '../pro/components/charts/parts.tsx', '../pro/components/charts/ChartCard.tsx'],
  waffle: ['../pro/components/charts/Waffle.tsx', '../pro/components/charts/parts.tsx', '../pro/components/charts/ChartCard.tsx'],
  gauge: ['../pro/components/charts/Gauge.tsx', '../pro/components/charts/ChartCard.tsx', 'ui/RollingText.tsx'],
  stats: ['../pro/components/charts/StatTile.tsx', '../pro/components/charts/parts.tsx', 'ui/RollingText.tsx', 'lib/hooks.ts'],
  codeblock: ['../pro/components/code/CodeBlock.tsx'],
  sidebar: ['../pro/components/sidebar/AppSidebar.tsx', 'components/overlays/Tooltip.tsx', 'lib/layer.tsx'],
  timeline: ['../pro/components/timeline/Timeline.tsx'],
  carousel: ['../pro/components/carousel/Carousel.tsx', 'lib/hooks.ts'],
  toaster: ['components/toast/Toaster.tsx', 'lib/layer.tsx', 'ui/RollingText.tsx'],
  signature: ['components/signature/Signature.tsx'],
  video: ['../pro/components/video/VideoPlayer.tsx', 'components/overlays/DropdownMenu.tsx', 'components/overlays/Menu.tsx', 'components/overlays/Tooltip.tsx', 'lib/layer.tsx'],
  flow: ['../pro/components/flow/FlowBuilder.tsx', 'components/overlays/DropdownMenu.tsx', 'components/overlays/Menu.tsx', 'components/overlays/Tooltip.tsx', 'lib/layer.tsx'],
  dialog: ['components/overlays/Dialog.tsx', 'lib/layer.tsx'],
  confirm: ['components/overlays/Confirm.tsx', 'components/overlays/Dialog.tsx', 'lib/layer.tsx'],
  popover: ['components/overlays/Popover.tsx', 'lib/layer.tsx'],
  tooltip: ['components/overlays/Tooltip.tsx', 'lib/layer.tsx'],
  dropdown: ['components/overlays/DropdownMenu.tsx', 'components/overlays/Menu.tsx', 'lib/layer.tsx'],
  'context-menu': ['components/overlays/ContextMenu.tsx', 'components/overlays/Menu.tsx', 'lib/layer.tsx'],
  voicenote: ['components/voicenote/VoiceNote.tsx', 'ui/RollingText.tsx'],
  hovercard: ['components/overlays/HoverCard.tsx', 'lib/layer.tsx'],
  buttons: ['ui/Button.tsx', 'components/buttons/CopyButton.tsx', 'components/buttons/ToggleButton.tsx', 'components/buttons/SplitButton.tsx', 'components/buttons/ProgressButton.tsx', 'components/buttons/HoldButton.tsx'],
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
  extract: ['../pro/components/extract/ExtractionReview.tsx'],
  // Pro blocks live beside the lab, in src/pro.
  'prompt-playground': ['../pro/blocks/playground/Playground.tsx', '../pro/blocks/playground/content.ts', '../pro/chat/Reasoning.tsx', '../pro/chat/ModelPicker.tsx', '../pro/chat/LevelSlider.tsx', '../pro/ui/props.tsx', 'ui/DetentMark.tsx'],
  'agent-chat': ['../pro/blocks/chat/AgentChat.tsx', '../pro/blocks/chat/content.tsx', '../pro/ai/ai-sdk.ts', '../pro/ui/props.tsx'],
  'task-to-merge': ['../pro/blocks/agent/AgentRun.tsx', '../pro/blocks/agent/content.ts', '../pro/ui/props.tsx'],
  'support-inbox': ['../pro/blocks/inbox/Inbox.tsx', '../pro/blocks/inbox/content.ts', '../pro/ui/props.tsx', 'ui/DetentMark.tsx'],
  'sign-in': ['../pro/blocks/signin/SignIn.tsx', '../pro/ui/props.tsx', 'ui/DetentMark.tsx'],
  billing: ['../pro/blocks/billing/Billing.tsx', '../pro/ui/SettingsNav.tsx', '../pro/ui/props.tsx'],
  settings: ['../pro/blocks/settings/Settings.tsx', '../pro/ui/SettingsNav.tsx', '../pro/ui/props.tsx'],
  'code-review': ['../pro/blocks/review/CodeReview.tsx', '../pro/ui/props.tsx', 'ui/DetentMark.tsx'],
  testimonials: ['../pro/blocks/testimonials/Testimonials.tsx', '../pro/blocks/testimonials/content.ts', '../pro/ui/props.tsx'],
  faq: ['../pro/blocks/faq/FAQ.tsx', '../pro/blocks/faq/content.ts', '../pro/ui/Segmented.tsx', '../lab/lib/hooks.ts', '../pro/ui/props.tsx'],
  cta: ['../pro/blocks/cta/CTA.tsx', '../lab/ui/Count.tsx', '../pro/ui/props.tsx', 'ui/DetentMark.tsx'],
  calendar: ['../pro/blocks/calendar/Calendar.tsx', '../pro/blocks/calendar/content.ts', '../pro/ui/props.tsx', 'ui/DetentMark.tsx'],
  'data-table': ['../pro/blocks/table/ConversationTable.tsx', '../pro/blocks/table/content.ts', '../pro/blocks/analytics/Sidebar.tsx', '../pro/ui/Segmented.tsx', '../pro/ui/Stream.tsx', '../pro/ui/props.tsx', 'ui/DetentMark.tsx'],
  analytics: ['../pro/blocks/analytics/Analytics.tsx', '../pro/blocks/analytics/Sidebar.tsx', '../pro/blocks/analytics/content.ts', '../pro/ui/Segmented.tsx', '../lab/lib/hooks.ts', '../lab/ui/Count.tsx', '../pro/ui/props.tsx', 'ui/DetentMark.tsx'],
  pricing: ['../pro/blocks/pricing/Pricing.tsx', '../pro/ui/Segmented.tsx', '../lab/ui/Count.tsx', '../pro/ui/props.tsx'],
  'live-features': ['../pro/blocks/bento/FeatureBento.tsx', '../pro/blocks/bento/tiles.tsx', '../pro/ui/Segmented.tsx', '../pro/ui/Stream.tsx', '../lab/ui/Count.tsx', '../pro/ui/props.tsx', 'ui/DetentMark.tsx'],
  onboarding: ['../pro/blocks/onboarding/Onboarding.tsx', '../pro/ui/props.tsx', 'ui/DetentMark.tsx'],
  evals: ['../pro/blocks/evals/Evals.tsx', '../pro/blocks/evals/content.ts', '../lab/ui/Count.tsx', '../pro/ui/props.tsx'],
  'template-rapport': [
    '../pro/templates/rapport/App.tsx',
    '../pro/templates/rapport/data.ts',
    '../pro/templates/rapport/state.ts',
    '../pro/templates/rapport/parts.tsx',
    '../pro/templates/rapport/Palette.tsx',
    '../pro/templates/rapport/Today.tsx',
    '../pro/templates/rapport/Inbox.tsx',
    '../pro/templates/rapport/Tasks.tsx',
    '../pro/templates/rapport/Pipeline.tsx',
    '../pro/templates/rapport/Deal.tsx',
    '../pro/templates/rapport/Companies.tsx',
    '../pro/templates/rapport/People.tsx',
    '../pro/templates/rapport/Reports.tsx',
    '../pro/templates/rapport/Settings.tsx',
    '../pro/templates/rapport/Ask.tsx',
    '../pro/templates/rapport/ai/tools.ts',
    '../pro/templates/rapport/ai/script.ts',
    '../pro/templates/rapport/ai/route.ts',
  ],
  'template-lumen': [
    '../pro/templates/lumen/LumenPage.tsx',
    '../pro/templates/lumen/content.ts',
    '../pro/templates/lumen/Hero.tsx',
    '../pro/templates/lumen/Words.tsx',
    '../pro/templates/lumen/Conversation.tsx',
    '../pro/templates/lumen/Channels.tsx',
    '../pro/templates/lumen/Approvals.tsx',
    '../pro/templates/lumen/Noticed.tsx',
    '../pro/templates/lumen/Proof.tsx',
    '../pro/templates/kit/Frame.tsx',
    '../pro/templates/kit/Play.tsx',
    '../pro/templates/kit/Acting.tsx',
    '../pro/templates/kit/Rings.tsx',
    '../pro/templates/kit/Nav.tsx',
    '../pro/templates/kit/Footer.tsx',
    '../pro/templates/kit/Type.tsx',
    '../pro/templates/kit/Button.tsx',
  ],
  'template-kiln': [
    '../pro/templates/kiln/KilnPage.tsx',
    '../pro/templates/kiln/content.ts',
    '../pro/templates/kiln/fonts.ts',
    '../pro/templates/kiln/paint.ts',
    '../pro/templates/kiln/Landscape.tsx',
    '../pro/templates/kiln/Chapter.tsx',
    '../pro/templates/kiln/Opening.tsx',
    '../pro/templates/kiln/Stage.tsx',
    '../pro/templates/kiln/Proof.tsx',
    '../pro/templates/kiln/Journey.tsx',
    '../pro/templates/kiln/Tty.tsx',
    '../pro/templates/kiln/Bank.tsx',
    '../pro/templates/kiln/Brief.tsx',
    '../pro/templates/kiln/Bento.tsx',
    '../pro/templates/kiln/Firewall.tsx',
    '../pro/templates/kiln/Close.tsx',
    '../pro/templates/kiln/Start.tsx',
    '../pro/templates/kiln/Dock.tsx',
    '../pro/templates/kiln/Mark.tsx',
    '../pro/templates/kit/Play.tsx',
    '../pro/templates/kit/scroll.ts',
    '../pro/templates/kit/Footer.tsx',
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
  'voice-mode': ['../pro/blocks/voice/VoiceMode.tsx', '../pro/blocks/voice/content.ts', '../pro/ui/LivingOrb.tsx', '../pro/ui/props.tsx', 'ui/DetentMark.tsx'],
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
      const name = f.split('/').pop()!
      // Without the Pro source checked out, a Pro file is only named.
      const code = await readFile(path.join(process.cwd(), 'src/lab', f), 'utf8').catch(() => null)
      if (code === null) return { name, lines: 0, code: '', html: '', teaser: true }
      const lines = code.split('\n').length
      if (!gated) return { name, lines, code, html: await highlight(code, f) }
      const head = i === 0 ? await highlight(code.split('\n').slice(0, TEASER).join('\n'), f) : ''
      return { name, lines, code: '', html: head, teaser: true }
    }),
  )
}
