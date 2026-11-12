import type { CSSProperties } from 'react'
import { StandaloneBrowserChrome } from '@/components/layout/BrowserChromeBar'
import { PartnerHeader } from '@/components/e2e/PartnerHeader'
import { TopoBackground } from '@/components/e2e/TopoBackground'
import { XcelLoadingStatus } from '@/components/e2e/XcelLoadingStatus'

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
        <XcelLoadingStatus message={message} />
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
