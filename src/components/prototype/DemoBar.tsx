import { type CSSProperties, type ReactNode, type RefObject } from 'react'
import { ChevronDown, Check } from '@/icons'
import {
  DEMO_BAR,
  DEMO_COUNT_BADGE,
  DEMO_DOT,
  DESIGN_ACCENT,
  DESIGN_RULE,
  DEMO_FAINT_FILL,
  DEMO_HOVER_FILL,
  DEMO_INNER,
  DEMO_PANEL,
  DEMO_TAG_LABEL,
  DEMO_TRIGGER,
  DEMO_TRIGGER_EYEBROW,
  SQUARE_GROUP,
  SQUARE_GROUP_CLASS,
  SQUARE_LABEL,
  SQUARE_TRIGGER,
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
/* The height of ONE row of controls — a 10.5px/13px pill at 5–7px padding
   lands at 24 either way. The bar's name, its dot and its tools centre
   against this rather than against the full height of a wrapped box. */
const TOOLS_ROW = 24
/* `DEMO_DOT`'s own width, so the dot centres on the same line. */
const DOT_SIZE = 8

export function DemoBar({
  barRef,
  className,
  label = 'Demo Controls',
  ariaLabel,
  children,
  trailing,
  align = 'center',
  fullBleed = false,
  design = false,
}: {
  barRef: RefObject<HTMLDivElement | null>
  className?: string
  label?: string
  ariaLabel: string
  children: ReactNode
  /**
   * The block pinned at the bar's TOP-RIGHT — tools, not controls.
   *
   * ⚠ IT HAS TO BE A SLOT, NOT ANOTHER CHILD. Passed as a child with
   * `margin-left: auto` it is just another item in a WRAPPING row, so it goes
   * wherever the wrap puts it: on a two-row bar the tools sit at the end of
   * row two, and on a three-row bar, row three. The icons are the bar's own
   * furniture and belong in one place regardless of how many rows the
   * controls need (2026-10-16). Given here, the controls wrap inside their
   * own box and this sits beside them, aligned to the first row.
   */
  trailing?: ReactNode
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
  /**
   * Draw the DESIGN bar's accent instead of the demo one — 2026-10-05, with
   * `DesignControlsBar`.
   *
   * ⚠ A PROP ON THE SHARED CHROME, not a second bar component. The two bars are
   * the same object with different contents and one different colour; forking
   * the chrome would mean a spacing fix landing on one and being reported as a
   * bug on the other.
   *
   * ⚠ THE COLOUR IS THE ONLY TELL, so it has to be unmistakable. Amber means
   * "this is what a stakeholder sees and only Jillienne changes"; green means
   * "this is yours". Anyone reading the two bars has to answer "may I touch
   * this?" at a glance, because the answer is now enforced by a hook.
   */
  design?: boolean
}) {
  return (
    <div
      className={`cre-demo-controls${className ? ` ${className}` : ''}`}
      // When left-anchored (rebrand shell) the navy bar is capped at the 1440
      // rail+content width and left-aligned, so on screens wider than 1440 the
      // area to the right shows the page background (matching the app header +
      // prototype bar) instead of the navy strip running to the viewport edge.
      // Full-bleed drops the cap so the bar spans the whole Demo-frame width.
      style={{
        ...(fullBleed
          ? { ...DEMO_BAR, width: '100%' }
          : align === 'left'
            ? { ...DEMO_BAR, maxWidth: 1440, alignSelf: 'flex-start', width: '100%' }
            : DEMO_BAR),
        ...(design ? { borderBottom: `3px solid ${DESIGN_RULE}` } : null),
      }}
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
        {/* ⚠ THE DOT FOLLOWS THE BAR, and did not until 2026-10-05: the design
            bar drew the DEMO bar's amber dot above its own cyan rule, because
            `DEMO_DOT` is a shared constant that knew nothing about `design`.
            Two accents on one bar reads as a mistake, and it was. */}
        {/* ⚠ WITH A TRAILING BLOCK THE DOT AND NAME PIN TO THE FIRST ROW TOO.
            The outer row centres its items, which is right while everything
            is one row — but the controls box is now as tall as the wrap makes
            it, so centring left the bar's own name floating between rows one
            and two while its tools sat at the top. The bar's furniture
            belongs together. `TOOLS_ROW` is the control row's height, so the
            name sits level with the first row of controls rather than with
            the top of the box. */}
        <span
          aria-hidden
          style={
            trailing
              ? { ...(design ? { ...DEMO_DOT, background: DESIGN_ACCENT } : DEMO_DOT), alignSelf: 'flex-start', marginTop: (TOOLS_ROW - DOT_SIZE) / 2 }
              : design
                ? { ...DEMO_DOT, background: DESIGN_ACCENT }
                : DEMO_DOT
          }
        />
        <span
          style={
            trailing
              ? { ...DEMO_TAG_LABEL, alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', height: TOOLS_ROW }
              : DEMO_TAG_LABEL
          }
        >
          {label}
        </span>
        {trailing ? (
          <>
            {/* The controls wrap inside their own box so the trailing block
                is not part of what wraps. `minWidth: 0` or a long row of
                controls refuses to shrink and pushes the tools off the bar. */}
            <span style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
              {children}
            </span>
            {/* Top of the first row, whatever the controls do below it. */}
            <span style={{ flex: 'none', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', height: TOOLS_ROW, gap: 8 }}>
              {trailing}
            </span>
          </>
        ) : (
          children
        )}
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
  triggerStyle,
  square = false,
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
  /**
   * Overrides on the trigger's own box — the DESIGN bar passes squares
   * (2026-10-16), because its controls follow Anjani's prototype and a bar
   * that is half pill and half square reads as a mistake. Every other caller
   * omits it and keeps the pill, which is the demo bar's shape.
   */
  triggerStyle?: CSSProperties
  /**
   * ANJANI'S SHAPE — a square trigger carrying the VALUE alone, with the
   * control's name beside it rather than baked in as an eyebrow
   * (2026-10-16). Both product bars pass it; `OnboardingDemoBar` does not,
   * and keeps the pill it has always had.
   */
  square?: boolean
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
  const control = (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        className="cre-demo-controls-btn"
        style={{
          ...DEMO_TRIGGER,
          ...(square ? SQUARE_TRIGGER : null),
          ...triggerStyle,
          ...(isDisabled ? { opacity: 0.4, cursor: 'not-allowed' } : null),
        }}
        disabled={isDisabled}
        /* ⚠ THE NAME KEEPS THE EYEBROW WHEN THE EYEBROW MOVES OUT. In square
           mode the control's name sits beside it as a sibling, so the button
           itself would announce only its VALUE — "On Track · ~63%", with
           nothing saying which axis that is. Restated here, so what a screen
           reader hears is what the pill used to read. (`DemoControlsBar`'s
           suite queries these by name and caught it the moment the label
           moved — 14 of them at once.) */
        aria-label={square && eyebrow ? `${eyebrow}: ${label}` : undefined}
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
        {eyebrow && !square && <span style={DEMO_TRIGGER_EYEBROW}>{eyebrow}:</span>}
        {label}
        {count ? <span style={DEMO_COUNT_BADGE}>{count}</span> : null}
        {/* ⚠ A DOT PLUS WORDS, never the dot alone: "not on the demo site" is
            not a colour anyone can be expected to know, and the bar has no
            legend. The text is visually hidden so the pill keeps its width.

            ⚠ AND IT DOES NOT SAY "work in progress", which is what it said for
            one commit. That phrase contains "Progress" — the name of a control
            on this very bar — so it broke two unrelated suites that query
            `/Progress/i` and started matching Persona, Pacing and Education
            too. Hidden text still lands in the accessible name; word it as if
            it were visible, because to a query it is. */}
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
  /* The name outside the control, as a group — and the group is what the
     separator rule in `tokens.css` keys on. A square control with no
     `eyebrow` still gets the wrapper, so the rules fall between every pair
     of controls rather than only the named ones. */
  if (!square) return control
  return (
    <span className={SQUARE_GROUP_CLASS} style={SQUARE_GROUP}>
      {eyebrow && <span style={SQUARE_LABEL}>{eyebrow}</span>}
      {control}
    </span>
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
