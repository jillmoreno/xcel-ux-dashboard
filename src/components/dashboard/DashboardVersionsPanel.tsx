import { ArrowLeft, ArrowUpRightFromSquare, X } from '@/icons'
import { Sheet } from '@/components/ui/Sheet'
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
}: Props) {
  // A single-version feature has no "default" to pick; the Discoverability
  // feature is also URL-driven, so it suppresses the action controls via
  // `hideSetDefault`. The inline "Default" pill, though, shows whenever there's
  // more than one version to disambiguate (independent of `hideSetDefault`).
  const showDefaultControls = versions.length > 1 && !hideSetDefault
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
        {versions.map((version) => {
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
