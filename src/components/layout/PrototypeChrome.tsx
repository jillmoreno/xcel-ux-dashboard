import { useLocation } from 'react-router-dom'
import { PrototypeBar } from './PrototypeBar'
import { AdminToolsMenu } from './AdminToolsMenu'
import { DeviceFrameToggle, useDeviceFrame } from './DeviceFrameContext'
import { DemoControlsBar } from '@/components/prototype/DemoControlsBar'
import { useDemoControlsVisibility } from '@/components/prototype/demoControlsVisibility'

/**
 * The prototype "chrome" — the dark PrototypeBar + the navy stakeholder Demo
 * Controls banner. Extracted from `Header` so `DeviceFrame` can render it
 * OUTSIDE the centered browser-window card in the Demo frame: the bars span the
 * full screen width while the app itself sits in the rounded, centered window
 * below them. Outside the Demo frame it renders inline above the app, unchanged.
 *
 * Self-contained — it only needs the route (for the Demo toggle gate) and the
 * shared Demo-controls visibility store; none of Header's heavy panel state.
 */
/**
 * The only demo controls a `?test=1` participant session shows.
 *
 * ⚠ `navigation` IS HERE BY DIRECT ASK — 2026-09-23 — and it is the entry to
 * think twice about. The others on the bar are hidden because they re-baseline
 * the demo or move a treatment the session is holding still. This one is
 * different: it is the A/B's own independent variable, so putting it in front
 * of a participant tells them a comparison exists, which is most of what a
 * moderated session is trying not to say.
 *
 * IT IS IN ANYWAY because switching arms mid-session is worth more than that
 * risk here: without it, showing someone both versions means reloading and
 * re-pasting the session link, which breaks the task far more visibly than a
 * control they were never invited to touch. Moderator discipline — not the
 * code — is what keeps it unpressed.
 *
 * `progress` is the other survivor, for the plainer reason that a moderator
 * changes it between tasks ("now imagine you are two weeks in").
 */
const TEST_VIEW_CONTROLS = ['progress', 'navigation'] as const

export function PrototypeChrome() {
  const { pathname, search } = useLocation()
  const { open: demoOpen, toggle: toggleDemo } = useDemoControlsVisibility()
  // In the Demo frame the bars run edge-to-edge (full screen width) instead of
  // the rebrand's 1440-capped, left-anchored strip.
  const framed = useDeviceFrame().device === 'desktop-framed'
  // A share link can hide ALL prototype chrome — the dark `PrototypeBar` AND the
  // navy stakeholder `DemoControlsBar` — with `?chrome=off`, so a URL pasted to a
  // stakeholder (e.g. the Recommended Card A/B links) reads as a real web session:
  // just the app header + the page, no prototype scaffolding. It's URL-only (never
  // persisted), so it affects only that shared session and every normal load is
  // unchanged. `PlatformShell` preserves unknown params on its own URL syncs, so
  // the flag survives in-shell navigation on the shared link. (After all hooks —
  // rules-of-hooks.)
  const params = new URLSearchParams(search)
  if (params.get('chrome') === 'off') return null
  // `?present=1` (the "Share Demo" link) — the shared presentation view: hide
  // the prototype bar + demo controls (like `chrome=off`) but keep the Demo
  // frame (forced in DeviceFrameContext). The `DemoControlsBar` is still MOUNTED
  // here — invisibly (`open={false}` → it renders null) — so its one-time
  // deep-link init applies the captured demo state (`?tier=&prof=&mem=&prog=&edu=`)
  // even though no controls are shown.
  if (params.get('present') === '1') return <DemoControlsBar open={false} />
  /*
   * `?test=1` — THE MODERATED USER-TEST VIEW, 2026-09-23. The link
   * `promote-to-testing` builds, and the third shape of this bar rather than a
   * rename of either above it.
   *
   * WHAT IT KEEPS, and why it is not `chrome=off`: the dark demo STAGE and the
   * browser-window frame stay (forced in `DeviceFrameContext`, like
   * `present=1`), and so does the demo controls bar — carrying the PROGRESS
   * dropdown and nothing else. The direct ask was to keep the bar and the
   * background and hide the rest; `chrome=off` removes all three, which is why
   * it is the wrong tool here even though it looks like the right one.
   *
   * WHAT SURVIVES: the two controls a moderator uses DURING a session —
   * Progress ("now imagine you are two weeks in") and Navigation (switching
   * the A/B's arms). Everything else either re-baselines the demo (Reset, the
   * kebab), swaps the whole scenario (Persona, Education) or moves a treatment
   * the session is holding still (Pacing, Readiness). See
   * `TEST_VIEW_CONTROLS`, where Navigation's own trade-off is recorded.
   *
   * ⚠ A WHITELIST, so it fails CLOSED — see `DemoControlsBar`'s `only`. The
   * next dropdown added to that bar does NOT appear in test links by default,
   * which is the right direction for a control a participant must never meet.
   */
  if (params.get('test') === '1') {
    return <DemoControlsBar open fullBleed={framed} only={TEST_VIEW_CONTROLS} />
  }
  // Routes that carry a hide-able stakeholder demo banner (→ show the toggle).
  const showDemoToggle = pathname === '/dashboard-rebrand' || pathname === '/onboarding-flow'
  return (
    <>
      <PrototypeBar
        adminTools={<AdminToolsMenu />}
        deviceToggle={<DeviceFrameToggle />}
        demoToggle={
          showDemoToggle ? <DemoControlsToggle active={demoOpen} onToggle={toggleDemo} /> : undefined
        }
        fullBleed={framed}
      />
      <DemoControlsBar open={demoOpen} fullBleed={framed} />
    </>
  )
}

/** "Demo" show/hide toggle in the PrototypeBar (rebrand shell only). A pill on
 *  the dark strip: filled with a teal status dot when the Demo Controls banner
 *  is shown, outlined + dim dot when hidden. `aria-pressed` + the dot signal
 *  state (never color alone). Colors stay on white overlays + the brand teal so
 *  they read on the theme-stable dark bar. */
function DemoControlsToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={active ? 'Hide demo controls' : 'Show demo controls'}
      title={active ? 'Hide demo controls' : 'Show demo controls'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        height: 26,
        padding: '0 12px',
        borderRadius: 'var(--radius-pill)',
        border: '1px solid rgb(255 255 255 / 0.28)',
        background: active ? 'rgb(255 255 255 / 0.16)' : 'transparent',
        color: 'var(--color-neutral-50)',
        fontFamily: 'var(--font-body)',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.04em',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: active ? 'var(--color-nav-active)' : 'rgb(255 255 255 / 0.4)',
          boxShadow: active ? '0 0 0 3px rgb(255 255 255 / 0.14)' : 'none',
        }}
      />
      Demo
    </button>
  )
}
