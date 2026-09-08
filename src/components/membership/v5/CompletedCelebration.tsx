import { type CSSProperties, type ReactNode } from 'react'
import { Check, ChevronRight, CircleCheck } from '@/icons'

/**
 * CompletedCelebration — the shared green "you finished the plan" panel used as
 * the LEFT half of the completed-state dashboard bands (ClpJumpBackInBand,
 * LearnerFocusedBand, MarketingFocusedBand). A check medallion + celebratory
 * heading + the requirement stats, with an optional secondary "View
 * Certificate" button pinned under the details (Option 5 direction).
 *
 * Green surface = `--color-success-700`, so it relights per `<html data-brand>`.
 * Kept presentational (all values passed in) so each band computes its own
 * labels/deadline/time-remaining and this panel just renders them identically.
 */
const ON_DARK = 'rgb(255 255 255 / 1)'
const ON_DARK_MUTED = 'rgb(255 255 255 / 0.72)'

export type CompletedStat = { label: string; value: ReactNode }

export function CompletedCelebration({
  title,
  creditHoursTotal,
  stats,
  onViewCertificate,
  showViewAll = false,
  onViewAll,
  onViewDetails,
  pathsCount,
  eyebrow = 'Current Learning Path',
  hideHeader = false,
  style,
}: {
  title: string
  /** Total credit hours earned (shown in the "all N credit hours earned" line). */
  creditHoursTotal: number
  stats: CompletedStat[]
  onViewCertificate?: () => void
  showViewAll?: boolean
  onViewAll?: () => void
  /** Opens the Learning Path detail/summary panel from the "Details" link. */
  onViewDetails?: () => void
  pathsCount?: number
  eyebrow?: string
  /** Drop the internal "Current Learning Path" eyebrow + "View All (N)" row —
   *  used when an external section lead already supplies them (the Home-style
   *  overview), so the header isn't duplicated. */
  hideHeader?: boolean
  /** Extra chrome merged onto the root (e.g. the separate-card radius/shadow). */
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--color-success-700)',
        color: ON_DARK,
        padding: '24px 26px 26px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        height: '100%',
        ...style,
      }}
    >
      <CircleCheck size={190} aria-hidden style={{ position: 'absolute', right: -22, top: -30, color: 'rgb(255 255 255 / 0.08)' }} />

      {!hideHeader && (
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <p style={eyebrowStyle}>{eyebrow}</p>
          {showViewAll && onViewAll && (
            <button type="button" onClick={onViewAll} className="cre-link-action" style={{ ...linkBtn, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {`View All (${pathsCount ?? ''})`}
            </button>
          )}
        </div>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
        <span
          aria-hidden
          style={{
            flex: 'none',
            width: 62,
            height: 62,
            borderRadius: '50%',
            background: 'rgb(255 255 255 / 0.16)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Check size={34} />
        </span>
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 22,
              lineHeight: 1.16,
              color: ON_DARK,
            }}
          >
            {title}
          </h3>
          <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-body)', fontSize: 14, color: ON_DARK_MUTED }}>
            Complete — all {creditHoursTotal} credit hours earned.
          </p>
        </div>
      </div>

      {/* Stats pinned toward the bottom; the actions (View Certificates + the
          View Details link) sit below, bottom-right — the View Details link
          mirrors the V1 band + ExpiredCycleBand, its center lined up with the
          Browse Catalog CTA on the panel opposite. */}
      <div style={{ position: 'relative', marginTop: 'auto', paddingTop: 12 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px 48px' }}>
          {stats.map((s) => (
            <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: ON_DARK_MUTED,
                }}
              >
                {s.label}
              </span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 17, fontWeight: 700, color: ON_DARK }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {(onViewCertificate || onViewDetails) && (
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            // Details-only (the completed band): lift the link so its center
            // matches the 48px Browse Catalog CTA opposite. When a View
            // Certificates button is present (Learner/Marketing bands) the row
            // is already 48px tall, so no lift.
            ...(onViewCertificate ? null : { marginBottom: 15 }),
          }}
        >
          {onViewCertificate && (
            <button
              type="button"
              onClick={onViewCertificate}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 48,
                padding: '0 22px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid rgb(255 255 255 / 0.55)',
                cursor: 'pointer',
                background: 'transparent',
                color: ON_DARK,
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              View Certificates
            </button>
          )}
          {onViewDetails && (
            <button type="button" onClick={onViewDetails} style={DETAILS_LINK}>
              View Details <ChevronRight size={14} aria-hidden />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const eyebrowStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: ON_DARK,
}

const linkBtn: CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: ON_DARK,
}

// Bottom-right "View Details ›" — matches the V1 band + ExpiredCycleBand link
// (white for the green panel's legibility).
const DETAILS_LINK: CSSProperties = {
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: ON_DARK,
  whiteSpace: 'nowrap',
}
