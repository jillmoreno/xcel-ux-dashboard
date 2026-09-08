import type { CSSProperties, ReactNode } from 'react'
import { CircleCheck, GraduationCap, Search } from '@/icons'

/**
 * The Jump Back In "nothing to resume or launch" empty state — encourages the
 * learner to browse the Course Catalog. Shared by the full-width bands
 * (ClpJumpBackInBand) and the default-layout tile (OverviewJumpBackIn) so the
 * copy + treatment stay in one place. `completed` (all caught up) vs `new` (get
 * started) tone; `onBrowseCatalog` opens the in-shell catalog rail section.
 */
export const DISCOVERY_COPY: Record<'completed' | 'new', { heading: string; body: string }> = {
  completed: {
    heading: "You're all caught up!",
    body: 'Requirements complete—great job! Keep the momentum going by exploring topics that interest you.',
  },
  new: {
    heading: 'Add your first course',
    body: 'Your learning path is set up—now let’s fill it in. Browse the catalog and enroll, and we’ll track your progress toward your requirements automatically.',
  },
}

/**
 * Benefit rows for the `card` variant (mirrors the Study Calendar
 * "A Study Plan Designed for You" widget's feature list). Each glyph
 * sits in an action-tinted rounded medallion; the value prop from
 * `DISCOVERY_COPY[...].body` is expressed as three scannable rows.
 */
const DISCOVERY_FEATURES: Record<'completed' | 'new', { icon: ReactNode; label: string }[]> = {
  new: [
    { icon: <Search size={18} aria-hidden />, label: 'Browse the full course catalog' },
    { icon: <GraduationCap size={18} aria-hidden />, label: 'Enroll in courses for your requirements' },
    { icon: <CircleCheck size={18} aria-hidden />, label: 'Automatic progress tracking' },
  ],
  completed: [
    { icon: <CircleCheck size={18} aria-hidden />, label: 'Requirements complete — nice work' },
    { icon: <Search size={18} aria-hidden />, label: 'Explore topics that interest you' },
    { icon: <GraduationCap size={18} aria-hidden />, label: 'Keep earning toward your next goal' },
  ],
}

