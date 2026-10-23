import type { CSSProperties } from 'react'
import { E2E_PARTNER_NAME } from '@/pages/endToEndDemo'

/**
 * THE END-TO-END DEMO'S PARTNER HEADER — Figma "Atlas UX Design" 420:2023,
 * shared by Invited Product Detail and Confirmation & Password (2026-10-15,
 * moved out of `InvitedProductDetailPage` so both pages draw the same one).
 *
 * DEMO DATA: the partner name is the design's own.
 *
 * `bare` draws the BAR AND NOTHING IN IT (2026-10-15, Jillienne: "the light
 * gray background and white header will still exist, but the logo in the
 * header will disappear"). It is the flow's loading end state: the chrome
 * holds its shape while the branding goes, so the page does not jump by 64
 * at the moment Confirm is pressed. The whole lockup goes, not the logo
 * alone — "Official Partner of" with nothing after it reads as a failed
 * image, which is the one thing a loading page must not look like. Hidden
 * from the accessibility tree there: an empty banner landmark is an
 * announcement with no content behind it.
 */
export function PartnerHeader({
  bare = false,
  partner = true,
}: { bare?: boolean; partner?: boolean } = {}) {
  if (bare) return <header aria-hidden style={HEADER} />
  /* ⚠ `partner={false}` IS XCEL'S OWN HEADER — 2026-10-22, with the four invite
     flows. B2C Guest Checkout has no partner anywhere in it, and this header
     was naming Sunrise Bank regardless: the most visible version of the page
     claiming a relationship the learner does not have, sitting above a banner
     that had just been fixed for the same lie.

     The lockup goes, the XCEL logo stays — unlike `bare`, which empties the bar
     for the loading state. The bar keeps its height either way, so nothing
     below it moves when a reviewer switches flow on the design bar. */
  return (
    <header style={HEADER}>
      {partner ? (
        <>
          <p style={TEXT}>{E2E_PARTNER_NAME}</p>
          <span aria-hidden style={DIVIDER} />
          <p style={TEXT}>Official Partner of</p>
        </>
      ) : null}
      <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={LOGO} />
    </header>
  )
}

/* 64 tall: 8 above and below the 48 logo (2026-10-14, Eric's request: 24
   less than the design's 88, which had 20). The 1px outline is inset, as
   Figma draws its stroke inside the frame, so it adds no height. */
/* Right-aligned, its logo ending 32 from the window's right edge (2026-10-14,
   Eric's requests: centred, then on the content's 240, then 56, 40, 32). */
/* PINNED to the top as the page scrolls (2026-10-15, Eric's request), over
   the page's content — the sticky price rail included. */
export const PARTNER_HEADER_HEIGHT = 64
const HEADER: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 10,
  height: PARTNER_HEADER_HEIGHT,
  boxSizing: 'border-box',
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
