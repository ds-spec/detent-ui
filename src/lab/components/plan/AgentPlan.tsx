'use client'

import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode, Ref } from 'react'
import { AnimatePresence, Reorder, motion, useDragControls, useMotionValue, useTransform } from 'motion/react'
import { Check, ChevronDown, Close, Grip, Play, Plus } from '../../icons'
import { useSize, useStack } from '../../lib/hooks'
import { ease, spring } from '../../lib/motion'
import { Button } from '../../ui/Button'
import { Kbd } from '../../ui/Kbd'
import { RollingText } from '../../ui/RollingText'

export type StepStatus = 'pending' | 'running' | 'done'
export type PlanStep = { id: string; title: string; status: StepStatus; notes?: string[]; secs?: number }
export type PlanMode = 'draft' | 'running' | 'done'
export type PlanHandle = { fold(v: boolean): void }

/** The card's width when there's room for it; narrower containers get all they have. */
const W = 420
const H = 520
const PILL = { w: 316, h: 48 }
const NOTE = 24

/**
 * The plan an agent proposes, reviewed before it runs and watched while it does.
 *
 * In draft you can reorder steps by their handle (or ⌥↑ ↓), rename them in place, drop
 * them, or add your own. Running, the current step opens to show what it's doing; each step
 * that finishes lands a check and closes up into a quiet line, so the work in progress
 * stays near the top. When everything is done the card folds into a pill you can open
 * again. The card never changes size while it works; only the fold does, and it springs.
 */
