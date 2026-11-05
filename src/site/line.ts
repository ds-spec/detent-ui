const PIN = 96

export function readingLine(box: HTMLElement, first: HTMLElement) {
  const y = Math.round(PIN + first.getBoundingClientRect().top + first.offsetHeight / 2 - box.getBoundingClientRect().top)
  box.style.setProperty('--read-line', `${y}px`)
  return `-${y}px 0px -${Math.max(0, innerHeight - y - 1)}px 0px`
}

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
