import { type ReactNode, type RefObject } from 'react'
import { ChevronDown, Check } from '@/icons'
import {
  DEMO_BAR,
  DEMO_COUNT_BADGE,
  DEMO_DOT,
  DEMO_FAINT_FILL,
  DEMO_HOVER_FILL,
  DEMO_INNER,
  DEMO_PANEL,
  DEMO_TAG_LABEL,
  DEMO_TRIGGER,
  DEMO_TRIGGER_EYEBROW,
} from './demoBarUtil'

/**
 * Shared presentational primitives for the stakeholder **demo bar** pattern — a
 * single-row navy banner of dropdown pills (label + current selection + chevron)
 * that open white `surface-card` panels of `.cre-menu-item` rows, one at a time.
 *
 * The two concrete bars compose these + the `useDemoMenus` hook + the shared
 * styles from [`demoBarUtil`](src/components/prototype/demoBarUtil.ts):
 *   • [`DemoControlsBar`](src/components/prototype/DemoControlsBar.tsx) — the
 *     Dashboard Rebrand bar (tier / professions / memberships + presets + share).
 *   • [`OnboardingDemoBar`](src/components/onboarding/OnboardingDemoBar.tsx) — the
 *     Onboarding Flow bar (brand / education / goal step / licenses / states).
 *
 * These are dumb + controlled: the bar owns menu state via `useDemoMenus` and
 * threads `openId` / `onToggle` down. See the `create-demo-bar` skill.
 */

/** The banner shell — navy bar + centered inner row + status dot + label. Attach
 *  `barRef` (from `useDemoMenus`) so outside-click dismiss ignores in-bar clicks. */
export function DemoBar({
  barRef,
  className,
  label = 'Demo Controls',
  ariaLabel,
  children,
  align = 'center',
  fullBleed = false,
}: {
  barRef: RefObject<HTMLDivElement | null>
  className?: string
  label?: string
  ariaLabel: string
  children: ReactNode
  /**
   * Horizontal anchoring of the 1440-capped inner row. `'center'` (default)
   * centers it (`mx-auto` — the Onboarding flow's full-width route). `'left'`
   * pins it flush-left so it shares the rebrand shell's coordinate system
   * (rail flush-left, rail+content capped at 1440), matching the app header +
   * prototype bar there.
   */
  align?: 'center' | 'left'
  /**
   * Full-bleed (Demo frame): the bar runs edge-to-edge at full screen width,
   * skipping the 1440 cap. Used when the chrome sits OUTSIDE the centered
   * device window (`device === 'desktop-framed'`). Overrides `align`.
   */
  fullBleed?: boolean
}) {
  return (
    <div
      className={`cre-demo-controls${className ? ` ${className}` : ''}`}
      // When left-anchored (rebrand shell) the navy bar is capped at the 1440
      // rail+content width and left-aligned, so on screens wider than 1440 the
      // area to the right shows the page background (matching the app header +
      // prototype bar) instead of the navy strip running to the viewport edge.
      // Full-bleed drops the cap so the bar spans the whole Demo-frame width.
      style={
        fullBleed
          ? { ...DEMO_BAR, width: '100%' }
          : align === 'left'
            ? { ...DEMO_BAR, maxWidth: 1440, alignSelf: 'flex-start', width: '100%' }
            : DEMO_BAR
      }
      role="region"
      aria-label={ariaLabel}
      ref={barRef}
    >
      <div
        style={
          fullBleed
            ? // Demo frame: content spans the full screen width too (not just the
              // strip), so the Reset/kebab align to the same right edge as the
              // prototype bar's content above it.
              { ...DEMO_INNER, margin: 0, maxWidth: 'none' }
            : align === 'left'
              ? { ...DEMO_INNER, margin: 0 }
              : DEMO_INNER
        }
      >
        <span aria-hidden style={DEMO_DOT} />
        <span style={DEMO_TAG_LABEL}>{label}</span>
        {children}
      </div>
    </div>
  )
}

/** A quick dropdown — a navy pill trigger (optional eyebrow + label + optional
 *  count badge + chevron) opening a white `surface-card` panel of rows. Controlled
 *  via `openId` / `onToggle` from the bar's `useDemoMenus`. */
