'use client'

import { useEffect, useState } from 'react'
import { DiffReview } from '../components/diff/DiffReview'
import type { Hunk } from '../components/diff/DiffReview'

const STREAM: Hunk[] = [
  {
    id: 'retry',
    scope: 'fetchWithRetry(url)',
    o: 8,
    n: 8,
    lines: [
      ['ctx', 'export async function fetchWithRetry(url: string) {'],
      ['del', '  for (let i = 0; i < 3; i++) {'],
      ['add', '  for (let i = 0; i < MAX_TRIES; i++) {'],
      ['ctx', '    const res = await fetch(url)'],
      ['ctx', '    if (res.ok) return res'],
      ['del', '    await sleep(500)'],
      ['add', '    await sleep(250 * 2 ** i)'],
      ['ctx', '  }'],
    ],
  },
  {
    id: 'tries',
    scope: 'constants',
    o: 2,
    n: 2,
    lines: [
      ['ctx', "import { sleep } from './time'"],
      ['add', 'const MAX_TRIES = 5'],
    ],
  },
]

const TOTAL = STREAM.reduce((n, h) => n + h.lines.length, 0)

/** Lines arrive one at a time and the frame holds still; loops once everything is in. */
export function DiffStreamExample() {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setShown((s) => (s >= TOTAL + 12 ? 0 : s + 1)), 260)
    return () => clearInterval(t)
  }, [])
  return <DiffReview title="Back off between retries" file="src/lib/fetch.ts" hunks={STREAM} shown={Math.min(shown, TOTAL)} size={{ w: 720, h: 380 }} />
}

const ONE: Hunk[] = [
  {
    id: 'tz',
    scope: 'formatDue(date)',
    o: 14,
    n: 14,
    lines: [
      ['ctx', 'export function formatDue(date: Date) {'],
      ['del', "  return date.toLocaleDateString('en-US')"],
      ['add', "  return date.toLocaleDateString('en-US', { timeZone: 'UTC' })"],
      ['ctx', '}'],
    ],
  },
]

/** One hunk, fully written: the verdict and Apply are the whole story. */
export function DiffOneExample() {
  return (
    <div className="flex flex-col items-center gap-3">
      <DiffReview
        title="Show due dates in UTC"
        file="src/lib/dates.ts"
        hunks={ONE}
        size={{ w: 720, h: 300 }}
      />
    </div>
  )
}
