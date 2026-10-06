import { useLocation } from 'react-router-dom'
import { isPublicGateway, isTestSession } from '@/data/gatewayMode'
import { PrototypeBar } from './PrototypeBar'
import { AdminToolsMenu } from './AdminToolsMenu'
import { DeviceFrameToggle, useDeviceFrame } from './DeviceFrameContext'
import { DemoControlsBar } from '@/components/prototype/DemoControlsBar'
import { DesignControlsBar } from '@/components/prototype/DesignControlsBar'
import { DESIGN_ACCENT } from '@/components/prototype/demoBarUtil'
import { DemoShareProvider } from '@/components/prototype/demoShareActions'
import {
  useDemoControlsVisibility,
  useDesignControlsVisibility,
} from '@/components/prototype/demoControlsVisibility'
import { demoSiteControls } from '@/data/demoControlMaturity'

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
 * ⚠ `navigation` WAS HERE, by direct ask (2026-09-23), and was the entry to
 * think twice about: it was the `dashboard-navigation` A/B's own independent
 * variable, so putting it in front of a participant told them a comparison
 * existed — most of what a moderated session is trying not to say. It was in
 * anyway because switching arms mid-session beat reloading and re-pasting the
 * session link. BOTH the control and the flag were archived on 2026-10-01 when
 * Option 1 won, so the trade-off is moot; see `archivedItems.ts`.
 *
 * `progress` is the survivor, for the plainer reason that a moderator changes
 * it between tasks ("now imagine you are two weeks in").
 *
 * ⚠ IT IS A ONE-ENTRY LIST NOW. Kept as a list rather than collapsed to a
 * single value — the whitelist is the mechanism, and the next control a
 * session needs should be an array entry, not a re-plumb.
 */
const TEST_VIEW_CONTROLS = ['progress'] as const