export function DemoDropdown({
  id,
  label,
  eyebrow,
  count,
  openId,
  onToggle,
  panelRole = 'menu',
  panelLabel,
  panelMinWidth = 220,
  disabledNote,
  hidden = false,
  children,
}: {
  id: string
  label: string
  eyebrow?: string
  count?: number
  openId: string | null
  onToggle: (id: string) => void
  panelRole?: 'menu' | 'radiogroup'
  panelLabel: string
  panelMinWidth?: number
  /** Present = the control is INERT, and this says why. See the note below. */
  disabledNote?: string
  /**
   * GONE ENTIRELY, which is a different thing from `disabledNote` — 2026-09-23.
   *
   * `disabledNote` greys an axis that exists but has nowhere to land, and the
   * note below argues hard for keeping it VISIBLE: a reviewer who came looking
   * for it should find it with a reason rather than doubt their memory.
   *
   * This is for the other case, a MODERATED USER TEST, where the reviewer is a
   * participant who was never told the bar exists. A greyed pill there is not
   * reassurance, it is a question they will ask out loud in the middle of a
   * task. `DemoControlsBar`'s `only` prop is the one caller.
   */
  hidden?: boolean
  children: ReactNode
}) {
  if (hidden) return null
  /* AN AXIS WITH NOWHERE TO LAND — 2026-09-22. The bar offers one dropdown per
     demo axis, and a version that doesn't render the surface behind one leaves
     the pill stating a state the page cannot show: "READINESS: On Track" above
     a dashboard with no Readiness on it.

     KEPT VISIBLE, not hidden, and that is the choice. The axis still exists and
     a reviewer who came looking for it should find it greyed with a reason
     rather than wonder whether they mis-remembered the bar. Hiding it would
     also make the bar's controls jump position between versions.

     `disabled` (not just `aria-disabled`) because there is nothing here to
     announce or operate — no partial state, no "press to hear why". The reason
     rides on `title`, which is the one thing a disabled button still surfaces. */
  const isDisabled = disabledNote != null
  const isOpen = openId === id && !isDisabled
  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        className="cre-demo-controls-btn"
        style={{
          ...DEMO_TRIGGER,
          ...(isDisabled ? { opacity: 0.4, cursor: 'not-allowed' } : null),
        }}
        disabled={isDisabled}
        title={disabledNote}
        aria-haspopup={isDisabled || panelRole === 'radiogroup' ? undefined : 'menu'}
        aria-expanded={isDisabled ? undefined : isOpen}
        onClick={() => onToggle(id)}
        onMouseEnter={(e) => {
          if (!isDisabled) e.currentTarget.style.background = DEMO_HOVER_FILL
        }}
        onMouseLeave={(e) => {
          if (!isDisabled) e.currentTarget.style.background = DEMO_FAINT_FILL
        }}
      >
        {eyebrow && <span style={DEMO_TRIGGER_EYEBROW}>{eyebrow}:</span>}
        {label}
        {count ? <span style={DEMO_COUNT_BADGE}>{count}</span> : null}
        <ChevronDown
          size={13}
          aria-hidden
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}
        />
      </button>
      {isOpen && (
        <div role={panelRole} aria-label={panelLabel} style={{ ...DEMO_PANEL, minWidth: panelMinWidth }}>
          {children}
        </div>
      )}
    </div>
  )
}

/** A menu row — label + a trailing node (defaults to a Check when `active`). Use
 *  `role="radio"` for single-select panels, `"menuitemcheckbox"` for multi-select. */
export function DemoMenuRow({
  label,
  active,
  onSelect,
  role = 'radio',
  trailing,
}: {
  label: string
  active: boolean
  onSelect: () => void
  role?: 'radio' | 'menuitemcheckbox' | 'menuitem'
  trailing?: ReactNode
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={role === 'menuitem' ? undefined : active}
      className={`cre-menu-item cre-demo-controls-btn${active ? ' is-active' : ''}`}
      onClick={onSelect}
    >
      <span style={{ flex: 1 }}>{label}</span>
      {trailing ?? (active && <Check size={15} aria-hidden />)}
    </button>
  )
}
