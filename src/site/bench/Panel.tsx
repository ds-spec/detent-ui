'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Api, PropDoc } from '@/catalog/api'
import { KNOBS } from '@/catalog/knobs'
import type { Knob } from '@/catalog/knobs'
import { Check, Copy } from '@/lab/icons'
import { Stepper } from '@/lab/components/stepper/Stepper'
import { Switch } from '@/lab/ui/Switch'
import { useBenchState } from './state'
import type { Call } from './state'

/**
 * A component's props beside it, live. Every prop is listed from the source: its name, its type,
 * what it does. The ones the demo lets you change are controls, and changing one changes the
 * component as you watch. Callbacks light up as they fire, and each call lands in the log at
 * the foot with what it was called with. Under it all, the usage writes itself from what's set.
 */
export function PropsPanel({ id, api }: { id: string; api: Api }) {
  const bench = useBenchState()
  const knobs = KNOBS[id] ?? {}
  const props = api.props.filter((p) => p.name !== 'ref')
  const value = (p: PropDoc) => (bench && p.name in bench.values ? bench.values[p.name] : knobs[p.name]?.value)
  const events = props.filter(isEvent)
  return (
    <>
      <aside aria-label="Props" className="flex min-h-0 flex-col overflow-hidden rounded-[30px] bg-surface shadow-[var(--card-edge)] 2xl:col-start-2 2xl:row-start-1">
        <div className="flex h-14 shrink-0 items-center justify-between px-6">
          <p className="text-headline text-ink">
            Props <span className="tnum font-normal text-ink-3">{props.length}</span>
          </p>
          {Object.keys(knobs).length > 0 && <p className="text-caption text-ink-3">Change any marked ●</p>}
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto px-3 pb-2 [scrollbar-width:thin]">
          {props.map((p) => (
            <Row key={p.name} p={p} knob={knobs[p.name]} value={value(p)} set={(v) => bench?.set(p.name, v)} changed={!!knobs[p.name] && value(p) !== knobs[p.name].value} pulse={bench?.hot[p.name]} />
          ))}
          {api.methods && (
            <li className="px-3 pt-4 text-caption text-ink-3">
              Through a ref: {api.methods.map((m, i) => (
                <code key={m} className="font-mono text-ink-2">
                  {i ? ', ' : ''}
                  {m.split('(')[0]}()
                </code>
              ))}
            </li>
          )}
          {api.extends && (
            <li className="px-3 pt-3 text-caption text-ink-3">
              Also takes every prop of <code className="font-mono text-ink-2">&lt;{api.extends}&gt;</code>.
            </li>
          )}
        </ul>
        <Events calls={bench?.calls ?? []} listening={events.length > 0} />
      </aside>
      <Usage api={api} props={props} knobs={knobs} value={value} />
    </>
  )
}

const isEvent = (p: PropDoc) => /^on[A-Z]/.test(p.name) && p.type.includes('=>')

function Row({ p, knob, value, set, changed, pulse }: { p: PropDoc; knob?: Knob; value: unknown; set: (v: unknown) => void; changed: boolean; pulse?: number }) {
  return (
    <li className="flex min-h-[60px] items-center gap-4 px-3 py-2.5 shadow-[inset_0_-1px_0_var(--line)] last:shadow-none">
      <div className="min-w-0 flex-1">
        <p className="flex min-w-0 items-center gap-2">
          {knob && <span aria-hidden className={`size-1.5 shrink-0 rounded-full transition-colors ${changed ? 'bg-[var(--accent)]' : 'bg-[color-mix(in_oklch,var(--ink)_22%,transparent)]'}`} />}
          <code className={`shrink-0 font-mono text-[13px] ${changed ? 'text-[var(--accent-ink)]' : 'text-ink'}`}>{p.name}</code>
          <code className="min-w-0 truncate font-mono text-[11.5px] text-ink-3" title={p.type}>
            {p.type}
          </code>
          {p.required && <span className="shrink-0 text-[11px] text-ink-3">Required</span>}
        </p>
        {p.note && <p className="mt-0.5 line-clamp-2 text-caption text-ink-3">{p.note}</p>}
      </div>
      <div className="flex shrink-0 justify-end">{knob ? <Control k={knob} value={value} set={set} name={p.name} /> : isEvent(p) ? <Fired pulse={pulse} /> : p.default ? <code className="max-w-[120px] truncate font-mono text-[11.5px] text-ink-3">{p.default}</code> : null}</div>
    </li>
  )
}

