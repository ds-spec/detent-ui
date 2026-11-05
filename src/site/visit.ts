'use client'

export type Visit = { start: number; pages: string[]; cls: number }

const KEY = 'detent.visit'
const fresh = (): Visit => ({ start: Date.now(), pages: [], cls: 0 })

export function readVisit(): Visit {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) ?? 'null')
    if (v && Array.isArray(v.pages) && typeof v.start === 'number') return { cls: 0, ...v }
  } catch {
  }
  return fresh()
}

function write(v: Visit) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(v))
  } catch {
  }
}

export function recordPage(path: string) {
  const v = readVisit()
  if (v.pages[v.pages.length - 1] !== path) v.pages = [...v.pages, path].slice(-60)
  write(v)
  watchShift()
}

let watching = false
function watchShift() {
  if (watching || typeof PerformanceObserver === 'undefined' || !PerformanceObserver.supportedEntryTypes?.includes('layout-shift')) return
  watching = true
  new PerformanceObserver((list) => {
    let add = 0
    for (const e of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) if (!e.hadRecentInput) add += e.value
    if (!add) return
    const v = readVisit()
    v.cls += add
    write(v)
  }).observe({ type: 'layout-shift', buffered: true })
}
