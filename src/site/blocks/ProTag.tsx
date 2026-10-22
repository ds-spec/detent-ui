/** Marks what's in Pro: a small solid pill, the one place the site uses ink as a fill for a label. */
export function ProTag({ className = '' }: { className?: string }) {
  return <span className={`inline-flex h-5 items-center rounded-full bg-ink px-2 text-caption font-semibold tracking-[0.02em] text-surface ${className}`}>Pro</span>
}

/** Marks what anyone can install: the same pill, quiet, so Pro stays the louder of the two. */
export function FreeTag({ className = '' }: { className?: string }) {
  return <span className={`inline-flex h-5 items-center rounded-full bg-surface-2 px-2 text-caption font-semibold tracking-[0.02em] text-ink-2 ${className}`}>Free</span>
}
