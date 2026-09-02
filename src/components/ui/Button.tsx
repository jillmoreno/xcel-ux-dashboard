import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md'

const VARIANTS: Record<
  Variant,
  { bg: string; fg: string; border: string; hoverBg: string; hoverShadow: string }
> = {
  primary: {
    bg: 'var(--color-action)',
    fg: 'var(--color-text-inverse)',
    border: 'var(--color-action)',
    hoverBg: 'var(--color-action-hover)',
    hoverShadow: 'none',
  },
  // Outline-style buttons: hover keeps the fill transparent and thickens
  // the stroke instead — an inset 1px shadow stacks against the existing
  // 1px border for a 2px effective outline without any layout shift.
  secondary: {
    bg: 'transparent',
    fg: 'var(--color-action)',
    border: 'var(--color-action)',
    hoverBg: 'transparent',
    hoverShadow: 'inset 0 0 0 1px var(--color-action)',
  },
  ghost: {
    bg: 'transparent',
    fg: 'var(--color-text-primary)',
    border: 'transparent',
    hoverBg: 'var(--color-neutral-100)',
    hoverShadow: 'none',
  },
}

const SIZES: Record<Size, { height: number; padding: string; fontSize: number }> = {
  sm: { height: 32, padding: '0 12px', fontSize: 13 },
  md: { height: 40, padding: '0 16px', fontSize: 14 },
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', children, style, disabled, ...rest }: Props) {
  const v = VARIANTS[variant]
  const s = SIZES[size]
  return (
    <button
      {...rest}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: s.height,
        padding: s.padding,
        borderRadius: 'var(--radius-md)',
        background: v.bg,
        color: v.fg,
        // Split into long-form props so a caller can override just
        // `borderColor` without leaving React with an orphaned shorthand
        // to clear across renders. (When React clears a previously-set
        // `borderColor`, it falls back to currentColor — which for the
        // primary variant is white, producing a stray white ring.)
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: v.border,
        fontFamily: 'var(--font-body)',
        fontSize: s.fontSize,
        fontWeight: 600,
        lineHeight: 1,
        cursor: 'pointer',
        outline: 'none',
        // Disabled: a muted, non-interactive look. Placed before `...style`
        // so callers can still override, but every disabled Button now reads
        // as disabled by default. The hover handlers below are also skipped
        // when disabled — otherwise onMouseLeave imperatively resets
        // `background` to the variant fill, clobbering this (a caller's
        // disabled `style` background survived while ours didn't, which read
        // as an enabled button with muted text).
        ...(disabled && {
          background: 'var(--color-neutral-disabled)',
          color: 'var(--color-neutral-dark)',
          borderColor: 'var(--color-neutral-disabled)',
          cursor: 'not-allowed',
        }),
        ...style,
      }}
      onMouseEnter={
        disabled
          ? undefined
          : (e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = v.hoverBg
              el.style.boxShadow = v.hoverShadow
            }
      }
      onMouseLeave={
        disabled
          ? undefined
          : (e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = v.bg
              el.style.boxShadow = 'none'
            }
      }
    >
      {children}
    </button>
  )
}
