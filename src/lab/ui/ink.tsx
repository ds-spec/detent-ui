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

export const INK = 'mix-blend-multiply dark:mix-blend-screen'
