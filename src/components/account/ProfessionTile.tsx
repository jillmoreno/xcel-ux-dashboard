import type { CSSProperties } from 'react'
import { Check } from '@/icons'
import type { Brand, Profession } from '@/context/AccountContext'
import { Logo } from '@/components/brand/Logo'

type Props = {
  profession: Profession
  activeBrand: Brand
  onSelect: (brand: Brand) => void
}

/**
 * One brand card inside the Switch Brand panel. The whole card is the
 * selector — clicking it switches the active brand in place (membership is
 * owned by the separate Member-view toggle, so it's preserved). Wraps in
 * `data-brand={profession.brand}` so the brand override block in tokens.css
 * cascades into the card — the active border + check preview the target
 * brand's color, not the currently active one.
 */
export function ProfessionTile({ profession, activeBrand, onSelect }: Props) {
  const isActiveBrand = profession.brand === activeBrand
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={isActiveBrand}
      aria-label={profession.brandFullName}
      data-brand={profession.brand}
      onClick={() => onSelect(profession.brand)}
      onMouseEnter={(e) => {
        if (!isActiveBrand) e.currentTarget.style.background = 'var(--color-neutral-50)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--color-surface-card)'
      }}
      className="cre-brand-card"
      style={{
        ...cardStyle,
        border: `1.5px solid ${isActiveBrand ? 'var(--color-brand)' : 'var(--color-border-subtle)'}`,
        boxShadow: isActiveBrand ? 'inset 0 0 0 1px var(--color-brand)' : 'none',
        transition: 'background 120ms ease',
      }}
    >
      {/* Logo carries the brand name (SVG wordmark for CRE/McKissock/Elite,
          text wordmark for STC). No separate label needed. */}
      <Logo brand={profession.brand} height={40} />
      <span
        aria-hidden
        style={{
          ...checkStyle,
          background: isActiveBrand ? 'var(--color-brand)' : 'transparent',
          border: `1.5px solid ${isActiveBrand ? 'var(--color-brand)' : 'var(--color-border-subtle)'}`,
          color: 'var(--color-text-inverse)',
        }}
      >
        {isActiveBrand && <Check size={14} aria-hidden />}
      </span>
    </button>
  )
}

const cardStyle: CSSProperties = {
  width: '100%',
  minHeight: 76,
  borderRadius: 'var(--radius-lg)',
  padding: '18px 16px',
  background: 'var(--color-surface-card)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  cursor: 'pointer',
  textAlign: 'left',
}

// Radio-style check dot on the right edge — filled brand color when active.
const checkStyle: CSSProperties = {
  flexShrink: 0,
  width: 24,
  height: 24,
  borderRadius: 'var(--radius-pill)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}
