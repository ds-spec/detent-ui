'use client'

import { createContext, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { BenchContext } from '@/lab/demos/bench'

/** One call to a callback. A burst of calls to the same one (a held button, typing) folds into one row, with a count. */
export type Call = { id: number; name: string; args: string; at: number; times: number }

type State = {
  values: Record<string, unknown>
  set: (name: string, v: unknown) => void
  calls: Call[]
  /** Callbacks that have just fired, by the id of their latest call. */
  hot: Record<string, number>
}
const StateContext = createContext<State | null>(null)
export const useBenchState = () => useContext(StateContext)

/**
 * The bench for one component: the prop values set on the page, and the log of what it called.
 * The demo reads the first and writes the second through the lab's `BenchContext`; the props
 * panel reads both through this one. Remount it per component and it starts clean.
 */
export function BenchProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [calls, setCalls] = useState<Call[]>([])
  const [hot, setHot] = useState<Record<string, number>>({})
  const n = useRef(0)

  const lab = useMemo(
    () => ({
      values,
      log: (name: string, args: unknown[]) => {
        const id = ++n.current
        const at = Date.now()
        const text = args.map((a) => fmt(a)).join(', ')
        setCalls((c) => {
          const [last, ...rest] = c
          // The same callback again within a moment updates its row in place instead of adding one.
          if (last && last.name === name && at - last.at < 700) return [{ ...last, args: text, at, times: last.times + 1 }, ...rest]
          return [{ id, name, args: text, at, times: 1 }, ...c].slice(0, 6)
        })
        setHot((h) => ({ ...h, [name]: id }))
        setTimeout(() => setHot((h) => (h[name] === id ? Object.fromEntries(Object.entries(h).filter(([k]) => k !== name)) : h)), 900)
      },
    }),
    [values],
  )
  const state = useMemo(() => ({ values, set: (name: string, v: unknown) => setValues((x) => ({ ...x, [name]: v })), calls, hot }), [values, calls, hot])

  return (
    <BenchContext.Provider value={lab}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </BenchContext.Provider>
  )
}

/** A value as it would read in a log line: short, and never the whole of a big object. */
function fmt(v: unknown, deep = false): string {
  if (typeof v === 'string') return JSON.stringify(v.length > 30 ? `${v.slice(0, 29)}…` : v)
  if (typeof v === 'number') return String(Math.round(v * 100) / 100)
  if (typeof v === 'boolean' || v === null || v === undefined) return String(v)
  if (typeof v === 'function') return 'fn'
  if (v instanceof Date) return `Date(${v.toISOString().slice(0, 10)})`
  if (typeof File !== 'undefined' && v instanceof File) return `File(${JSON.stringify(v.name)})`
  if (Array.isArray(v)) {
    if (deep) return `[${v.length}]`
    return v.length <= 3 && v.every((x) => typeof x !== 'object' || x === null) ? `[${v.map((x) => fmt(x, true)).join(', ')}]` : `[${v.length} items]`
  }
  if (typeof v === 'object') {
    if ('nativeEvent' in v) return 'event'
    if (deep) return '{…}'
    const keys = Object.keys(v)
    return `{ ${keys
      .slice(0, 2)
      .map((k) => `${k}: ${fmt((v as Record<string, unknown>)[k], true)}`)
      .join(', ')}${keys.length > 2 ? ', …' : ''} }`
  }
  return String(v)
}
