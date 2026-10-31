/**
 * Feel: the material layer. Components announce a real press (never one their demo makes),
 * and the host decides what it sounds like, if anything. The site plays its quiet click when
 * sound is on; anywhere else the event goes unheard.
 */
export const tap = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('detent:tap'))
}

// What the hand last did, read when something opens. Nothing yet counts as a key: it opens at once.
let keyed = true
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', () => void (keyed = true), true)
  window.addEventListener('pointerdown', () => void (keyed = false), true)
}
/** Whether the last input was a key rather than a pointer: what a key starts doesn't animate. */
export const byKey = () => keyed