export function PrototypeChrome() {
  const { pathname, search } = useLocation()
  const { open: demoOpen, toggle: toggleDemo } = useDemoControlsVisibility()
  const { open: designOpen, toggle: toggleDesign } = useDesignControlsVisibility()
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
  // `?as=demo` — THE DESIGN SITE'S PREVIEW LENS, 2026-09-24. Renders this build's
  // controls bar the way the DEMO site would: the `wip` controls drop out, and
  // the bar says so. It is a lens, not a setting — URL-only, never persisted, and
  // it changes nothing about the page under the bar. The question it answers is
  // the one that used to need a second deploy: "what does a stakeholder actually
  // get?" (No effect on the demo site itself, where the answer is already yes.)
  const asDemo = params.get('as') === 'demo'
  /* THE STAKEHOLDER VIEW — the Demo Hub, and `?as=demo` previewing it from the
     design site. Derived once and handed to both the robot and the design bar,
     because those two now have to agree: the robot's dropdown is the only way to
     a bar that starts hidden, so a build where one read the lens and the other
     did not would leave the controls unreachable. */
  const stakeholderView = isPublicGateway() || asDemo
  /* ⚠ THE DESIGN TOGGLE WAS GATED ON `hasDesignControls` AND NO LONGER IS
     (2026-10-05). The gate existed because the bar returned null on a version
     with no design flags, and a toggle revealing an empty strip reads as
     broken. Lo-fi moving onto that bar removed the empty case entirely — it now
     always carries Lo-fi and the flag icon — so the gate was protecting against
     something that cannot happen, and `designControlsFor` / `flagOwner` /
     `DISCOVERABILITY_DASHBOARD_VERSIONS` left this file with it. */
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
  if (isTestSession(search)) {
    return <DemoControlsBar open fullBleed={framed} only={TEST_VIEW_CONTROLS} />
  }
  // Routes that carry a hide-able stakeholder demo banner (→ show the toggle).
  const showDemoToggle = pathname === '/dashboard-rebrand' || pathname === '/onboarding-flow'
  return (
    /* ⚠ WRAPS BOTH BARS, and it has to: the kebab renders in the PrototypeBar
       while its handlers are owned by the DemoControlsBar below — see
       `demoShareActions.tsx` for why they could not move together. It also owns
       the "Link copied" toast, so copying still confirms while the demo bar is
       toggled off. */
    <DemoShareProvider>
      <PrototypeBar
        /*
         * THE ROBOT IS DESIGN-SITE ONLY — 2026-09-24, the direct ask.
         *
         * It is the Admin Tools trigger, and on `/dashboard-rebrand` it opens
         * the FULL Feature Flag sheet — every flag in the catalog, `wip` ones
         * included. That is the exact leak the maturity work exists to close:
         * trimming the demo bar to the finished axes means nothing while a
         * stakeholder is one click from the raw catalog behind it.
         *
         * ⚠ IT IS HIDDEN AT REST, which made it easy to miss. `opacity: 0` with
         * a hover/focus reveal in tokens.css is not a gate — it is discoverable
         * by accident, reachable by Tab, and fully clickable the whole time.
         *
         * Undefined rather than hidden: the slot is optional, so not passing it
         * means the button is never in the DOM at all. A `display: none` would
         * still ship the panel's mount and leave it findable.
         *
         * Participant sessions (`?test=1`) already never reach here — that
         * branch returns above with the demo bar alone and no PrototypeBar.
         */
        /* ⚠ THE ROBOT IS NO LONGER WITHHELD HERE (2026-10-06) — it carries a
           different payload instead, which is what the 2026-09-24 gate was
           actually for. Its words were "the robot opens the FULL Feature Flag
           sheet, so it routes straight around the maturity gate"; `stakeholder`
           shuts that door and opens one row onto the design bar. See
           `AdminToolsMenu`, where the subtraction is spelled out row by row. */
        adminTools={<AdminToolsMenu stakeholder={stakeholderView} />}
        deviceToggle={<DeviceFrameToggle />}
        demoToggle={
          showDemoToggle ? <DemoControlsToggle active={demoOpen} onToggle={toggleDemo} /> : undefined
        }
        designToggle={
          /* ⚠ THE PILL IS DESIGN-SITE-ONLY AND THE BAR IS NOT (2026-10-06),
             which looks inconsistent and IS the ask. The controls are available
             to a stakeholder; they are not ON DISPLAY. A pill sitting on the
             prototype bar is display; the robot's dropdown, invisible until
             hovered, is not. So the two surfaces own the same toggle on their
             own sites, and the state behind both is one store either way. */
          stakeholderView ? undefined : (
            <DesignControlsToggle active={designOpen} onToggle={toggleDesign} />
          )
        }
        fullBleed={framed}
      />
      {/* The demo site gets the FINISHED axes only, derived from each control's
          `maturity` — see `demoSiteControls()`. `undefined` on the design site,
          which is every control, with the unfinished ones marked. `?as=demo`
          borrows the demo site's answer without being the demo site. */}
      <DemoControlsBar
        open={demoOpen}
        fullBleed={framed}
        only={isPublicGateway() || asDemo ? demoSiteControls() : undefined}
      />
      {/* THE DESIGN BAR, under the demo one — 2026-10-05.

          ⚠ IT REACHES THE DEMO HUB NOW (2026-10-06, the direct ask), and the
          design-site-only rule this comment used to carry is gone. What
          replaces it sits a level up rather than here: the demo site lists
          `maturity: 'ready'` VERSIONS only, and `designControlsFor` scopes
          every control to the version on screen. Choosing what a stakeholder
          may touch is still a deliberate act — it is promoting a version, not
          hiding a bar.

          ⚠ BUT IT STARTS HIDDEN THERE, and the robot's dropdown is the only
          way to it — see `demoControlsVisibility`, where the default is now
          per-site, and `AdminToolsMenu`, which is back on the Demo Hub carrying
          that one row. Available, not on display.

          ⚠ WHAT DOES NOT CROSS IS THE FEATURE FLAG SHEET, withheld by
          `stakeholder` on this bar and on the robot both. It opens the FULL
          catalog, `wip` rows included — the exact leak the robot's old
          demo-site gate existed to close. Lo-fi DOES cross: its objection was
          that a stakeholder should not be HANDED a control that greys the
          product out, and behind a hidden menu and a hidden bar nobody is
          handed it.

          ⚠ AND `?as=demo` NOW SHOWS IT, for precisely the reason it used to
          hide it. The lens answers "what does a stakeholder get", so it is
          wrong in whichever direction it disagrees with the demo build. ⚠ The
          one thing it cannot borrow is the hidden-by-default start: the toggle
          persists per browser, so a designer previewing sees their own stored
          choice. Reachability is what the lens answers for. */}
      {designOpen ? (
        <DesignControlsBar fullBleed={framed} stakeholder={stakeholderView} />
      ) : null}
    </DemoShareProvider>
  )
}

/** "Demo" show/hide toggle in the PrototypeBar (rebrand shell only). A pill on
 *  the dark strip: filled with a teal status dot when the Demo Controls banner
 *  is shown, outlined + dim dot when hidden. `aria-pressed` + the dot signal
 *  state (never color alone). Colors stay on white overlays + the brand teal so
 *  they read on the theme-stable dark bar. */
/**
 * The DESIGN bar's show/hide toggle — 2026-10-05, the direct ask.
 *
 * ⚠ THE SAME PILL AS `DemoControlsToggle`, one word and one dot colour apart.
 * They hide two different bars and a reader has to tell them apart instantly;
 * making them LOOK the same is what says "these are the same kind of control",
 * and the dot is what says which. Forking the shape would have made them read
 * as unrelated.
 *
 * ⚠ LIGHT CYAN, matching its bar's rule, the way the demo pill's dot matches
 * its amber one. The colour is the only tell on either bar, so it has to be the
 * same tell in both places — `DESIGN_ACCENT`, not a literal.
 *
 * ⚠ IT IS NEVER RENDERED WITHOUT CONTROLS BEHIND IT — see `hasDesignControls`
 * in `PrototypeChrome`. A toggle that reveals an empty strip reads as broken.
 */
function DesignControlsToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={active ? 'Hide design controls' : 'Show design controls'}
      title={active ? 'Hide design controls' : 'Show design controls'}
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
          background: active ? DESIGN_ACCENT : 'rgb(255 255 255 / 0.4)',
          boxShadow: active ? '0 0 0 3px rgb(255 255 255 / 0.14)' : 'none',
        }}
      />
      Design
    </button>
  )
}

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
