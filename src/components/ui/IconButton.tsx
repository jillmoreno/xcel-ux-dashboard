import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  size?: number
  children: ReactNode
}

export function IconButton({ label, size = 36, children, style, ...rest }: Props) {
  return (
    <button
      {...rest}
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: 'var(--radius-pill)',
        background: 'transparent',
        color: 'var(--color-text-secondary)',
        border: '1px solid var(--color-border-subtle)',
        cursor: 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
