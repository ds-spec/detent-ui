'use client'

import { useSyncExternalStore } from 'react'
import { MANAGERS } from '@/catalog/site'
import type { Manager } from '@/catalog/site'

const KEY = 'detent:package-manager'
const listeners = new Set<() => void>()

const read = (): Manager => {
  try {
    const v = localStorage.getItem(KEY) as Manager | null
    return v && MANAGERS.includes(v) ? v : 'npm'
  } catch {
    return 'npm'
  }
}

export function useManager() {
  const value = useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      const storage = (e: StorageEvent) => e.key === KEY && fn()
      addEventListener('storage', storage)
      return () => {
        listeners.delete(fn)
        removeEventListener('storage', storage)
      }
    },
    read,
    () => 'npm' as Manager,
  )
  const set = (m: Manager) => {
    try {
      localStorage.setItem(KEY, m)
    } catch {
    }
    listeners.forEach((fn) => fn())
  }
  return [value, set] as const
}
