import { useState } from 'react'
import { ArrowLeft, ArrowUpRightFromSquare, X } from '@/icons'
import { Sheet } from '@/components/ui/Sheet'
import { PillTabs } from '@/components/ui/PillTabs'
import {
  FLAG_DESIGNERS,
  flagOwner,
  type DesignerId,
} from '@/context/FeatureFlagContext'
import { DASHBOARD_VERSIONS } from '@/data/dashboardVersions'

/** The minimal shape a version card needs. `DashboardVersion` and
 *  `MembershipPageVersion` both satisfy it, so this one panel backs both the
 *  Dashboard Version and Membership Version pickers. */
export type VersionPickerItem = {
  id: string
  label: string
  createdAt: string
  modifiedAt: string
  description: string
  /** `'ready'` when stakeholders can pick this version on the demo site.
   *  Anything else (including absent) is design-site-only — see the badge. */
  maturity?: 'wip' | 'ready'
  /** Whose exploration this version is. Absent means Jill — resolved through
   *  `flagOwner`, never read directly, so the default lives in one place. */
  owner?: DesignerId
}

type Props = {
  open: boolean
  onClose: () => void
  activeVersionId: string
  onSelectVersion: (id: string) => void
  /** The version a fresh /dashboard visit lands on. */
  defaultVersionId: string
  /** Persist a new default version (from the per-row "Set as default"). */
  onSetDefault: (id: string) => void
  /** Version list to show. Defaults to the full `DASHBOARD_VERSIONS` (the
   *  Explore Dashboard feature). The Dashboard Discoverability feature passes
   *  its own list of layout variants; the Membership Version picker passes
   *  MEMBERSHIP_PAGE_VERSIONS. */
  versions?: VersionPickerItem[]
  /** Panel title (Sheet + header). Defaults to "Dashboard Versions". */
  title?: string
  /** Hide the per-row "Set as default" / "Current default" action controls (the
   *  buttons/note below each row). The inline "Default" pill on the default
   *  version's label still shows. The Discoverability feature is URL-driven (no
   *  persisted default to *set*), so it passes this even with multiple versions —
   *  but it still marks which layout is the default. */
  hideSetDefault?: boolean
  /** Optional CTA rendered below the version list, visually separated. Used by
   *  the Discoverability picker for the "Go to Legacy 2.0 Dashboard" jump-off —
   *  it leaves the rebrand shell for the classic /dashboard, so it's a plain
   *  navigation CTA, not a selectable in-shell version card. */
  secondaryCta?: { label: string; onClick: () => void }
  /** When set, the top-left header control is a "Back" affordance (arrow +
   *  "Back") instead of "Close" — used when this panel was opened FROM the
   *  Feature Flag sheet (the rebrand's Dashboard Version row), so it returns
   *  there rather than dismissing outright. */
  onBack?: () => void
  /** Which edge the sheet slides in from. Defaults to `left` (the classic
   *  /dashboard picker, opened from the robot dropdown). The rebrand passes
   *  `right` so it matches the right-anchored Feature Flag sheet it drills in
   *  from. */
  side?: 'left' | 'right'
  /**
   * Draw the designer tab strip over the list — 2026-10-05, the direct ask
   * ("the jill and eric tab should be in that Dashboard Versions").
   *
   * ⚠ OPT-IN, NOT ALWAYS ON. This panel serves three pickers: the dashboard
   * versions, the classic Explore Dashboard list and the Membership page
   * versions. Only the first has designers — putting Jill / Eric over a
   * Membership version list would be two people's names on something neither
   * of them owns.
   */
  designerTabs?: boolean
}

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map((s) => parseInt(s, 10))
  return DATE_FORMATTER.format(new Date(y, m - 1, d))
}