export function AgentPlan({
  goal,
  mode,
  steps,
  onStepsChange,
  onRun,
  onStop,
  onRunAgain,
  ref,
}: {
  /** What the plan is for, as its title. */
  goal: string
  /** Draft while it can be edited, running while it works, done once it's finished. */
  mode: PlanMode
  /** The steps, in order, each with its status and any notes. */
  steps: PlanStep[]
  /** Called with the steps after a person adds, edits, removes or reorders one. */
  onStepsChange: (s: PlanStep[]) => void
  /** Called when a person runs the plan. */
  onRun: () => void
  /** Called when a person stops it. */
  onStop: () => void
  /** Called when a person runs a finished plan again. */
  onRunAgain: () => void
  ref?: Ref<PlanHandle>
}) {
  const [folded, setFolded] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  // The card's live size. The pill sits at its top-left at the pill's own size and follows it by
  // transform, centred down and with its chevron at the right edge, so folding moves nothing in the layout.
  // How much room the plan has: its design width, or less in a narrower container.
  const room = useRef<HTMLDivElement>(null)
  const { w: roomW } = useSize(room)
  const cardW = roomW ? Math.min(W, roomW) : W
  const pillW = Math.min(PILL.w, cardW)
  const cw = useMotionValue(W)
  const ch = useMotionValue(H)
  const pillY = useTransform(ch, (v) => (v - PILL.h) / 2)
  const chevronX = useTransform(cw, (v) => v - pillW)
  // Steps open and close by their own height and are stacked by transform, so one changing never moves the others in the layout.
  const stack = useRef<HTMLUListElement>(null)
  useStack(stack)
  useImperativeHandle(ref, () => ({ fold: setFolded }))

  // Finishing folds the card away after a beat; starting over opens it, as the mode changes.
  const [seenMode, setSeenMode] = useState(mode)
  if (seenMode !== mode) {
    setSeenMode(mode)
    if (mode !== 'done') setFolded(false)
  }
  useEffect(() => {
    if (mode !== 'done') return
    const t = setTimeout(() => setFolded(true), 1100)
    return () => clearTimeout(t)
  }, [mode])

  const done = steps.filter((s) => s.status === 'done').length
  // The step in hand: the running one, or between steps, the next one up.
  const running = steps.findIndex((s) => s.status === 'running')
  const pending = steps.findIndex((s) => s.status === 'pending')
  const current = running >= 0 ? running : pending >= 0 ? pending : steps.length - 1
  const secs = steps.reduce((n, s) => n + (s.status === 'pending' ? 0 : (s.secs ?? 0)), 0)
  const draft = mode === 'draft'

  const move = (id: string, d: number) => {
    const i = steps.findIndex((s) => s.id === id)
    const j = i + d
    if (j < 0 || j >= steps.length) return
    const next = [...steps]
    ;[next[i], next[j]] = [next[j], next[i]]
    onStepsChange(next)
  }
  const rename = (id: string, title: string) => {
    setEditing(null)
    const t = title.trim()
    onStepsChange(t ? steps.map((s) => (s.id === id ? { ...s, title: t } : s)) : steps.filter((s) => s.id !== id))
  }
  const add = () => {
    const id = `step-${Date.now()}`
    onStepsChange([...steps, { id, title: '', status: 'pending' }])
    setEditing(id)
  }

  const action = draft ? (
    <Button size="sm" variant="primary" onClick={onRun} disabled={!steps.length}>
      <Play size={12} />
      Run plan
      <span className="flex gap-0.5">
        <Kbd onInk>⌘</Kbd>
        <Kbd onInk>↵</Kbd>
      </span>
    </Button>
  ) : mode === 'running' ? (
    <Button size="sm" variant="ghost" onClick={onStop}>
      Stop
    </Button>
  ) : (
    <Button size="sm" variant="secondary" onClick={onRunAgain}>
      Plan again
    </Button>
  )

  const onKey = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && draft && steps.length) {
      e.preventDefault()
      onRun()
    }
  }

  return (
    // The fold anchors to the top, so the pill sits where the card's header was.
    <div ref={room} className="w-[420px] max-w-full">
    <motion.div
      onKeyDown={onKey}
      className="relative overflow-hidden bg-surface shadow-float"
      style={{ width: cw, height: ch }}
      initial={false}
      animate={folded ? { width: pillW, height: PILL.h, borderRadius: PILL.h / 2 } : { width: cardW, height: H, borderRadius: 22 }}
      transition={spring.smooth}
    >
      <AnimatePresence initial={false} mode="popLayout">
        {folded ? (
          <motion.button
            key="pill"
            type="button"
            onClick={() => setFolded(false)}
            aria-label="Show the finished plan"
            className="ring-focus absolute left-0 top-0 flex items-center gap-2.5 rounded-full pl-3 pr-2.5 text-left"
            style={{ width: pillW, height: PILL.h, y: pillY }}
            {...swap}
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-ok text-white">
              <Check size={13} strokeWidth={3} />
            </span>
            <span className="text-callout font-medium text-ink">Plan complete</span>
            <span className="tnum text-footnote text-ink-3">
              {steps.length} steps · {clock(secs)}
            </span>
            <span className="flex-1" />
            <motion.span className="flex" style={{ x: chevronX }}>
              <ChevronDown size={14} className="text-ink-3" />
            </motion.span>
          </motion.button>
        ) : (
          <motion.div key="card" className="absolute left-0 top-0 flex flex-col" style={{ width: cardW, height: H }} {...swap}>
            <header className="px-5 pb-3 pt-5">
              <div className="flex items-center justify-between">
                <span className="text-caption font-medium text-ink-3">{draft ? 'Proposed plan' : mode === 'running' ? 'Running plan' : 'Finished plan'}</span>
                <Progress done={done} total={steps.length} />
              </div>
              <p className="mt-1.5 text-title text-ink">{goal}</p>
              <p className="tnum mt-1 flex h-5 items-center gap-1 text-footnote text-ink-3">
                {draft ? (
                  `${steps.length} steps · about ${Math.max(1, Math.round(steps.length * 0.4))} min`
                ) : mode === 'running' ? (
                  <>
                    Step {current + 1} of {steps.length} ·<RollingText text={clock(secs)} />
                  </>
                ) : (
                  `Finished in ${clock(secs)}`
                )}
              </p>
            </header>

            <div className="relative min-h-0 flex-1 overflow-y-auto px-3" style={{ scrollbarWidth: 'none' }}>
              <Reorder.Group ref={stack} axis="y" values={steps} onReorder={(s) => draft && onStepsChange(s)} className="relative flex flex-col">
                <AnimatePresence initial={false}>
                  {steps.map((s, i) => (
                    <Row
                      key={s.id}
                      s={s}
                      n={i + 1}
                      draft={draft}
                      editing={editing === s.id}
                      onEdit={() => setEditing(s.id)}
                      onRename={(t) => rename(s.id, t)}
                      onCancel={() => (s.title ? setEditing(null) : rename(s.id, ''))}
                      onRemove={() => onStepsChange(steps.filter((x) => x.id !== s.id))}
                      onMove={(d) => move(s.id, d)}
                    />
                  ))}
                </AnimatePresence>
                {/* Last in the stack, so it rides under the steps as they open and close. */}
                <li role="none" className="list-none">
                  <AnimatePresence initial={false}>
                    {draft && (
                      <motion.button
                        type="button"
                        onClick={add}
                        className="ring-focus flex h-10 w-full items-center gap-3 rounded-[10px] px-2 text-footnote text-ink-3 transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                      >
                        <span className="flex w-[34px] justify-end">
                          <Plus size={14} />
                        </span>
                        Add a step
                      </motion.button>
                    )}
                  </AnimatePresence>
                </li>
              </Reorder.Group>
            </div>

            <footer className="relative flex h-14 shrink-0 items-center gap-3 pl-5 pr-3 shadow-[inset_0_1px_0_var(--line)]">
              <span className="relative h-5 min-w-0 flex-1">
                <AnimatePresence initial={false}>
                  <motion.span key={mode} className="absolute inset-0 flex items-center gap-2 text-footnote text-ink-3" {...swap}>
                    {draft ? (
                      <span className="truncate">Drag to reorder · double-click to rename</span>
                    ) : mode === 'running' ? (
                      <span className="ai-text truncate">{steps[current]?.title ?? 'Wrapping up'}</span>
                    ) : (
                      <>All {steps.length} steps done</>
                    )}
                  </motion.span>
                </AnimatePresence>
              </span>
              {/* The action is pinned to the footer's right edge, so swapping it for a wider or narrower one
                  keeps that edge still; an invisible copy keeps its room in the row. Anchored by right
                  rather than a percentage translate, which drifts when the page zooms the component. */}
              <span aria-hidden className="invisible flex" {...{ inert: true }}>
                {action}
              </span>
              <span className="absolute right-3 top-1/2 flex -translate-y-1/2">{action}</span>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </div>
  )
}

const swap = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.24, delay: 0.08, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: ease.out } },
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

