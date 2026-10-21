/**
 * Shared motion tokens, and the rules they serve:
 *
 * 1. Things move and reshape; they don't fade out and back in. If an element survives a change,
 *    animate its position and size (layout, Morph) instead of swapping it.
 * 2. Text and numbers that must be replaced roll through a clipped slot. Blur is kept for whole
 *    panels changing, never for a label or an icon.
 * 3. Springs for anything that moves: snappy for small controls, smooth for size and position,
 *    soft for big surfaces, move for things travelling across a component.
 * 4. Exits are quicker than entrances, and reduced motion is always respected.
 */

/** Cubic-bezier curves. */
export const ease = {
  /** Entering and leaving: fast start, long soft landing. */
  out: [0.2, 0.9, 0.25, 1] as const,
  /** Moving across the screen from A to B. */
  inOut: [0.6, 0, 0.3, 1] as const,
  /** Quick exits. */
  exit: [0.4, 0, 0.8, 0.6] as const,
}

/** Durations in seconds. */
export const dur = {
  hover: 0.15,
  fast: 0.2,
  base: 0.26,
  slow: 0.34,
}

export const spring = {
  /** Small controls: pills, indicators, toggles. */
  snappy: { type: 'spring', stiffness: 560, damping: 42, mass: 0.6 } as const,
  /** Size and position morphs: panels, accordions, layout changes. */
  smooth: { type: 'spring', bounce: 0, duration: 0.36 } as const,
  /** Bigger surfaces that should land gently: sheets, lightboxes. */
  soft: { type: 'spring', bounce: 0.12, duration: 0.5 } as const,
  /** Settling after a drag is released. */
  release: { type: 'spring', stiffness: 320, damping: 32 } as const,
  /** Something travelling across a component to a new place: a plate, a mark, a shared element. */
  move: { type: 'spring', stiffness: 420, damping: 38 } as const,
}

/** Standard enter/exit for anything appearing in place. */
export const appear = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: { duration: dur.base, ease: ease.out } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: dur.fast * 0.75, ease: ease.out } },
}

/** Content that replaces content, arriving from the side you moved toward. `custom` is the direction (-1 | 1). */
export const slide = {
  enter: (dir: number) => ({ x: dir * 24, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -24, opacity: 0 }),
}

export const press = { scale: 0.97 }

/** Spread a stagger so the whole group lands within ~200 ms. */
export const staggerFor = (count: number) => Math.min(0.04, 0.2 / Math.max(1, count))
