import { Search } from '@/icons'
import type { CSSProperties, InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  /**
   * Chrome treatment:
   *   - `default` — white `surface-card` fill + subtle border + dark text. For
   *     search fields on the page background or a light/pale band.
   *   - `on-color` — the translucent "on a colored background" treatment: a
   *     faint white fill + translucent-white border + white icon / text /
   *     placeholder. Use this for ANY search field that sits on a saturated /
   *     dark brand band (the gradient section heroes) so the field reads as
   *     part of the band instead of a jarring white box. The placeholder color
   *     is set via `.cre-search-input--on-color::placeholder` in tokens.css
   *     (inline styles can't target `::placeholder`).
   */
  tone?: 'default' | 'on-color'
}

export function SearchInput({ label, placeholder, style, tone = 'default', ...rest }: Props) {
  const onColor = tone === 'on-color'
  const labelStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    height: 40,
    padding: '0 12px',
    borderRadius: 'var(--radius-md)',
    background: onColor ? 'rgb(255 255 255 / 0.12)' : 'var(--color-surface-card)',
    border: `1px solid ${onColor ? 'rgb(255 255 255 / 0.35)' : 'var(--color-border-subtle)'}`,
    color: onColor ? 'rgb(255 255 255 / 0.85)' : 'var(--color-text-secondary)',
    ...style,
  }
  return (
    <label style={labelStyle}>
      <Search size={16} aria-hidden />
      <input
        {...rest}
        type="search"
        aria-label={label ?? 'Search'}
        placeholder={placeholder}
        className={onColor ? 'cre-search-input--on-color' : undefined}
        style={{
          flex: 1,
          minWidth: 0,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: onColor ? 'rgb(255 255 255 / 0.95)' : 'var(--color-text-primary)',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
        }}
      />
    </label>
  )
}
