'use client'

import { createContext, useContext } from 'react'

/**
 * The components page puts each demo on a bench: some of its props become live controls, and
 * every callback it fires is logged beside it. A demo joins in through `useBench`: it reads a
 * prop's value with `get` (falling back to its own) and wraps each callback it passes with `on`.
 * Anywhere else, the gallery or a block, there's no bench and both are pass-throughs.
 */
export type Bench = { values: Record<string, unknown>; log: (name: string, args: unknown[]) => void }

export const BenchContext = createContext<Bench | null>(null)

export function useBench() {
  const b = useContext(BenchContext)
  function on<F extends (...args: never[]) => unknown>(name: string, fn: F): F
  function on(name: string): (...args: unknown[]) => void
  function on(name: string, fn?: (...args: unknown[]) => unknown) {
    return (...args: unknown[]) => {
      b?.log(name, args)
      return fn?.(...args)
    }
  }
  return {
    /** A prop's value: the one set on the bench, or the demo's own. */
    get: <T,>(name: string, own: T): T => (b && name in b.values ? (b.values[name] as T) : own),
    on,
    /** Reports a call from inside a handler, for callbacks that can't be wrapped where they're passed. */
    log: (name: string, ...args: unknown[]) => b?.log(name, args),
  }
}
