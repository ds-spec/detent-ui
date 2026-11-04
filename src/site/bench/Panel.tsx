'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { Api, PropDoc } from '@/catalog/api'
import { KNOBS } from '@/catalog/knobs'
import type { Knob } from '@/catalog/knobs'
import { Check, Copy } from '@/lab/icons'
import { Stepper } from '@/lab/components/stepper/Stepper'
import { Switch } from '@/lab/ui/Switch'
import { track } from '@/site/track'
import { useBenchState } from './state'
import { BTN, useSideNew } from '../shell/side'
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
  const live = Object.keys(knobs).length > 0
  // The columns, shared by the head and every row so they line up: prop, what it does, default, and a control when the demo has one.
  const side = useSideNew()
  if (side) return <PropsDocs api={api} props={props} knobs={knobs} value={value} live={live} bench={bench} events={events} />
  const cols = live ? 'md:grid-cols-[minmax(150px,200px)_minmax(0,1fr)_minmax(110px,160px)_190px]' : 'md:grid-cols-[minmax(150px,200px)_minmax(0,1fr)_minmax(110px,180px)]'
  return (
    <>
      <section aria-label="Props" className="overflow-hidden rounded-[26px] bg-surface shadow-[var(--card-edge)]">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-6 pb-4 pt-5">
          <p className="text-headline text-ink">
            Props <span className="tnum font-normal text-ink-3">{props.length}</span>
          </p>
          <p className="text-footnote text-ink-3">{live ? 'Read from the source. Change one under Try it and the preview follows.' : 'Read from the source.'}</p>
        </div>
        <div role="table" aria-label="Props">
          <div role="row" className={`hidden gap-6 px-6 pb-2 text-caption text-ink-3 shadow-[inset_0_-1px_0_var(--line)] md:grid ${cols}`}>
            <span role="columnheader">Prop</span>
            <span role="columnheader">Description</span>
            <span role="columnheader">Default</span>
            {live && <span role="columnheader" className="text-right">Try it</span>}
          </div>
          {props.map((p) => (
            <Row key={p.name} p={p} cols={cols} live={live} knob={knobs[p.name]} value={value(p)} set={(v) => bench?.set(p.name, v)} changed={!!knobs[p.name] && value(p) !== knobs[p.name].value} pulse={bench?.hot[p.name]} />
          ))}
        </div>
        {(api.methods || api.extends) && (
          <div className="flex flex-col gap-1.5 px-6 py-4 text-footnote text-ink-3 shadow-[inset_0_1px_0_var(--line)]">
            {api.methods && (
              <p>
                Through a ref:{' '}
                {api.methods.map((m, i) => (
                  <code key={m} className="font-mono text-ink-2">
                    {i ? ', ' : ''}
                    {m.split('(')[0]}()
                  </code>
                ))}
              </p>
            )}
            {api.extends && (
              <p>
                Also takes every prop of <code className="font-mono text-ink-2">&lt;{api.extends}&gt;</code>.
              </p>
            )}
          </div>
        )}
        {events.length > 0 && <Events calls={bench?.calls ?? []} />}
      </section>
      <Usage api={api} props={props} knobs={knobs} value={value} />
    </>
  )
}

const isEvent = (p: PropDoc) => /^on[A-Z]/.test(p.name) && p.type.includes('=>')

