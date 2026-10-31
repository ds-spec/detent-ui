/**
 * Shared motion tokens, and the rules they serve:
 *
 * 1. Things move and reshape; they don't fade out and back in. If an element survives a change,
 *    animate its position and size (layout, Morph) instead of swapping it.
 * 2. Text and numbers that must be replaced roll through a clipped slot. Blur is kept for whole
 *    panels changing, never for a label or an icon.
 * 3. Springs for anything that moves: snappy for small controls, move for things travelling,
 *    smooth for size and height, soft for big surfaces, release after a drag, data for charts
 *    morphing, pop for the one success moment.
 * 4. Exits are quicker than entrances and never set a spring. Nothing on the UI starts slow: no
 *    ease-in, and nothing enters from scale 0. Reduced motion is always respected.
 * 5. Every `duration` names a curve. Left out, Motion falls back to easeInOut, which starts slow.
 *    On this site, CSS mirrors this: `--ease-out` and Tailwind's default timing function are
 *    `ease.out`. Neither ships, because they'd change every transition in a buyer's app; shipped
 *    files name `ease-detent` instead (`curved` in catalog/registry.ts).
 */

/** Cubic-bezier curves. Linear stays a literal, and only for progress and loops. */
export const ease = {
  /** Everything entering, leaving or responding: fast start, long soft landing. */
  out: [0.2, 0.9, 0.25, 1] as const,
  /** Something crossing the screen from A to B, and looping pulses. */
  inOut: [0.6, 0, 0.3, 1] as const,
}

/** Durations in seconds. */
export const dur = {
  /** Anything leaving. */
  exit: 0.12,
  /** Colour, opacity, press. */
  hover: 0.15,
  /** Menus, popovers, tooltips, labels. */
  enter: 0.2,
  /** Text and panels replacing each other. */
  swap: 0.24,
  /** Sheets and large panels. */
  panel: 0.34,
}

export const spring = {
  /** Controls: pills, plates, knobs, indicators, small menus. */
  snappy: { type: 'spring', stiffness: 560, damping: 42, mass: 0.6 } as const,
  /** Size and height morphs: panels, accordions, layout changes. */
  smooth: { type: 'spring', bounce: 0, duration: 0.36 } as const,
  /** Bigger surfaces that should land gently: sheets, lightboxes. */
  soft: { type: 'spring', bounce: 0.12, duration: 0.5 } as const,
  /** Settling after a drag is released. */
  release: { type: 'spring', stiffness: 320, damping: 32 } as const,
  /** Something travelling across a component to a new place: a plate, a mark, a shared element. */
  move: { type: 'spring', stiffness: 420, damping: 38 } as const,
  /** Charts morphing to new data. */
  data: { type: 'spring', stiffness: 170, damping: 26 } as const,
  /** The one success moment in a piece. */
  pop: { type: 'spring', bounce: 0.3, duration: 0.4 } as const,
}

/** Standard enter/exit for anything appearing in place. */
export const appear = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: { duration: dur.swap, ease: ease.out } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: dur.exit, ease: ease.out } },
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
