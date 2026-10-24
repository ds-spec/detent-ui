'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import { PRO_DEMOS, SPOTS } from '@pro'

/** Each free demo is its own chunk, loaded only when something on screen asks for it. */
const FREE: Record<string, ComponentType> = {
  toaster: dynamic(() => import('@/lab/demos/toaster').then((m) => m.ToasterDemo), { ssr: false }),
  panels: dynamic(() => import('@/lab/demos/panels').then((m) => m.PanelsDemo), { ssr: false }),
  dialog: dynamic(() => import('@/lab/demos/overlays').then((m) => m.DialogDemo), { ssr: false }),
  confirm: dynamic(() => import('@/lab/demos/overlays').then((m) => m.ConfirmDemo), { ssr: false }),
  popover: dynamic(() => import('@/lab/demos/overlays').then((m) => m.PopoverDemo), { ssr: false }),
  tooltip: dynamic(() => import('@/lab/demos/overlays').then((m) => m.TooltipDemo), { ssr: false }),
  dropdown: dynamic(() => import('@/lab/demos/overlays').then((m) => m.DropdownDemo), { ssr: false }),
  'context-menu': dynamic(() => import('@/lab/demos/overlays').then((m) => m.ContextDemo), { ssr: false }),
  sheet: dynamic(() => import('@/lab/demos/overlays').then((m) => m.SheetDemo), { ssr: false }),
  hovercard: dynamic(() => import('@/lab/demos/overlays').then((m) => m.HoverCardDemo), { ssr: false }),
  scaffold: dynamic(() => import('@/lab/demos/agent').then((m) => m.ScaffoldDemo), { ssr: false }),
  prompt: dynamic(() => import('@/lab/demos/inputs').then((m) => m.PromptDemo), { ssr: false }),
  tree: dynamic(() => import('@/lab/demos/agent').then((m) => m.TreeDemo), { ssr: false }),
  plan: dynamic(() => import('@/lab/demos/plan').then((m) => m.PlanDemo), { ssr: false }),
  models: dynamic(() => import('@/lab/demos/models').then((m) => m.ModelsDemo), { ssr: false }),
  voice: dynamic(() => import('@/lab/demos/voice').then((m) => m.VoiceDemo), { ssr: false }),
  select: dynamic(() => import('@/lab/demos/menus').then((m) => m.SelectDemo), { ssr: false }),
  rename: dynamic(() => import('@/lab/demos/menus').then((m) => m.RenameDemo), { ssr: false }),
  code: dynamic(() => import('@/lab/demos/inputs').then((m) => m.CodeDemo), { ssr: false }),
  stepper: dynamic(() => import('@/lab/demos/controls').then((m) => m.StepperDemo), { ssr: false }),
  tags: dynamic(() => import('@/lab/demos/showcase').then((m) => m.TagsDemo), { ssr: false }),
  upload: dynamic(() => import('@/lab/demos/showcase').then((m) => m.UploadDemo), { ssr: false }),
  inbox: dynamic(() => import('@/lab/demos/controls').then((m) => m.InboxDemo), { ssr: false }),
  undo: dynamic(() => import('@/lab/demos/showcase').then((m) => m.UndoDemo), { ssr: false }),
  feedback: dynamic(() => import('@/lab/demos/showcase').then((m) => m.FeedbackDemo), { ssr: false }),
  command: dynamic(() => import('@/lab/demos/command').then((m) => m.CommandDemo), { ssr: false }),
  presence: dynamic(() => import('@/lab/demos/presence').then((m) => m.PresenceDemo), { ssr: false }),
  buttons: dynamic(() => import('@/lab/demos/menus').then((m) => m.ButtonsDemo), { ssr: false }),
  tabs: dynamic(() => import('@/lab/demos/essentials').then((m) => m.TabsDemo), { ssr: false }),
  waitlist: dynamic(() => import('@/lab/demos/site').then((m) => m.WaitlistDemo), { ssr: false }),
  versions: dynamic(() => import('@/lab/demos/small').then((m) => m.VersionsDemo), { ssr: false }),
  context: dynamic(() => import('@/lab/demos/small').then((m) => m.ContextDemo), { ssr: false }),
  run: dynamic(() => import('@/lab/demos/small').then((m) => m.RunDemo), { ssr: false }),
  thinking: dynamic(() => import('@/lab/demos/small').then((m) => m.ThinkingDemo), { ssr: false }),
  typing: dynamic(() => import('@/lab/demos/small').then((m) => m.TypingDemo), { ssr: false }),
  hold: dynamic(() => import('@/lab/demos/small').then((m) => m.HoldDemo), { ssr: false }),
  chips: dynamic(() => import('@/lab/demos/small').then((m) => m.ChipsDemo), { ssr: false }),
  files: dynamic(() => import('@/lab/demos/small').then((m) => m.FilesDemo), { ssr: false }),
  toasts: dynamic(() => import('@/lab/demos/small').then((m) => m.ToastsDemo), { ssr: false }),
  retry: dynamic(() => import('@/lab/demos/small').then((m) => m.RetryDemo), { ssr: false }),
}

/** Every demo by component id: the free ones above, and Pro's from Detent Pro (or a locked stand-in without it). */
export const DEMOS: Record<string, ComponentType> = { ...FREE, ...PRO_DEMOS }

/** Gallery spotlights: for big components, one moment shown large and alone. Everything else shows its full demo. */
export { SPOTS }