export function DashboardVersionsPanel({
  open,
  onClose,
  activeVersionId,
  onSelectVersion,
  defaultVersionId,
  onSetDefault,
  versions = DASHBOARD_VERSIONS,
  hideSetDefault = false,
  secondaryCta,
  onBack,
  side = 'left',
  title = 'Dashboard Versions',
  designerTabs = false,
}: Props) {
  /* WHOSE VERSIONS ARE SHOWING. Local state, reset each time the sheet mounts
     — unlike the flag panel's old tab, this one is not worth persisting: the
     sheet is opened to pick a version, not to sit in, and reopening on
     somebody else's empty tab would be a worse default than starting at the
     top of the list. */
  const [owner, setOwner] = useState<DesignerId>(FLAG_DESIGNERS[0].id)
  /* ⚠ FILTERED ONLY WHEN THE TABS ARE DRAWN. Without them there is nothing on
     screen to explain a missing row, so an unfiltered list is the honest
     default for the pickers that do not opt in. */
  const shown = designerTabs ? versions.filter((v) => flagOwner(v) === owner) : versions
  // A single-version feature has no "default" to pick; the Discoverability
  // feature is also URL-driven, so it suppresses the action controls via
  // `hideSetDefault`. The inline "Default" pill, though, shows whenever there's
  // more than one version to disambiguate (independent of `hideSetDefault`).
  /* ⚠ COUNTED OFF `shown`, NOT `versions` — otherwise a designer whose tab
     holds a single version still gets the per-row default controls, which are
     there to disambiguate between several. */
  const showDefaultControls = shown.length > 1 && !hideSetDefault
  /* ⚠ ...BUT THE BADGE COUNTS OFF THE WHOLE LIST. It marks which version the
     product renders, and that fact does not stop being true because a tab is
     filtered — hiding it on Eric's single-version tab would make the default
     invisible exactly where someone is deciding whether to replace it. */
  const showDefaultBadge = versions.length > 1
  return (
    <Sheet open={open} onClose={onClose} title={title} width={460} side={side}>
      {/* Header layout mirrors LearningPathsPanel:
            1. Close action alone at the top.
            2. 1px divider below.
            3. Title + description below the divider. */}
      <div
        style={{
          padding: '20px 24px 12px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Back when opened from the Feature Flag sheet (returns there) —
            styled as the same circular arrow button the flag pages use; a plain
            text Close otherwise (opened directly from the robot dropdown). */}
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to settings"
            style={backArrowButtonStyle}
          >
            <ArrowLeft size={16} aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              alignSelf: 'flex-start',
              padding: 0,
              background: 'transparent',
              border: 'none',
              color: 'var(--color-secondary-600)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <X size={16} aria-hidden />
            Close
          </button>
        )}
      </div>
      <div
        aria-hidden
        style={{ height: 1, background: 'var(--color-border-subtle)' }}
      />
      <header
        style={{
          padding: '16px 24px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 24,
            lineHeight: '32px',
            color: 'var(--color-primary-700)',
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            lineHeight: '20px',
            color: 'var(--color-text-secondary)',
          }}
        >
          Pick an iteration to preview. Future design changes can be applied to a specific version
          below.
        </p>
      </header>

      {/* THE DESIGNER TABS — 2026-10-05. They were in the Feature Flag sheet
          for a day and belong here: a VERSION is the thing a designer owns, and
          the flags are read inside whichever one is rendering.

          ⚠ `PillTabs`, NO PER-TAB COUNTS — CLAUDE.md's rule for every segmented
          filter in this app. The total sits beside the strip. */}
      {designerTabs && (
        <div style={designerTabRowStyle}>
          <PillTabs
            items={FLAG_DESIGNERS}
            active={owner}
            onChange={setOwner}
            label="Filter versions by designer"
            size="compact"
          />
          <span style={designerTotalStyle}>
            {shown.length} {shown.length === 1 ? 'version' : 'versions'}
          </span>
        </div>
      )}
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: '8px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          overflowY: 'auto',
          flex: 1,
        }}
      >
        {shown.map((version) => {
          const isDefault = version.id === defaultVersionId
          return (
            <li
              key={version.id}
              style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
            >
              <VersionRow
                version={version}
                active={version.id === activeVersionId}
                isDefault={isDefault && showDefaultBadge}
                onSelect={() => {
                  onSelectVersion(version.id)
                  onClose()
                }}
              />
              {/* Default trigger sits outside the row button (no nested
                  buttons). Becomes a static "current default" note once
                  this version is the default. Hidden for single-version
                  features (nothing to switch between). */}
              {showDefaultControls && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {isDefault ? (
                    <span style={defaultNoteStyle}>Current default</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSetDefault(version.id)}
                      style={setDefaultButtonStyle}
                    >
                      Set as default
                    </button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {/* Jump-off CTA (e.g. "Go to Legacy 2.0 Dashboard") — a plain navigation
          out of the shell, kept OUT of the version list since it isn't an
          in-shell layout you can preview. */}
      {secondaryCta && (
        <div style={legacyCtaWrapStyle}>
          <button
            type="button"
            onClick={() => {
              secondaryCta.onClick()
              onClose()
            }}
            style={legacyCtaStyle}
          >
            {secondaryCta.label}
            <ArrowUpRightFromSquare size={15} aria-hidden />
          </button>
        </div>
      )}
    </Sheet>
  )
}

// Circular back-arrow button — matches FeatureFlagPanel's `backArrowButtonStyle`
// so the "back to the settings sheet" affordance reads identically across both.
const backArrowButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'flex-start',
  width: 28,
  height: 28,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-neutral-100)',
  color: 'var(--color-text-primary)',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
} as const

const legacyCtaWrapStyle = {
  padding: '16px 24px 24px',
  borderTop: '1px solid var(--color-border-subtle)',
} as const

const legacyCtaStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  width: '100%',
  padding: '11px 16px',
  background: 'var(--color-primary-600)',
  color: 'var(--color-text-inverse)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
} as const

function VersionRow({
  version,
  active,
  isDefault,
  onSelect,
}: {
  version: VersionPickerItem
  active: boolean
  isDefault: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? 'true' : undefined}
      style={{
        width: '100%',
        textAlign: 'left',
        background: 'var(--color-surface-card)',
        border: active
          ? '2px solid var(--color-neutral-darkest)'
          : '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: active ? '11px 13px' : '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        cursor: 'pointer',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: 15,
          lineHeight: '22px',
          color: 'var(--color-text-primary)',
        }}
      >
        {version.label}
        {isDefault && <span style={defaultBadgeStyle}>Default</span>}
        {/* ⚠ ONLY THE DESIGN SITE EVER SEES THIS. The demo site's list is
            already filtered to `ready` (`dashboardVersionsForAudience`), so a
            row carrying this badge cannot reach a stakeholder — which is the
            point: it tells a DESIGNER that the version they are looking at is
            one stakeholders cannot pick.

            ⚠ WORDS, NOT A COLOUR. The demo bar's `wip` mark is a dot plus
            visually-hidden text because the bar has no legend and a dot means
            nothing on its own; this list has room for the words, so it says
            them. Same rule, fuller form.

            ⚠ ABSENT COUNTS AS WIP, matching the field's own default — a version
            added without a `maturity` is design-site-only, and this badge is
            what makes that visible rather than a silent omission. */}
        {version.maturity !== 'ready' && (
          <span style={wipBadgeStyle}>Design site only</span>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          lineHeight: '20px',
          color: 'var(--color-text-secondary)',
        }}
      >
        <span>Created · {formatDate(version.createdAt)}</span>
        <span
          aria-hidden
          style={{ width: 1, height: 14, background: 'var(--color-border-subtle)' }}
        />
        <span>Last modified · {formatDate(version.modifiedAt)}</span>
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          lineHeight: '20px',
          color: 'var(--color-text-secondary)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {version.description}
      </p>
    </button>
  )
}

// Small "Default" pill next to the label of the default version.
/* The designer strip + the total beside it. `space-between` so the count sits
   at the sheet's right edge rather than against the pills, where it would read
   as a count OF the selected tab. */
const designerTabRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
  padding: '4px 24px 0',
} as const

const designerTotalStyle = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-tertiary)',
  whiteSpace: 'nowrap',
} as const

/* Quieter than `defaultBadgeStyle` on purpose: Default is a statement about
   the product, this is a statement about readiness, and a reviewer scanning the
   list should find the Default badge first. */
const wipBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '1px 8px',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-neutral-100)',
  color: 'var(--color-text-tertiary)',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
} as const

const defaultBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '1px 8px',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-primary-100)',
  color: 'var(--color-primary-700)',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
} as const

// "Set as default" text trigger under each non-default row.
const setDefaultButtonStyle = {
  background: 'transparent',
  border: 'none',
  padding: '2px 4px',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-action)',
  cursor: 'pointer',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
} as const

// Static note shown under the row that is already the default.
const defaultNoteStyle = {
  padding: '2px 4px',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-text-tertiary)',
} as const
