import type { CSSProperties } from 'react'
import { ArrowLeft, X } from '@/icons'

/**
 * Title bar for a [`Sheet`](./Sheet.tsx) — heading, optional Back, and Close.
 *
 * **`Sheet` deliberately renders no chrome of its own**: it supplies the
 * overlay, the panel, the scroll lock and a visually-hidden title for
 * `aria-labelledby`, then hands you `{children}` with no padding. So every
 * caller draws its own header, and until now exactly one did — this component
 * lived privately inside `AppearancePreferencesSheet`.
 *
 * Extracted the moment a second sheet needed it. A near-copy is how two
 * slide-overs end up with headers a few pixels and one font weight apart,
 * which is the drift `ProgressBar` and `alertTones` were both pulled out to
 * stop. `SHEET_BODY` travels with it, since a header with the wrong padding
 * under it looks exactly like a broken header.
 */
export function SheetHeader({
  title,
  onClose,
  onBack,
  /** Back button's accessible name — say where it goes. */
  backLabel = 'Back',
}: {
  title: string
  onClose: () => void
  onBack?: () => void
  backLabel?: string
}) {
  return (
    <header style={HEADER}>
      {onBack && (
        <button
          type="button"
          aria-label={backLabel}
          onClick={onBack}
          className="cre-sheet-close"
          style={ICON_BTN}
        >
          <ArrowLeft size={18} aria-hidden />
        </button>
      )}
      <h2 style={HEADER_TITLE}>{title}</h2>
      <button
        type="button"
        aria-label={`Close ${title}`}
        onClick={onClose}
        className="cre-sheet-close"
        style={{ ...ICON_BTN, marginLeft: 'auto' }}
      >
        <X size={16} aria-hidden />
      </button>
    </header>
  )
}

/** Scrollable body under a `SheetHeader`. `Sheet` gives you zero padding. */
export const SHEET_BODY: CSSProperties = {
  padding: '14px 18px 24px',
  overflow: 'auto',
  flex: 1,
}

const HEADER: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '20px 18px 16px',
  borderBottom: '1px solid var(--color-border-subtle)',
  flexShrink: 0,
}

const HEADER_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 18,
  fontWeight: 800,
  color: 'var(--color-text-primary)',
}

const ICON_BTN: CSSProperties = {
  width: 34,
  height: 34,
  display: 'grid',
  placeItems: 'center',
  border: 'none',
  background: 'transparent',
  borderRadius: 9,
  cursor: 'pointer',
  color: 'var(--color-text-secondary)',
}
