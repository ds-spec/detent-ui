'use client'

/**
 * This tab's visit: when it began, the pages seen in order, and how far the layout has shifted
 * across all of them. It lives in sessionStorage, so it ends with the tab and never leaves the
 * browser. The footer tells it back.
 */
export type Visit = { start: number; pages: string[]; cls: number }

const KEY = 'detent.visit'
const fresh = (): Visit => ({ start: Date.now(), pages: [], cls: 0 })

export function readVisit(): Visit {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) ?? 'null')
    if (v && Array.isArray(v.pages) && typeof v.start === 'number') return { cls: 0, ...v }
  } catch {
    /* Storage blocked: every page is the first. */
  }
  return fresh()
}

function write(v: Visit) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(v))
  } catch {
    /* Storage blocked: the footer simply knows less. */
  }
}

export function recordPage(path: string) {
  const v = readVisit()
  if (v.pages[v.pages.length - 1] !== path) v.pages = [...v.pages, path].slice(-60)
  write(v)
  watchShift()
}

// One observer per document, so remounting the footer never counts a shift twice.
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
