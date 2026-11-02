'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import { PRO_DEMOS, SPOTS, preloadProDemo } from '@pro'

type Load = () => Promise<ComponentType>
const loads: Record<string, Load> = {}
const lazy = (id: string, load: Load) => {
  loads[id] = load
  return dynamic(load, { ssr: false })
}

/** Each free demo is its own chunk, loaded only when something on screen asks for it. */
const FREE: Record<string, ComponentType> = {
  bars: lazy('bars', () => import('@/lab/demos/bars').then((m) => m.BarsDemo)),
  rings: lazy('rings', () => import('@/lab/demos/rings').then((m) => m.RingsDemo)),
  waffle: lazy('waffle', () => import('@/lab/demos/waffle').then((m) => m.WaffleDemo)),
  meter: lazy('meter', () => import('@/lab/demos/gauge').then((m) => m.GaugeDemo)),
  metric: lazy('metric', () => import('@/lab/demos/metric').then((m) => m.MetricDemo)),
  toaster: lazy('toaster', () => import('@/lab/demos/toaster').then((m) => m.ToasterDemo)),
  signature: lazy('signature', () => import('@/lab/demos/signature').then((m) => m.SignatureDemo)),
  dialog: lazy('dialog', () => import('@/lab/demos/overlays').then((m) => m.DialogDemo)),
  confirm: lazy('confirm', () => import('@/lab/demos/overlays').then((m) => m.ConfirmDemo)),
  popover: lazy('popover', () => import('@/lab/demos/overlays').then((m) => m.PopoverDemo)),
  tooltip: lazy('tooltip', () => import('@/lab/demos/overlays').then((m) => m.TooltipDemo)),
  dropdown: lazy('dropdown', () => import('@/lab/demos/overlays').then((m) => m.DropdownDemo)),
  'context-menu': lazy('context-menu', () => import('@/lab/demos/overlays').then((m) => m.ContextDemo)),
  voicenote: lazy('voicenote', () => import('@/lab/demos/voicenote').then((m) => m.VoiceNoteDemo)),
  hovercard: lazy('hovercard', () => import('@/lab/demos/overlays').then((m) => m.HoverCardDemo)),
  scaffold: lazy('scaffold', () => import('@/lab/demos/agent').then((m) => m.ScaffoldDemo)),
  prompt: lazy('prompt', () => import('@/lab/demos/inputs').then((m) => m.PromptDemo)),
  tree: lazy('tree', () => import('@/lab/demos/agent').then((m) => m.TreeDemo)),
  diff: lazy('diff', () => import('@/lab/demos/diff').then((m) => m.DiffDemo)),
  images: lazy('images', () => import('@/lab/demos/images').then((m) => m.ImagesDemo)),
  dock: lazy('dock', () => import('@/lab/demos/dock').then((m) => m.DockDemo)),
  composer: lazy('composer', () => import('@/lab/demos/composer').then((m) => m.ComposerDemo)),
  voice: lazy('voice', () => import('@/lab/demos/voice').then((m) => m.VoiceDemo)),
  select: lazy('select', () => import('@/lab/demos/menus').then((m) => m.SelectDemo)),
  rename: lazy('rename', () => import('@/lab/demos/menus').then((m) => m.RenameDemo)),
  code: lazy('code', () => import('@/lab/demos/inputs').then((m) => m.CodeDemo)),
  stepper: lazy('stepper', () => import('@/lab/demos/controls').then((m) => m.StepperDemo)),
  tags: lazy('tags', () => import('@/lab/demos/showcase').then((m) => m.TagsDemo)),
  upload: lazy('upload', () => import('@/lab/demos/showcase').then((m) => m.UploadDemo)),
  inbox: lazy('inbox', () => import('@/lab/demos/controls').then((m) => m.InboxDemo)),
  undo: lazy('undo', () => import('@/lab/demos/showcase').then((m) => m.UndoDemo)),
  feedback: lazy('feedback', () => import('@/lab/demos/showcase').then((m) => m.FeedbackDemo)),
  command: lazy('command', () => import('@/lab/demos/command').then((m) => m.CommandDemo)),
  presence: lazy('presence', () => import('@/lab/demos/presence').then((m) => m.PresenceDemo)),
  buttons: lazy('buttons', () => import('@/lab/demos/buttons').then((m) => m.ButtonsDemo)),
  tabs: lazy('tabs', () => import('@/lab/demos/essentials').then((m) => m.TabsDemo)),
  waitlist: lazy('waitlist', () => import('@/lab/demos/site').then((m) => m.WaitlistDemo)),
  rewind: lazy('rewind', () => import('@/lab/demos/rewind').then((m) => m.RewindDemo)),
  popup: lazy('popup', () => import('@/lab/demos/product').then((m) => m.PopupDemo)),
  announce: lazy('announce', () => import('@/lab/demos/product').then((m) => m.AnnounceDemo)),
  photobar: lazy('photobar', () => import('@/lab/demos/finish').then((m) => m.PhotoBarDemo)),
  checklist: lazy('checklist', () => import('@/lab/demos/finish').then((m) => m.ChecklistDemo)),
  readalong: lazy('readalong', () => import('@/lab/demos/finish').then((m) => m.ReadAlongDemo)),
  secret: lazy('secret', () => import('@/lab/demos/finish').then((m) => m.SecretDemo)),
  halo: lazy('halo', () => import('@/lab/demos/finish').then((m) => m.HaloDemo)),
  slices: lazy('slices', () => import('@/lab/demos/finish').then((m) => m.SlicesDemo)),
  versions: lazy('versions', () => import('@/lab/demos/small').then((m) => m.VersionsDemo)),
  context: lazy('context', () => import('@/lab/demos/small').then((m) => m.ContextDemo)),
  run: lazy('run', () => import('@/lab/demos/small').then((m) => m.RunDemo)),
  thinking: lazy('thinking', () => import('@/lab/demos/small').then((m) => m.ThinkingDemo)),
  typing: lazy('typing', () => import('@/lab/demos/small').then((m) => m.TypingDemo)),
  hold: lazy('hold', () => import('@/lab/demos/small').then((m) => m.HoldDemo)),
  chips: lazy('chips', () => import('@/lab/demos/small').then((m) => m.ChipsDemo)),
  files: lazy('files', () => import('@/lab/demos/small').then((m) => m.FilesDemo)),
  toasts: lazy('toasts', () => import('@/lab/demos/small').then((m) => m.ToastsDemo)),
  retry: lazy('retry', () => import('@/lab/demos/small').then((m) => m.RetryDemo)),
  rewrite: lazy('rewrite', () => import('@/lab/demos/rewrite').then((m) => m.RewriteDemo)),
  models: lazy('models', () => import('@/lab/demos/models').then((m) => m.ModelsDemo)),
  chart: lazy('chart', () => import('@/lab/demos/chart').then((m) => m.ChartDemo)),
  trend: lazy('trend', () => import('@/lab/demos/trend').then((m) => m.TrendDemo)),
  carousel: lazy('carousel', () => import('@/lab/demos/carousel').then((m) => m.CarouselDemo)),
}

/** Starts downloading a demo before anything renders it, so it's there the moment it's asked for. */
export const preloadDemo = (id: string) => void (loads[id] ?? (() => preloadProDemo(id)))()

/** Every demo by component id: the free ones above, and Pro's from Detent Pro (or a locked stand-in without it). */
export const DEMOS: Record<string, ComponentType> = { ...FREE, ...PRO_DEMOS }

/** Gallery spotlights: for big components, one moment shown large and alone. Everything else shows its full demo. */
export { SPOTS }
