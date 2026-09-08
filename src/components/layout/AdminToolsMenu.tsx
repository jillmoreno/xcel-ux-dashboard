import { useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Crown, Flag, Monitor, Robot, Users } from '@/icons'
import { SwitchAccountPanel } from '@/components/account/SwitchAccountPanel'
import { useDashboardVersionsPanel } from '@/components/dashboard/DashboardVersionsPanelContext'
import { useMembershipVersionsPanel } from '@/components/membership/MembershipVersionsPanelContext'
import { useFeatureFlagPanel } from '@/components/account/FeatureFlagPanelContext'
import { useFeatureFlags } from '@/context/FeatureFlagContext'

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
 */
export function AdminToolsMenu() {
  const [open, setOpen] = useState(false)
  const [switchOpen, setSwitchOpen] = useState(false)
  const { demoMode } = useFeatureFlags()
  const { openPanel: openVersionsPanel } = useDashboardVersionsPanel()
  const { openPanel: openMembershipVersionsPanel } = useMembershipVersionsPanel()
  const { openPanel: openFeatureFlagPanel } = useFeatureFlagPanel()
  // `onRebrand` gates the rebrand-only rows. The Dashboard Rebrand shell has its
  // own always-visible Demo Controls bar that owns tier + brand switching, so
  // this hidden menu drops those two duplicates there (see the guards below).
  const { pathname, search } = useLocation()
  const onRebrand = pathname === '/dashboard-rebrand'
  // In the "pure" Demo view the tools are hidden by default so stakeholders see
  // a clean demo. A discreet back door — `?tools=1` on the URL — reveals them
  // for ephemeral, non-persisting tweaks (demo mode suspends flag persistence,
  // so nothing here can drift the sandbox or the saved Default baseline). The
  // Switch Brand / Prototype Password rows write to persisted account state, so
  // they're dropped from the demo menu (see `!demoMode` guards below).
  const toolsRevealed = new URLSearchParams(search).get('tools') === '1'
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

  // Demo view: hide the tools entirely unless the `?tools=1` back door is set.
  // (All hooks above have run, so this conditional return is safe.)
  if (demoMode && !toolsRevealed) return null

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
        aria-haspopup={onRebrand ? 'dialog' : 'menu'}
        aria-expanded={onRebrand ? undefined : open}
        aria-controls={onRebrand ? undefined : id}
        aria-label={onRebrand ? 'Settings' : 'Admin tools'}
        // On the rebrand every setting lives in the single Feature Flag sheet
        // (Dashboard Version is its first row), so the robot opens that sheet
        // directly — no intermediate dropdown. Every other route keeps the
        // multi-row dropdown.
        onClick={() => {
          if (onRebrand) openFeatureFlagPanel()
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
          {!onRebrand && !demoMode && (
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
          {!onRebrand && (
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
          {!onRebrand && (
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
          {/* "Prototype Password" row was removed — change the gate password
              directly in code (DEFAULT_PROTOTYPE_PASSWORD / localStorage) when
              needed instead of from this menu. */}
        </div>
      )}
      <SwitchAccountPanel open={switchOpen} onClose={() => setSwitchOpen(false)} />
    </div>
  )
}

