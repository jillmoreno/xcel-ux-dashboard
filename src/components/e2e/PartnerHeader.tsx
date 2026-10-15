import type { CSSProperties } from 'react'

/**
 * THE END-TO-END DEMO'S PARTNER HEADER — Figma "Atlas UX Design" 420:2023,
 * shared by Invited Product Detail and Confirmation & Password (2026-10-15,
 * moved out of `InvitedProductDetailPage` so both pages draw the same one).
 *
 * DEMO DATA: the partner name is the design's own.
 */
export function PartnerHeader() {
  return (
    <header style={HEADER}>
      <p style={TEXT}>Pristine Solutions Financial Services Group LLC</p>
      <span aria-hidden style={DIVIDER} />
      <p style={TEXT}>Official Partner of</p>
      <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={LOGO} />
    </header>
  )
}

/* 64 tall: 8 above and below the 48 logo (2026-10-14, Eric's request: 24
   less than the design's 88, which had 20). The 1px outline is inset, as
   Figma draws its stroke inside the frame, so it adds no height. */
/* Right-aligned, its logo ending 32 from the window's right edge (2026-10-14,
   Eric's requests: centred, then on the content's 240, then 56, 40, 32). */
const HEADER: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 16,
  padding: '8px 32px',
  background: 'var(--color-fixed-light)',
  boxShadow: 'inset 0 0 0 1px var(--color-e2e-partner-outline)',
}

/* Both lines the same: Avenir Heavy 13 (2026-10-14, Eric's request; the
   design's Inter Bold). */
const TEXT: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 13,
  lineHeight: 'normal',
  color: 'var(--color-neutral-950)',
  whiteSpace: 'nowrap',
}

const DIVIDER: CSSProperties = {
  width: 1,
  height: 36,
  flex: 'none',
  background: 'var(--color-e2e-partner-divider)',
}

const LOGO: CSSProperties = {
  display: 'block',
  width: 115,
  height: 48,
  flex: 'none',
  objectFit: 'contain',
}