function Control({ k, value, set, name }: { k: Knob; value: unknown; set: (v: unknown) => void; name: string }) {
  if ('options' in k)
    return (
      <span role="radiogroup" aria-label={name} className="flex h-8 items-center rounded-full bg-surface-2 p-0.5">
        {k.options.map((o) => (
          <button key={String(o)} type="button" role="radio" aria-checked={value === o} onClick={() => set(o)} className={`ring-focus h-7 rounded-full px-2.5 text-caption font-medium transition-colors ${value === o ? 'bg-plate text-ink shadow-raised' : 'text-ink-3 hover:text-ink-2'}`}>
            {String(o)}
          </button>
        ))}
      </span>
    )
  if (typeof k.value === 'boolean') return <Switch checked={value as boolean} onChange={set} label={name} />
  if ('range' in k)
    return (
      <span className="origin-right scale-[0.86]">
        <Stepper label={name} value={value as number} onChange={set} min={k.range[0]} max={k.range[1]} step={k.step} />
      </span>
    )
  return (
    <input
      aria-label={name}
      value={value as string}
      onChange={(e) => set(e.target.value)}
      spellCheck={false}
      className="h-8 w-[140px] rounded-[9px] bg-surface-2 px-2.5 font-mono text-[12px] text-ink outline-none transition-shadow focus:shadow-[0_0_0_1px_color-mix(in_oklch,var(--accent)_55%,transparent),0_0_0_4px_color-mix(in_oklch,var(--accent)_14%,transparent)]"
    />
  )
}

/** A callback's light: quiet while it listens, and a pulse each time it fires. */
function Fired({ pulse }: { pulse?: number }) {
  const on = pulse !== undefined
  return (
    <span className={`flex items-center gap-1.5 text-caption transition-colors duration-300 ${on ? 'text-[var(--accent-ink)]' : 'text-ink-3'}`}>
      <span className="relative flex size-2">
        <span className={`absolute inset-0 rounded-full transition-colors duration-300 ${on ? 'bg-[var(--accent)]' : 'bg-[color-mix(in_oklch,var(--ink)_18%,transparent)]'}`} />
        {on && <span key={pulse} className="absolute -inset-1 animate-ping rounded-full bg-[color-mix(in_oklch,var(--accent)_40%,transparent)]" />}
      </span>
      {on ? 'Fired' : 'Listening'}
    </span>
  )
}

