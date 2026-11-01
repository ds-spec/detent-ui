/**
 * Print: grain ink for data fills. A fill run through one of these filters turns to speckle, as if
 * printed, and two inks laid a hair out of register read as a riso print. Use it on data areas only,
 * never on text or chrome.
 */

/** Grain filters for an SVG's <defs>: `${id}grain`, and `${id}grainB`, a second seed for a second ink. */
export function InkDefs({ id }: { id: string }) {
  return (
    <>
      {(
        [
          ['grain', 7],
          ['grainB', 31],
        ] as const
      ).map(([name, seed]) => (
        <filter key={name} id={`${id}${name}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="2" seed={seed} stitchTiles="stitch" result="noise" />
          <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 1.55" result="mask" />
          <feComposite in="SourceGraphic" in2="mask" operator="in" />
        </filter>
      ))}
    </>
  )
}

/** Blend for printed inks: multiply on paper, screen on black. */
export const INK = 'mix-blend-multiply dark:mix-blend-screen'
