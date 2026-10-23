import type { CSSProperties } from 'react'
import { StandaloneBrowserChrome } from '@/components/layout/BrowserChromeBar'
import { PartnerHeader } from '@/components/e2e/PartnerHeader'
import { TopoBackground } from '@/components/e2e/TopoBackground'

/**
 * THE FLOW'S LOADING PAGE — extracted 2026-10-22, when Place your order needed
 * one too: "after user clicks place your order, we likely need to show the
 * loading gif page before immediately loading the confirmation page."
 *
 * ⚠ NOT A GIF, despite what everyone calls it. SVG and CSS, so every colour is
 * a token and it stays sharp at any size: the topo map behind, a brick arc
 * sweeping over a faint ring with a slower arc running the other way inside
 * it, a breathing dot at the centre, and the line's ellipsis typing itself.
 * The motion classes live in `tokens.css` beside `cre-setup-spin` and stop
 * under reduced motion.
 *
 * ⚠ IT WAS INSIDE `InvitedConfirmationPageV2`, and it is a genuine extraction
 * rather than a copy — that page now renders this one. Two hand-copied
 * spinners is how a walk ends up with two subtly different loading pages, and
 * a loading page is the one screen whose job is to look like nothing changed
 * except time passing.
 *
 * ⚠ THE HEADER STAYS, EMPTY (2026-10-15, Jillienne: "the light gray background
 * and white header will still exist, but the logo in the header will
 * disappear"). It had been dropped entirely earlier the same day — "remove
 * this part when loading gif is going" — which took 64px with it and jumped
 * the whole page upward on the press. `bare` keeps the bar and drops the
 * lockup inside it, so only the branding leaves and the map below starts where
 * it already was.
 *
 * ⚠ IT NEVER RESOLVES ITSELF. Whoever shows it owns the timer and the
 * navigation — this draws a held moment, and nothing more.
 */
export function XcelLoadingPage({ message }: { message: string }) {
  return (
    <div style={PAGE}>
      {/* The window stays through the loading end state too — the branding is
          what leaves here, not the browser around it. */}
      <StandaloneBrowserChrome />
      <PartnerHeader bare />
      <main style={LOADING_PAGE}>
        <TopoBackground />
        <div role="status" aria-live="polite" style={LOADING_STACK}>
          <svg aria-hidden viewBox="0 0 72 72" width={72} height={72} style={{ display: 'block', overflow: 'visible' }}>
            <circle cx={36} cy={36} r={32} fill="none" strokeWidth={3} style={{ stroke: 'var(--color-e2e-form-outline)' }} />
            <circle
              className="cre-e2e-loading-arc"
              cx={36}
              cy={36}
              r={32}
              fill="none"
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray="56 145"
              style={{ stroke: 'var(--color-xcel-brick-600)' }}
            />
            <circle
              className="cre-e2e-loading-arc-inner"
              cx={36}
              cy={36}
              r={21}
              fill="none"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="30 102"
              strokeOpacity={0.4}
              style={{ stroke: 'var(--color-xcel-brick-600)' }}
            />
            <circle className="cre-e2e-loading-pulse" cx={36} cy={36} r={5} style={{ fill: 'var(--color-xcel-brick-600)' }} />
          </svg>
          <p style={LOADING_TEXT}>
            {message}
            {/* ⚠ THE ELLIPSIS IS READ ONCE, NOT ANIMATED, for a screen reader:
                `aria-live` would otherwise re-announce the line every time a
                dot typed itself. */}
            <span style={SR_ONLY}>…</span>
            <span aria-hidden>
              <span className="cre-e2e-loading-dot">.</span>
              <span className="cre-e2e-loading-dot">.</span>
              <span className="cre-e2e-loading-dot">.</span>
            </span>
          </p>
        </div>
      </main>
    </div>
  )
}

/**
 * HOW LONG A LOADING PAGE HOLDS (2026-10-16, Jillienne's three seconds). Long
 * enough that the hand-off reads as a step the product is taking rather than a
 * flicker, short enough that a stakeholder walking the flow does not think it
 * has hung.
 */
export const LOADING_HANDOFF_MS = 3000

/* ── Styles ─────────────────────────────────────────────────────────────── */

/* ⚠ VERBATIM FROM `InvitedConfirmationPageV2`, which is where this page lived
   until the extraction. An extraction that redraws what it extracts is a
   rewrite wearing a refactor's name — the loading page has to look EXACTLY as
   it did, or the hand-off it was tuned for starts flickering. */
const PAGE: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--color-neutral-75)',
}

const BODY: CSSProperties = { flex: '1 0 auto', display: 'flex', alignItems: 'stretch' }

const LOADING_PAGE: CSSProperties = {
  ...BODY,
  position: 'relative',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 40,
}

const LOADING_STACK: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 28,
}

const LOADING_TEXT: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  lineHeight: '24px',
  color: 'var(--color-neutral-950)',
  textAlign: 'center',
}

/* Screen readers get the ellipsis as one character; sighted viewers get the
   three dots typing themselves. */
const SR_ONLY: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
}
