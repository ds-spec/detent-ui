'use client'

import type { ComponentProps, ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ease, press } from '../lib/motion'
import { Spinner } from './Spinner'
import { tap } from '../lib/feel'

export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type Size = 'sm' | 'md' | 'lg'

const SIZE: Record<Size, string> = {
  sm: 'h-8 pointer-coarse:h-9 gap-1.5 rounded-[9px] px-3 text-footnote',
  md: 'h-9 gap-2 rounded-control px-3.5 text-callout',
  lg: 'h-11 gap-2 rounded-row px-5 text-body',
}
const ICON: Record<Size, string> = { sm: 'size-8 pointer-coarse:size-9 rounded-[9px]', md: 'size-9 rounded-control', lg: 'size-11 rounded-row' }

const VARIANT: Record<Variant, string> = {
  primary: 'bg-ink text-surface shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_1px_2px_rgb(0_0_0/0.16)] hover:bg-[color-mix(in_oklch,var(--ink),var(--surface)_14%)]',
  secondary: 'bg-surface text-ink shadow-raised hover:shadow-[var(--elev-raised-hover)]',
  ghost: 'text-ink-2 hover:bg-surface-2 hover:text-ink active:bg-surface-3',
  danger: 'chip text-danger [--chip-wash:11%] [--chip:var(--danger)] hover:[--chip-wash:17%]',
}

export const buttonClass = (variant: Variant = 'secondary', size: Size = 'md', icon = false) =>
  `sink ring-focus relative inline-flex shrink-0 select-none items-center justify-center font-medium transition-[background-color,color,box-shadow] duration-150 disabled:pointer-events-none disabled:opacity-45 ${icon ? ICON[size] : SIZE[size]} ${VARIANT[variant]}`

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  loading = false,
  done,
  children,
  className = '',
  onPointerDown,
  ...rest
}: Omit<ComponentProps<typeof motion.button>, 'children'> & {
  variant?: Variant
  size?: Size
  icon?: boolean
  loading?: boolean
  done?: ReactNode
  children?: ReactNode
}) {
  const hidden = loading || !!done
  return (
    <motion.button
      type="button"
      whileTap={rest.disabled || loading ? undefined : press}
      aria-busy={loading || undefined}
      onPointerDown={(e) => {
        if (!rest.disabled && !loading) tap()
        onPointerDown?.(e)
      }}
      className={`${buttonClass(variant, size, icon)} ${className}`}
      {...rest}
    >
      <motion.span
        className="inline-flex items-center gap-[inherit]"
        initial={false}
        animate={{ opacity: hidden ? 0 : 1, y: done && !loading ? -6 : 0 }}
        transition={{ duration: 0.16, ease: ease.out }}
      >
        {children}
      </motion.span>
      <AnimatePresence>
        {loading && (
          <motion.span
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: ease.out }}
          >
            <Spinner size={size === 'lg' ? 18 : 16} />
          </motion.span>
        )}
        {done && !loading && (
          <motion.span
            key="done"
            className="absolute inset-0 flex items-center justify-center gap-[inherit]"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: ease.out }}
          >
            {done}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
