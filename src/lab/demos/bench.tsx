'use client'

import { createContext, useContext } from 'react'

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
    get: <T,>(name: string, own: T): T => (b && name in b.values ? (b.values[name] as T) : own),
    on,
    log: (name: string, ...args: unknown[]) => b?.log(name, args),
  }
}
