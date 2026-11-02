'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

/** Prototype flag: ?side=new tries the new components page, and it stays on for this tab until ?side=old. */
export function useSideNew() {
  const path = usePathname()
  const [on, setOn] = useState(false)
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('side')
    if (q) sessionStorage.setItem('side', q)
    setOn(sessionStorage.getItem('side') === 'new')
  }, [path])
  return on
}

/**
 * The new page's buttons: the blue one lit from above, a sheen along its top edge and a rim that holds
 * the shape; the plates flat, a surface and a hairline. Blue for the step that matters (buy, start); a white plate, like the Preview / Code
 * switch, for the rest; a sunk track for switches.
 */
export const BTN = {
  accent:
    'text-white bg-[linear-gradient(180deg,color-mix(in_oklch,var(--accent),white_7%),var(--accent))] shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_0_0_1px_color-mix(in_oklch,var(--accent),black_22%),0_1px_2px_rgb(0_0_0/0.14)] hover:brightness-[1.04] active:brightness-[0.96] dark:bg-[#3b66f5] dark:bg-none dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.1),0_0_0_1px_#2a4fd0]',
  plate: 'text-ink bg-surface shadow-[0_0_0_1px_var(--line-strong)] dark:shadow-[0_0_0_.5px_var(--line-strong),0_1px_2px_rgb(0_0_0/0.3)]',
  track: 'bg-[color-mix(in_oklch,var(--ink)_5%,transparent)] shadow-[inset_0_1px_2px_rgb(0_0_0/0.06),inset_0_0_0_1px_color-mix(in_oklch,var(--ink)_5%,transparent)]',
}