/** Every call a callback gets, newest on top, each in a slot of its own so nothing below it jumps. */
function Events({ calls, listening }: { calls: Call[]; listening: boolean }) {
  // The clock starts after the first paint, so the server and the first render agree.
  const [now, setNow] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const ago = (at: number) => {
    const s = now ? Math.max(0, Math.round((now - at) / 1000)) : 0
    return s < 2 ? 'now' : `${s}s`
  }
  return (
    <div className="h-[176px] shrink-0 bg-[color-mix(in_oklch,var(--ink)_2.5%,transparent)] px-6 pt-4 shadow-[inset_0_1px_0_var(--line)]">
      <p className="flex items-center gap-2 text-footnote font-medium text-ink">
        Events
        {listening && <span className="size-1.5 rounded-full bg-[var(--ok)] motion-safe:animate-pulse" />}
        <span className="truncate font-normal text-ink-3">{listening ? 'What it calls, as it calls it' : 'It doesn’t call back'}</span>
      </p>
      <div className="relative mt-2.5 h-[120px] overflow-hidden">
        {listening && calls.length === 0 && <p className="absolute inset-x-0 top-0 text-caption text-ink-3">Nothing yet. Press something on the left.</p>}
        <AnimatePresence initial={false}>
          {calls.slice(0, 4).map((c, i) => (
            <motion.p
              key={c.id}
              className="absolute inset-x-0 top-0 flex h-[30px] items-center gap-3 font-mono text-[12px]"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1 - i * 0.2, y: i * 30 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 520, damping: 40 }}
            >
              <span className="min-w-0 flex-1 truncate">
                <span className="text-[var(--accent-ink)]">{c.name}</span>
                <span className="text-ink-3">(</span>
                <span className="text-ink-2">{c.args}</span>
                <span className="text-ink-3">)</span>
                {c.times > 1 && <span className="tnum ml-2 text-ink-3">×{c.times}</span>}
              </span>
              <span className="tnum shrink-0 text-ink-3">{ago(c.at)}</span>
            </motion.p>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

/** How a value is written as a JSX prop. */
const attr = (name: string, v: unknown) => (typeof v === 'string' ? `${name}="${v.replace(/"/g, '\\"')}"` : v === true ? name : `${name}={${String(v)}}`)
/** How a value is written in source, to compare with the default read from it. */
const literal = (v: unknown) => (typeof v === 'string' ? `'${v}'` : String(v))

/** The usage, written from what's set: every required prop, and any control that's away from the component's own default. Lines you changed are marked. */
function Usage({ api, props, knobs, value }: { api: Api; props: PropDoc[]; knobs: Record<string, Knob>; value: (p: PropDoc) => unknown }) {
  const [copied, setCopied] = useState(false)
  const lines: { text: string; changed?: boolean }[] = []
  for (const p of props) {
    const k = knobs[p.name]
    if (k) {
      const v = value(p)
      const changed = v !== k.value
      if (p.required || changed || literal(v) !== p.default) lines.push({ text: `  ${attr(p.name, v)}`, changed })
    } else if (p.required && p.name !== 'children') lines.push({ text: `  ${p.name}={${p.name}}` })
  }
  const takesChildren = props.some((p) => p.name === 'children' && p.required)
  const all = lines.length ? [{ text: `<${api.component}` }, ...lines, { text: takesChildren ? '>' : '/>' }, ...(takesChildren ? [{ text: '  …' }, { text: `</${api.component}>` }] : [])] : [{ text: `<${api.component} />` }]
  const copy = () => {
    void navigator.clipboard?.writeText(all.map((l) => l.text).join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }
  return (
    <section aria-label="Usage" className="overflow-hidden rounded-[26px] bg-surface shadow-[var(--card-edge)] 2xl:col-span-2">
      <div className="flex h-12 items-center justify-between px-6 shadow-[inset_0_-1px_0_var(--line)]">
        <p className="text-footnote font-medium text-ink">
          Usage <span className="font-normal text-ink-3">· follows the props you set</span>
        </p>
        <button type="button" onClick={copy} className="ring-focus flex h-8 items-center rounded-full px-3 text-caption font-medium text-ink-2 hover:bg-surface-2 hover:text-ink">
          <span className="grid">
            <span className={`col-start-1 row-start-1 flex items-center gap-1.5 transition-opacity ${copied ? 'opacity-0' : ''}`}>
              <Copy size={13} /> Copy
            </span>
            <span className={`col-start-1 row-start-1 flex items-center gap-1.5 text-ok transition-opacity ${copied ? '' : 'opacity-0'}`}>
              <Check size={13} /> Copied
            </span>
          </span>
        </button>
      </div>
      <pre className="overflow-x-auto py-4 font-mono text-[13px] leading-[22px]" translate="no">
        {all.map((l, i) => (
          <div key={i} className="relative px-6 transition-colors duration-300" style={{ background: l.changed ? 'color-mix(in oklch, var(--accent) 7%, transparent)' : undefined }}>
            <span aria-hidden className={`absolute inset-y-0 left-0 w-[2px] bg-[var(--accent)] transition-opacity duration-300 ${l.changed ? '' : 'opacity-0'}`} />
            <span className={l.changed ? 'text-ink' : 'text-ink-2'}>{l.text}</span>
          </div>
        ))}
      </pre>
    </section>
  )
}
