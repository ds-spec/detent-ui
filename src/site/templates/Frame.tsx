import type { ReactNode } from 'react'

/* Every place the site shows a template in a box wraps it here. A landing page pins its bar and footer with
   position: fixed and sizes full screens with 100cqh; the transform makes this box their frame instead of the
   window, and the size container makes 100cqh the box's height. The child that scrolls (or clips) the page is
   marked data-template-scroller, so the template's scroll effects read it rather than the window. */
export function TemplateFrame({ children }: { children: ReactNode }) {
  return <div className="relative h-full [container-type:size] [transform:translateZ(0)]">{children}</div>
}
