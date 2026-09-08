import { useEffect, useRef, useState, type CSSProperties } from 'react'

/**
 * Non-component helpers + shared styles for the stakeholder **demo bar** pattern
 * — the always-visible navy banner of dropdown pills that lets a reviewer drive
 * a prototype without opening the hidden robot menu. Consumed by the components
 * in [`DemoBar.tsx`](src/components/prototype/DemoBar.tsx) and both concrete bars
 * ([`DemoControlsBar`](src/components/prototype/DemoControlsBar.tsx) /
 * [`OnboardingDemoBar`](src/components/onboarding/OnboardingDemoBar.tsx)).
 *
 * Kept in a `.ts` module (no component exports) so the components file stays
 * Fast-Refresh clean — mirrors the `platformNav.ts` / `v4/sharedUtil.ts` splits.
 */

/**
 * One-open-at-a-time dropdown state for a demo bar, plus the outside-click /
 * Escape dismiss wiring. Returns the open menu id, a `toggle`, a `close`, and
 * the `barRef` to attach to the bar root (dismiss ignores clicks inside it).
 */
export function useDemoMenus() {
  const [openId, setOpenId] = useState<string | null>(null)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!openId) return
    const onClick = (e: MouseEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpenId(null)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [openId])

  return {
    openId,
    toggle: (id: string) => setOpenId((cur) => (cur === id ? null : id)),
    close: () => setOpenId(null),
    barRef,
  }
}

/* ─── shared styles (tokens + translucent-white overlays on the navy bar) ──── */

export const DEMO_WHITE = 'var(--color-text-inverse)'
export const DEMO_FAINT_FILL = 'rgb(255 255 255 / 0.06)'
export const DEMO_HOVER_FILL = 'rgb(255 255 255 / 0.14)'
const DEMO_BORDER = '1px solid rgb(255 255 255 / 0.24)'

export const DEMO_BAR: CSSProperties = {
  background: 'var(--color-primary-800)',
  borderBottom: '3px solid var(--color-secondary-600)',
  color: DEMO_WHITE,
  fontFamily: 'var(--font-body)',
}

export const DEMO_INNER: CSSProperties = {
  maxWidth: 1440,
  margin: '0 auto',
  padding: '10px 24px',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 10,
}

export const DEMO_DOT: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: 'var(--color-secondary-500)',
  boxShadow: '0 0 0 3px rgb(255 255 255 / 0.14)',
  flexShrink: 0,
}

export const DEMO_TAG_LABEL: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: DEMO_WHITE,
  marginRight: 4,
}

export const DEMO_TRIGGER: CSSProperties = {
  border: DEMO_BORDER,
  background: DEMO_FAINT_FILL,
  color: DEMO_WHITE,
  padding: '7px 12px',
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  transition: 'background .15s',
}

export const DEMO_TRIGGER_EYEBROW: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'rgb(255 255 255 / 0.55)',
}

export const DEMO_COUNT_BADGE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 18,
  height: 18,
  padding: '0 5px',
  borderRadius: 999,
  background: 'var(--color-secondary-600)',
  color: DEMO_WHITE,
  fontSize: 11,
  fontWeight: 700,
}

export const DEMO_PANEL: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 8px)',
  left: 0,
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-popover)',
  padding: 6,
  zIndex: 60,
  // Never exceed the viewport — keeps a wide panel (e.g. the Persona menu) from
  // overflowing horizontally on smaller devices; a wider min-width still reduces
  // description wrapping, so the menu stays shorter without a sideways scroll.
  maxWidth: 'calc(100vw - 24px)',
}