function Progress({ done, total }: { done: number; total: number }) {
  const r = 9
  const all = total > 0 && done === total
  return (
    <span className="flex items-center gap-2">
      <span className="tnum flex font-mono text-caption text-ink-3">
        <RollingText text={String(done)} />/{total}
      </span>
      <svg width="22" height="22" viewBox="0 0 22 22" className="-rotate-90">
        <circle cx="11" cy="11" r={r} fill="none" stroke="var(--line-strong)" strokeWidth="2.5" />
        <motion.circle
          cx="11"
          cy="11"
          r={r}
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: total ? done / total : 0, stroke: all ? 'var(--ok)' : 'var(--accent)' }}
          transition={spring.smooth}
        />
      </svg>
    </span>
  )
}

/* ───────────────────────────── Steps ───────────────────────────── */

function Row({
  s,
  n,
  draft,
  editing,
  onEdit,
  onRename,
  onCancel,
  onRemove,
  onMove,
}: {
  s: PlanStep
  n: number
  draft: boolean
  editing: boolean
  onEdit: () => void
  onRename: (t: string) => void
  onCancel: () => void
  onRemove: () => void
  onMove: (d: number) => void
}) {
  const drag = useDragControls()
  const notes = s.notes ?? []
  const running = s.status === 'running'
  const done = s.status === 'done'
  // Finished steps close up into a quieter line; the running one opens to show its work.
  const top = !draft && done ? 34 : 44
  const height = top + (running ? notes.length * NOTE + 6 : 0)

  const onKey = (e: KeyboardEvent<HTMLLIElement>) => {
    if (!draft || editing || e.target !== e.currentTarget) return
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault()
      onMove(e.key === 'ArrowUp' ? -1 : 1)
      // Keep focus on the step that moved, once it has.
      const el = e.currentTarget
      requestAnimationFrame(() => el.focus())
    } else if (e.key === 'Enter') {
      e.preventDefault()
      onEdit()
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault()
      onRemove()
    }
  }

  return (
    <Reorder.Item
      value={s}
      layout="position"
      dragListener={false}
      dragControls={drag}
      tabIndex={draft ? 0 : -1}
      onKeyDown={onKey}
      className="ring-focus group/step relative list-none rounded-[10px] bg-surface"
      whileDrag={{ boxShadow: 'var(--elev-float)', zIndex: 5 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, height }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ height: spring.smooth, opacity: { duration: 0.2 } }}
      style={{ overflow: 'hidden' }}
    >
      <motion.div className="flex items-center gap-3 px-2" initial={false} animate={{ height: top }} transition={spring.smooth}>
        {/* The leading slot: a handle and number in draft, the step's state once it runs. */}
        <span className="relative flex h-5 w-[34px] shrink-0 items-center justify-end">
          <AnimatePresence initial={false} mode="popLayout">
            {draft ? (
              <motion.span key="draft" className="flex items-center gap-1" {...glyph}>
                <span
                  onPointerDown={(e) => drag.start(e)}
                  aria-hidden
                  className="flex cursor-grab touch-none text-ink-3 opacity-0 transition-opacity duration-150 active:cursor-grabbing group-hover/step:opacity-100 group-focus-visible/step:opacity-100"
                >
                  <Grip size={14} />
                </span>
                <span className="tnum w-4 text-right font-mono text-caption text-ink-3">{String(n).padStart(2, '0')}</span>
              </motion.span>
            ) : (
              <motion.span key={s.status} className="flex" {...glyph}>
                <State status={s.status} />
              </motion.span>
            )}
          </AnimatePresence>
        </span>

        <span className="min-w-0 flex-1" onDoubleClick={() => draft && onEdit()}>
          {editing ? (
            <Title initial={s.title} onDone={onRename} onCancel={onCancel} />
          ) : (
            <span className={`block truncate text-callout transition-colors duration-300 ${running ? 'font-medium text-ink' : done && !draft ? 'text-ink-3' : 'text-ink-2'}`}>{s.title}</span>
          )}
        </span>

        <span className="flex h-6 w-10 shrink-0 items-center justify-end">
          {draft ? (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${s.title}`}
              className="ring-focus flex size-6 items-center justify-center rounded-[7px] text-ink-3 opacity-0 transition-[opacity,color,background-color] duration-150 hover:bg-surface-2 hover:text-ink focus-visible:opacity-100 group-hover/step:opacity-100"
            >
              <Close size={12} />
            </button>
          ) : s.status !== 'pending' ? (
            // Set right to left so its start is the right edge, and 9s becoming 10s never moves it; plaintext keeps it reading 10s.
            <span className="tnum w-full text-right font-mono text-caption text-ink-3 [direction:rtl] [unicode-bidi:plaintext]">{`${Math.floor(s.secs ?? 0)}s`}</span>
          ) : null}
        </span>
      </motion.div>

      {/* What the running step is doing, one line at a time. */}
      <div className="pl-[54px] pr-3">
        <AnimatePresence initial={false}>
          {running &&
            notes.map((t, i) => (
              <motion.p
                key={t}
                className="flex h-6 items-center gap-2 text-footnote text-ink-3"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                transition={{ duration: 0.28, ease: ease.out }}
              >
                {i < notes.length - 1 ? <Check size={11} strokeWidth={2.8} className="shrink-0 text-ok" /> : <span className="size-[11px] shrink-0 rounded-full border-[1.5px] border-line-strong" />}
                <span className={`truncate ${i === notes.length - 1 ? 'sheen' : ''}`}>{t}</span>
              </motion.p>
            ))}
        </AnimatePresence>
      </div>
    </Reorder.Item>
  )
}

const glyph = {
  initial: { opacity: 0, scale: 0.6 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.6 },
  transition: { type: 'spring', stiffness: 520, damping: 30 } as const,
}

/** Waiting is an empty ring, working is a turning arc, done is a check drawn into a filled dot. */
function State({ status }: { status: StepStatus }): ReactNode {
  if (status === 'pending') return <span className="size-[18px] rounded-full border-[1.5px] border-line-strong" />
  if (status === 'running')
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" className="animate-spin [animation-duration:900ms]">
        <circle cx="9" cy="9" r="7.25" fill="none" stroke="var(--line-strong)" strokeWidth="1.5" />
        <circle cx="9" cy="9" r="7.25" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="12 34" />
      </svg>
    )
  return (
    <span className="flex size-[18px] items-center justify-center rounded-full bg-ink">
      <svg width="10" height="10" viewBox="0 0 10 10">
        <motion.path
          d="M2 5.2 4.1 7.3 8 3"
          fill="none"
          stroke="var(--surface)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.28, delay: 0.08, ease: ease.out }}
        />
      </svg>
    </span>
  )
}

/** Renames in place: same type and size as the title it replaces. Enter keeps, Escape cancels. */
function Title({ initial, onDone, onCancel }: { initial: string; onDone: (t: string) => void; onCancel: () => void }) {
  const [v, setV] = useState(initial)
  const input = useRef<HTMLInputElement>(null)
  const settled = useRef(false)
  useEffect(() => {
    input.current?.focus()
    input.current?.select()
  }, [])
  const finish = (f: () => void) => {
    if (settled.current) return
    settled.current = true
    f()
  }
  return (
    <input
      ref={input}
      value={v}
      placeholder="Describe the step"
      onChange={(e) => setV(e.target.value)}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Enter') finish(() => onDone(v))
        if (e.key === 'Escape') {
          e.preventDefault()
          finish(onCancel)
        }
      }}
      onBlur={() => finish(() => onDone(v))}
      className="-mx-1.5 h-7 w-[calc(100%+12px)] rounded-[7px] bg-surface px-1.5 text-callout text-ink shadow-field outline-none placeholder:text-ink-3"
    />
  )
}
