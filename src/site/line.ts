/** Where the stage beside an index pins: its sticky top (top-24). */
const PIN = 96

/**
 * Where a scrolled index reads its names: level with the first name at the moment the stage
 * beside it pins. Until then the names and the stage scroll together and the first name stays
 * the current one, so scrolling down to see the stage whole never skips past it; after, each name
 * settles on that same line, level with the caption over the stage. It only changes where the
 * page reads, never the layout. Sets `--read-line` on the box for the snap points, and returns the band
 * the observer watches.
 */
export function readingLine(box: HTMLElement, first: HTMLElement) {
  const y = Math.round(PIN + first.getBoundingClientRect().top + first.offsetHeight / 2 - box.getBoundingClientRect().top)
  box.style.setProperty('--read-line', `${y}px`)
  return `-${y}px 0px -${Math.max(0, innerHeight - y - 1)}px 0px`
}

/** Watches `rows` across the reading line, rebuilt when the window's height changes the line. */
export function watchLine(box: HTMLElement, rows: HTMLElement[], seen: (el: HTMLElement) => void) {
  let io: IntersectionObserver | null = null
  const build = () => {
    io?.disconnect()
    const first = rows.find((r) => r.offsetHeight)
    if (!first) return
    io = new IntersectionObserver((all) => all.forEach((s) => s.isIntersecting && seen(s.target as HTMLElement)), { rootMargin: readingLine(box, first) })
    rows.forEach((r) => io!.observe(r))
  }
  build()
  addEventListener('resize', build)
  return () => {
    removeEventListener('resize', build)
    io?.disconnect()
  }
}