/** One prop: its name and whether it's needed; what it does with its type under it; its default; and, if the demo has one, the control. */
function Row({ p, cols, live, knob, value, set, changed, pulse }: { p: PropDoc; cols: string; live: boolean; knob?: Knob; value: unknown; set: (v: unknown) => void; changed: boolean; pulse?: number }) {
  return (
    <div role="row" className={`grid grid-cols-1 gap-x-6 gap-y-2 px-6 py-4 shadow-[inset_0_-1px_0_var(--line)] last:shadow-none md:items-start ${cols}`}>
      <div role="cell" className="flex flex-wrap items-center gap-2 md:pt-px">
        <code className={`font-mono text-[13.5px] transition-colors ${changed ? 'text-[var(--accent-ink)]' : 'text-ink'}`}>{p.name}</code>
        {p.required && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-2">Required</span>}
      </div>
      <div role="cell" className="min-w-0">
        {p.note && <p className="text-callout leading-[1.55] text-ink-2">{p.note}</p>}
        <code className={`inline-block max-w-full break-words rounded-[6px] bg-surface-2 px-1.5 py-0.5 font-mono text-[12px] leading-[1.5] text-ink-3 ${p.note ? 'mt-1.5' : ''}`}>{p.type}</code>
      </div>
      <div role="cell" className="flex items-center gap-2 md:block md:pt-0.5">
        <span className="text-caption text-ink-3 md:hidden">Default</span>
        {p.default ? <code className="break-words font-mono text-[12.5px] text-ink-2">{p.default}</code> : <span className="text-callout text-ink-3">—</span>}
      </div>
      {live && (
        <div role="cell" className={`min-h-8 items-center md:flex md:justify-end ${knob || isEvent(p) ? 'flex' : 'hidden'}`}>
          {knob ? <Control k={knob} value={value} set={set} name={p.name} /> : isEvent(p) ? <Fired pulse={pulse} /> : null}
        </div>
      )}
      {!live && isEvent(p) && (
        <div className="md:col-start-2">
          <Fired pulse={pulse} />
        </div>
      )}
    </div>
  )
}

function Control({ k, value, set, name }: { k: Knob; value: unknown; set: (v: unknown) => void; name: string }) {
  const side = useSideNew()
  if ('options' in k)
    return (
      <span role="radiogroup" aria-label={name} className={`flex h-8 items-center ${side ? `rounded-[10px] p-[3px] ${BTN.track}` : 'rounded-full bg-surface-2 p-0.5'}`}>
        {k.options.map((o) => (
          <button key={String(o)} type="button" role="radio" aria-checked={value === o} onClick={() => set(o)} className={`ring-focus px-2.5 text-caption font-medium transition-colors ${side ? 'h-full rounded-[7px]' : 'h-7 rounded-full'} ${value === o ? (side ? BTN.plate : 'bg-plate text-ink shadow-raised') : 'text-ink-3 hover:text-ink-2'}`}>
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
function Events({ calls }: { calls: Call[] }) {
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
        <span className="size-1.5 rounded-full bg-[var(--ok)] motion-safe:animate-pulse" />
        <span className="truncate font-normal text-ink-3">What it calls, as it calls it</span>
      </p>
      <div className="relative mt-2.5 h-[120px] overflow-hidden">
        {calls.length === 0 && <p className="absolute inset-x-0 top-0 text-caption text-ink-3">Nothing yet. Press something on the left.</p>}
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
function Usage({ api, props, knobs, value, flat = false }: { api: Api; props: PropDoc[]; knobs: Record<string, Knob>; value: (p: PropDoc) => unknown; flat?: boolean }) {
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
    track('copy_code', { item: api.component, file: 'props' })
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }
  return (
    <section aria-label="Usage" className={flat ? 'overflow-hidden rounded-[14px] shadow-[0_0_0_1px_var(--line)]' : 'overflow-hidden rounded-[26px] bg-surface shadow-[var(--card-edge)]'}>
      <div className={`flex items-center justify-between shadow-[inset_0_-1px_0_var(--line)] ${flat ? 'h-11 pl-4 pr-1.5' : 'h-12 px-6'}`}>
        {flat ? (
          <p className="font-mono text-[12.5px] text-ink-3">usage.tsx</p>
        ) : (
          <p className="text-footnote font-medium text-ink">
            Usage <span className="font-normal text-ink-3">· follows the props you set</span>
          </p>
        )}
        <button type="button" onClick={copy} className={`ring-focus flex h-8 items-center px-3 text-caption font-medium text-ink-2 hover:text-ink ${flat ? 'rounded-[8px] hover:bg-[var(--shell-hover)]' : 'rounded-full hover:bg-surface-2'}`}>
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
          <div key={i} className={`relative transition-colors ${flat ? 'px-4' : 'px-6'} duration-300`} style={{ background: l.changed ? 'color-mix(in oklch, var(--accent) 7%, transparent)' : undefined }}>
            <span aria-hidden className={`absolute inset-y-0 left-0 w-[2px] bg-[var(--accent)] transition-opacity duration-300 ${l.changed ? '' : 'opacity-0'}`} />
            <span className={l.changed ? 'text-ink' : 'text-ink-2'}>{l.text}</span>
          </div>
        ))}
      </pre>
    </section>
  )
}

/**
 * The props as a page of docs. No table: each prop is a short entry, its name with its type beside
 * it as a soft chip, what it does under that, and its default at the far end. Controls sit at the
 * end of the entry when the demo has one. Hairlines between, nothing boxed.
 */
function PropsDocs({ api, props, knobs, value, live, bench }: { api: Api; props: PropDoc[]; knobs: Record<string, Knob>; value: (p: PropDoc) => unknown; live: boolean; bench: ReturnType<typeof useBenchState>; events: PropDoc[] }) {
  // Callbacks last, after what it shows.
  const shown = [...props.filter((p) => !isEvent(p)), ...props.filter(isEvent)]
  return (
    <>
      <section aria-labelledby="props-h" className="mt-12">
        <div className="flex items-baseline justify-between gap-6">
          <h2 id="props-h" className="text-[18px] font-medium tracking-[-0.015em] text-ink">
            Props <span className="tnum font-normal text-ink-3">{props.length}</span>
          </h2>
          {live && <p className="hidden text-[13px] text-ink-3 sm:block">Change one and the preview follows.</p>}
        </div>
        <dl className="mt-4 shadow-[inset_0_1px_0_var(--line)]">
          {shown.map((p) => {
            const k = knobs[p.name]
            const v = value(p)
            const changed = !!k && v !== k.value
            return (
              <div key={p.name} className="flex flex-col gap-3 py-5 shadow-[inset_0_-1px_0_var(--line)] sm:flex-row sm:items-start sm:gap-8">
                <div className="min-w-0 flex-1">
                  <dt className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                    <code className={`font-mono text-[13.5px] font-medium transition-colors ${changed ? 'text-[var(--accent-ink)]' : 'text-ink'}`}>{p.name}</code>
                    <code className="max-w-full truncate rounded-[6px] bg-[color-mix(in_oklch,var(--ink)_5%,transparent)] px-1.5 py-[3px] font-mono text-[11.5px] leading-none text-ink-2" title={p.type}>
                      {p.type}
                    </code>
                    {p.required && <span className="text-[12px] text-[var(--accent-ink)]">Required</span>}
                  </dt>
                  {p.note && <dd className="mt-2 max-w-[620px] text-[14px] leading-[1.55] text-ink-3">{p.note}</dd>}
                </div>
                <dd className="flex shrink-0 items-center gap-4 sm:min-h-[22px]">
                  {p.default && (
                    <span className="flex items-baseline gap-1.5 text-[12.5px] text-ink-3">
                      Default <code className="font-mono text-ink-2">{p.default}</code>
                    </span>
                  )}
                  {k && <Control k={k} value={v} set={(x) => bench?.set(p.name, x)} name={p.name} />}
                </dd>
              </div>
            )
          })}
        </dl>
        {(api.methods || api.extends) && (
          <div className="mt-4 flex flex-col gap-1 text-[13px] text-ink-3">
            {api.methods && (
              <p>
                Through a ref:{' '}
                {api.methods.map((m, i) => (
                  <code key={m} className="font-mono text-ink-2">
                    {i ? ', ' : ''}
                    {m.split('(')[0]}()
                  </code>
                ))}
              </p>
            )}
            {api.extends && (
              <p>
                Also takes every prop of <code className="font-mono text-ink-2">&lt;{api.extends}&gt;</code>.
              </p>
            )}
          </div>
        )}
      </section>
      <section aria-labelledby="usage-h" className="mt-12">
        <h2 id="usage-h" className="mb-4 text-[18px] font-medium tracking-[-0.015em] text-ink">Usage</h2>
        <Usage api={api} props={props} knobs={knobs} value={value} flat />
      </section>
    </>
  )
}