export function DiscoveryEmpty({
  tone,
  onBrowseCatalog,
  onViewCertificate,
  padding,
  compact = false,
  align = 'center',
  card = false,
  firstName,
}: {
  tone: 'completed' | 'new'
  /** When set (completed tone), personalize the heading — "You're all caught
   *  up, Sarah!". HOME tile only; other callers omit it for the generic copy. */
  firstName?: string
  onBrowseCatalog?: () => void
  /** When set (completed state), renders a secondary "View Certificate" button
   *  below Browse Catalog that opens the Certificates page. */
  onViewCertificate?: () => void
  padding?: string
  compact?: boolean
  /** Vertical packing within the (full-height) panel. `center` (default)
   *  centers the block; `end` bottom-aligns it so the CTA lines up with a CTA
   *  pinned to the bottom of an adjacent half (the completed band's View
   *  Certificate). */
  align?: 'center' | 'end'
  /** Opt-in: render as a bordered "feature card" mirroring the Study Calendar
   *  "A Study Plan Designed for You" widget — navy title, three tinted-icon
   *  benefit rows, and a full-width Browse Catalog button. The default
   *  (unset) keeps the plain centered/compact block used inside the bands. */
  card?: boolean
}) {
  const copy = DISCOVERY_COPY[tone]
  // Personalized completed greeting (HOME tile) — "You're all caught up, Sarah!".
  const heading =
    tone === 'completed' && firstName?.trim() ? `You're all caught up, ${firstName.trim()}!` : copy.heading

  if (card) {
    return (
      <DiscoveryEmptyCard
        tone={tone}
        onBrowseCatalog={onBrowseCatalog}
        onViewCertificate={onViewCertificate}
        heading={heading}
      />
    )
  }

  return (
    <div
      style={{
        padding: padding ?? 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: compact ? 'flex-start' : 'center',
        justifyContent: align === 'end' ? 'flex-end' : 'center',
        textAlign: compact ? 'left' : 'center',
        gap: 10,
        height: '100%',
      }}
    >
      <h3
        style={{
          margin: 0,
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: compact ? 18 : 22,
          lineHeight: 1.18,
          color: 'var(--color-text-primary)',
        }}
      >
        {heading}
      </h3>
      <p
        style={{
          margin: 0,
          maxWidth: 420,
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          lineHeight: 1.5,
          color: 'var(--color-text-secondary)',
        }}
      >
        {copy.body}
      </p>
      {/* Row: Browse Catalog (main CTA) on the LEFT, View Certificates
          (secondary) on the RIGHT. When there's no cert button, Browse Catalog
          stands alone. Wraps if the panel is too narrow. */}
      <div
        style={{
          marginTop: 6,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
          justifyContent: compact ? 'flex-start' : 'center',
        }}
      >
        <button
          type="button"
          onClick={() => (onBrowseCatalog ? onBrowseCatalog() : console.info('cta:browse-catalog'))}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 48,
            padding: '0 16px',
            borderRadius: 'var(--radius-md)',
            border: 0,
            cursor: 'pointer',
            background: 'var(--color-cta-500)',
            color: 'rgb(255 255 255 / 1)',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 16,
            whiteSpace: 'nowrap',
          }}
        >
          Browse Catalog
        </button>
        {onViewCertificate && (
          <button
            type="button"
            onClick={onViewCertificate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 48,
              padding: '0 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-cta-500)',
              cursor: 'pointer',
              background: 'var(--color-surface-card)',
              color: 'var(--color-cta-500)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: 16,
              whiteSpace: 'nowrap',
            }}
          >
            View Certificates
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Card variant ───────────────────────────────────────────────────
 * Mirrors the Study Calendar "A Study Plan Designed for You" feature
 * card (AddCalendarEmptyState): bordered white surface, navy title,
 * tinted-icon benefit rows, and a full-width primary CTA. Colors resolve
 * per active brand via tokens.
 */
function DiscoveryEmptyCard({
  tone,
  onBrowseCatalog,
  onViewCertificate,
  heading,
}: {
  tone: 'completed' | 'new'
  onBrowseCatalog?: () => void
  onViewCertificate?: () => void
  /** Personalized heading (falls back to the tone's default copy). */
  heading?: string
}) {
  const copy = DISCOVERY_COPY[tone]
  const features = DISCOVERY_FEATURES[tone]
  return (
    <aside style={cardStyle}>
      <h3 style={cardTitleStyle}>{heading ?? copy.heading}</h3>
      <ul style={cardFeatureListStyle}>
        {features.map((f) => (
          <li key={f.label} style={cardFeatureRowStyle}>
            <span aria-hidden style={cardFeatureIconStyle}>
              {f.icon}
            </span>
            <span style={cardFeatureLabelStyle}>{f.label}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => (onBrowseCatalog ? onBrowseCatalog() : console.info('cta:browse-catalog'))}
        style={cardCtaStyle}
      >
        Browse Catalog
      </button>
      {onViewCertificate && (
        <button type="button" onClick={onViewCertificate} style={cardSecondaryCtaStyle}>
          View Certificates
        </button>
      )}
    </aside>
  )
}

const cardStyle: CSSProperties = {
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 12,
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const cardTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 18,
  lineHeight: '22px',
  color: 'var(--color-primary-500)',
}

const cardFeatureListStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const cardFeatureRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

// Action-tinted rounded medallion (matches the Study Plan widget's
// feature glyphs + the Passport ProductIcon treatment).
const cardFeatureIconStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 34,
  height: 34,
  flexShrink: 0,
  borderRadius: 'var(--radius-md)',
  background: 'color-mix(in srgb, var(--color-action) 12%, white)',
  color: 'var(--color-action)',
}

const cardFeatureLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}

const cardCtaStyle: CSSProperties = {
  marginTop: 4,
  width: '100%',
  height: 48,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'var(--radius-md)',
  border: 0,
  cursor: 'pointer',
  background: 'var(--color-cta-500)',
  color: 'rgb(255 255 255 / 1)',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 16,
  lineHeight: '20px',
}

const cardSecondaryCtaStyle: CSSProperties = {
  width: '100%',
  height: 48,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-cta-500)',
  cursor: 'pointer',
  background: 'var(--color-surface-card)',
  color: 'var(--color-cta-500)',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 16,
}
