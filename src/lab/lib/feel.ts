/**
 * Feel: the material layer. Components announce a real press (never one their demo makes),
 * and the host decides what it sounds like, if anything. The site plays its quiet click when
 * sound is on; anywhere else the event goes unheard.
 */
export const tap = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('detent:tap'))
}
