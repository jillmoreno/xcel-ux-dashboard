import { useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Crown, Flag, Monitor, Robot, Sliders, Users } from '@/icons'
import { SwitchAccountPanel } from '@/components/account/SwitchAccountPanel'
import { useDashboardVersionsPanel } from '@/components/dashboard/DashboardVersionsPanelContext'
import { useMembershipVersionsPanel } from '@/components/membership/MembershipVersionsPanelContext'
import { useFeatureFlagPanel } from '@/components/account/FeatureFlagPanelContext'
import { useFeatureFlags } from '@/context/FeatureFlagContext'
import { useDesignControlsVisibility } from '@/components/prototype/demoControlsVisibility'

/**
 * Hidden admin / UI-UX demo tools menu.
 *
 * Lives in the header to the LEFT of the brand logo and is intentionally
 * invisible at rest — the trigger button's opacity is 0 until the
 * surrounding hover-zone is hovered or the button itself is focused
 * (keyboard navigation reveals it too, so the affordance is still
 * accessible). Off the rebrand, clicking the robot trigger expands a small
 * dropdown of UI/UX demo tools — Switch Brand, Dashboard Version, Membership
 * Version, and Feature Flag. On `/dashboard-rebrand` the robot instead opens
 * the single Feature Flag sheet directly (all settings in one source —
 * Dashboard Version is that sheet's first row), so there's no dropdown there.
 *
 * Moved here from `AccountMenu` so the production-facing account menu
 * doesn't carry any reviewer-only scaffolding. The behaviour of each
 * row is unchanged — they open the same SwitchAccountPanel /
 * DashboardVersionsPanel / FeatureFlagPanel slide-overs.
 *
 * ⚠ THE ROBOT IS BACK ON THE DEMO HUB (2026-10-06), after being withheld there
 * since 2026-09-24 — and `stakeholder` is what makes that a narrowing rather
 * than a reversal. The old gate was never about the robot: its words were "the
 * robot opens the FULL Feature Flag sheet, so it routes straight around the
 * maturity gate". That door stays shut; a different one opens.
 *
 *   - the stakeholder dropdown carries ONE row, "Design controls", which shows
 *     and hides the design bar. That bar starts hidden on the Demo Hub, so this
 *     is the only way to it — the direct ask: available, not on display.
 *   - every other row is withheld, the Feature Flag sheet first among them. On
 *     the rebrand the robot normally opens that sheet with no dropdown at all;
 *     under `stakeholder` it takes the dropdown branch instead, so there is no
 *     path at all from this button to the catalog.
 *
 * ⚠ IT FAILS THE WRONG WAY IF SOMEONE ADDS A ROW WITHOUT A GUARD. The rows
 * below are allow-by-default and `stakeholder` subtracts from them — the
 * opposite of `DemoControlsBar`'s `only`, which fails closed. A new row needs
 * `!stakeholder` written on it deliberately, so `PublicGateway.test.tsx` asserts
 * the Demo Hub dropdown has exactly ONE row: an omission fails there rather
 * than shipping behind a button that is invisible at rest.
 */
export function AdminToolsMenu({ stakeholder = false }: { stakeholder?: boolean }) {
  const [open, setOpen] = useState(false)
  const [switchOpen, setSwitchOpen] = useState(false)
  const { demoMode } = useFeatureFlags()
  const { openPanel: openVersionsPanel } = useDashboardVersionsPanel()
  const { openPanel: openMembershipVersionsPanel } = useMembershipVersionsPanel()
  const { openPanel: openFeatureFlagPanel } = useFeatureFlagPanel()
  // `onRebrand` gates the rebrand-only rows. The Dashboard Rebrand shell has its
  // own always-visible Demo Controls bar that owns tier + brand switching, so
  // this hidden menu drops those two duplicates there (see the guards below).
  const { pathname } = useLocation()
  const onRebrand = pathname === '/dashboard-rebrand'
  const { open: designOpen, toggle: toggleDesign } = useDesignControlsVisibility()
  /* ⚠ THE DIRECT-OPEN SHORTCUT IS DESIGN-SITE-ONLY NOW. On the rebrand the robot
     opens the flag sheet with no dropdown in between — which under `stakeholder`
     would be the catalog, one click, no menu to guard. So the stakeholder copy
     always takes the dropdown branch, and the aria below follows it. */
  const openSheetDirectly = onRebrand && !stakeholder
  // THE DEMO VIEW KEEPS THE ROBOT (2026-09-16, at Jillienne's request). It used
  // to `return null` under `?demo=1` unless a `?tools=1` back door was set, on
  // the reasoning that a stakeholder should see a clean demo. Two things make
  // that cost real and the benefit near-zero here:
  //
  //   - The trigger is `opacity: 0` at rest and only fades to 60% when its own
  //     32px box is hovered, so "clean" was never what the gate was buying —
  //     there is nothing on screen to clean up.
  //   - The Demo row on the gateway opens `/dashboard-rebrand?demo=1`, which is
  //     how most people arrive. Hiding the tools there meant the one route a
  //     reviewer actually lands on was the one route with no way into the flag
  //     sheet, and the `?tools=1` back door is undiscoverable by design.
  //
  // What made the gate defensible is still true and is what makes removing it
  // safe: demo mode SUSPENDS flag persistence, and `FeatureFlagPanel` already
  // drops "Set as default" and "Restore original defaults" under `demoMode`, so
  // nothing reachable from here can drift the sandbox or redefine the committed
  // Demo baseline. Changes preview and reset on exit — which the panel now says
  // on screen, since the dropdown that used to carry that sentence never renders
  // on the rebrand (the robot opens the sheet directly there).
  //
  // `?tools=1` is no longer read. An old link carrying it still works; the param
  // is simply ignored.
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()

  // Close on outside click / Escape — same pattern as AccountMenu.
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  // When the menu is open, force the trigger to stay visible so the
  // user can see what they just clicked even if their cursor drifts
  // off the hover-zone.
  const triggerOpacity = open ? 1 : undefined

  return (
    <div
      ref={ref}
      className="cre-admin-tools"
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
    >
      <button
        type="button"
        aria-haspopup={openSheetDirectly ? 'dialog' : 'menu'}
        aria-expanded={openSheetDirectly ? undefined : open}
        aria-controls={openSheetDirectly ? undefined : id}
        aria-label={openSheetDirectly ? 'Settings' : 'Admin tools'}
        // On the rebrand every setting lives in the single Feature Flag sheet
        // (Dashboard Version is its first row), so the robot opens that sheet
        // directly — no intermediate dropdown. Every other route keeps the
        // multi-row dropdown.
        onClick={() => {
          if (openSheetDirectly) openFeatureFlagPanel()
          else setOpen((v) => !v)
        }}
        className="cre-admin-tools-trigger"
        style={{
          width: 32,
          height: 32,
          padding: 0,
          background: 'transparent',
          border: 'none',
          borderRadius: 'var(--radius-pill)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-tertiary)',
          // Hidden at rest; CSS in tokens.css reveals on hover / focus.
          // `triggerOpacity` overrides while the dropdown is open.
          opacity: triggerOpacity,
          transition: 'opacity 200ms ease, color 160ms ease',
        }}
      >
        <Robot size={22} aria-hidden />
      </button>

      {open && (
        <div
          id={id}
          role="menu"
          aria-label="Admin tools"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            // Anchored to the right edge of the trigger so the menu opens
            // leftward — the robot now lives at the far-right of the prototype
            // bar, so a left-anchored menu would run off-screen.
            right: 0,
            minWidth: 256,
            background: 'var(--color-surface-card)',
            border: '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-popover)',
            padding: 6,
            zIndex: 60,
          }}
        >
          <span
            style={{
              display: 'block',
              padding: '8px 12px 4px',
              fontFamily: 'var(--font-body)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--color-text-tertiary)',
            }}
          >
            UI/UX Demo Tools
          </span>
          {demoMode && (
            <span
              style={{
                display: 'block',
                padding: '0 12px 6px',
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                lineHeight: '15px',
                color: 'var(--color-text-tertiary)',
              }}
            >
              Demo view — changes preview here only and reset on exit.
            </span>
          )}
          {/* THE DEMO HUB'S ONLY ROW — 2026-10-06, the direct ask: the design
              controls are available to a stakeholder but not on display, so the
              bar starts hidden there and this is the way to it.

              ⚠ IT TOGGLES, IT DOES NOT OPEN A PANEL, which is why it carries a
              state word where every other row here carries none. The rows below
              are all one-way doors into a slide-over; a reader who assumed this
              was one too would click it twice and put the bar back. */}
          {stakeholder && (
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={designOpen}
              onClick={() => {
                setOpen(false)
                toggleDesign()
              }}
              className="cre-menu-item"
            >
              <span className="cre-menu-item-icon" aria-hidden>
                <Sliders size={18} aria-hidden />
              </span>
              Design controls
              <span
                aria-hidden
                style={{
                  marginLeft: 'auto',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-text-tertiary)',
                }}
              >
                {designOpen ? 'Shown' : 'Hidden'}
              </span>
            </button>
          )}
          {/* Membership-tier switch removed here on the rebrand — the always-
              visible Demo Controls bar owns the Non-Member ⇄ tier flip (Quick
              views presets) on `/dashboard-rebrand`, so a second tier control in
              this hidden menu was a straight duplicate. Every other route never
              showed it (it was rebrand-only), so nothing else changes. */}
          {/* "Multiple memberships" / "Multiple professions" toggles were
              removed — the Demo Controls bar's Professions + Memberships
              dropdowns own those (membership-count / profession-count) now. */}
          {/* Switch Brand writes to persisted account state — dropped in the
              Demo view to keep it pure, and dropped on the rebrand where the
              Demo Controls bar's Brand dropdown covers switching brand live
              (SwitchAccountPanel is still reachable from the account menu). */}
          {!onRebrand && !demoMode && !stakeholder && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                setSwitchOpen(true)
              }}
              className="cre-menu-item"
            >
              <span className="cre-menu-item-icon" aria-hidden>
                <Users size={18} aria-hidden />
              </span>
              Switch Brand
            </button>
          )}
          {/* Dashboard Version — on the rebrand this moved into the Feature
              Flag sheet as its first row (the robot opens that sheet directly,
              so this dropdown never shows there). Every other route keeps it. */}
          {!onRebrand && !stakeholder && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                openVersionsPanel()
              }}
              className="cre-menu-item"
            >
              <span className="cre-menu-item-icon" aria-hidden>
                <Monitor size={18} aria-hidden />
              </span>
              Dashboard Version
            </button>
          )}
          {/* Membership Version — the Dashboard Discoverability feature has a
              single membership surface, no versions to switch, so this row is
              hidden there. Every other route (the Explore Dashboard feature)
              keeps it. */}
          {!onRebrand && !stakeholder && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                openMembershipVersionsPanel()
              }}
              className="cre-menu-item"
            >
              <span className="cre-menu-item-icon" aria-hidden>
                <Crown size={18} aria-hidden />
              </span>
              Membership Version
            </button>
          )}
          {/* ⚠ THE ROW THE DEMO HUB MUST NOT HAVE. It opens the full flag
              catalog, `wip` rows included — the single reason the robot was
              withheld from the demo site in the first place (2026-09-24).
              Bringing the robot back without this guard would undo that gate
              exactly, from a button that is invisible at rest, so nothing on
              screen would say so. */}
          {!stakeholder && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                openFeatureFlagPanel()
              }}
              className="cre-menu-item"
            >
              <span className="cre-menu-item-icon" aria-hidden>
                <Flag size={18} aria-hidden />
              </span>
              Feature Flag
            </button>
          )}
          {/* "Prototype Password" row was removed — change the gate password
              directly in code (DEFAULT_PROTOTYPE_PASSWORD / localStorage) when
              needed instead of from this menu. */}
        </div>
      )}
      <SwitchAccountPanel open={switchOpen} onClose={() => setSwitchOpen(false)} />
    </div>
  )
}

