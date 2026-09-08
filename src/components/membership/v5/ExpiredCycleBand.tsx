import { type CSSProperties, type ReactNode } from 'react'
import { CalendarDay, CalendarExclamation, ChevronRight } from '@/icons'
import { useDeviceFrame } from '@/components/layout/DeviceFrameContext'
import type { LearningPathSummary } from '@/data/learningFixtures'

/**
 * ExpiredCycleBand — the Current Learning Path band for an EXPIRED renewal cycle
 * (the `progress-expired` persona / `HomeStatus === 'expired'`). Mirrors the
 * shipped Completed (`renewalReady`) card's split structure — a full-color left
 * panel joined to a white action panel — but in a charcoal key that reads as
 * "lapsed / inactive," with a soft-red date badge as the sole red accent.
 *
 * Approved design: explorations/learning-path-expired/expired-color.html
 * (finalized "Option A"). Full-bleed-capable; stacks on tablet + mobile.
 *
 * Charcoal note: the left panel's charcoal is intentionally FIXED (not a neutral
 * token). The rebrand dark theme inverts the neutral ramp (neutral-800 → light),
 * which would flip a token-driven charcoal band to a light band — the same
 * reason tokens.css re-pins the prototype bar. The right action panel keeps
 * surface/text TOKENS so it adapts to dark mode exactly like the Completed
 * card's white panel. The date badge uses the functional `error` ramp (stable
 * across themes).
 */
type Props = {
  path: LearningPathSummary
  /** Demo renewal override (persona): the expiry deadline (mm/dd/yyyy). */
  renewal?: { deadline: string; weeksLeft: number }
  /** Personalize the lede with the learner's first name ("…has ended, Sarah.").
   *  HOME tile only; omitted elsewhere for the generic copy. */
  firstName?: string
  /** Full-bleed hero treatment (`dashboard-hero-bleed`). */
  bleed?: boolean
  /** Begin a fresh renewal cycle (stubbed by the caller). */
  onBeginNewCycle?: () => void
  /** Opens the Learning Path detail/summary panel from the "Details" link. */
  onViewDetails?: () => void
}

/* Theme-stable warm charcoal (see the "Charcoal note" above). */
const CHARCOAL = 'linear-gradient(160deg, #454545, #232323)'

const HERO_BLEED: CSSProperties = {
  marginTop: -24,
  marginLeft: -40,
  marginRight: 'calc(-40px - max(0px, (100vw - 1440px)))',
  borderRadius: 0,
  boxShadow: 'none',
}

export function ExpiredCycleBand({
  path,
  renewal,
  firstName,
  bleed = false,
  onBeginNewCycle,
  onViewDetails,
}: Props) {
  const device = useDeviceFrame().device
  const mobile = device === 'mobile'
  const stack = mobile || device === 'tablet'

  const mandatory = path.mandatory ?? { completed: 0, required: 0 }
  const elective = path.elective ?? { completed: 0, required: 0 }
  const totalRequired = mandatory.required + elective.required || path.hours
  const totalCompleted = mandatory.completed + elective.completed
  const mandatoryLabel = path.mandatoryLabel ?? 'Mandatory'
  const electiveLabel = path.electiveLabel ?? 'Elective'
  const deadline = renewal?.deadline ?? path.licenseExpiresOn ?? '—'

  const cardChrome: CSSProperties = mobile
    ? { marginLeft: -16, marginRight: -16, borderRadius: 0 }
    : bleed
      ? HERO_BLEED
      : {
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 18px 40px -18px color-mix(in srgb, var(--color-neutral-900) 55%, transparent)',
        }

  return (
    <section
      aria-label="Learning path expired"
      className="cre-clp-jbi-band"
      style={{
        display: 'grid',
        gridTemplateColumns: stack ? 'minmax(0, 1fr)' : 'minmax(0, 560fr) minmax(0, 420fr)',
        overflow: 'hidden',
        ...cardChrome,
      }}
    >
      {/* ── left · charcoal message + stat row (Details pinned bottom-right) ── */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: CHARCOAL,
          color: 'rgb(255 255 255 / 1)',
          padding: stack ? '26px 24px' : '30px 32px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CalendarExclamation
          size={184}
          aria-hidden
          style={{ position: 'absolute', right: -12, top: -20, color: 'rgb(255 255 255 / 0.07)' }}
        />
        <div style={{ position: 'relative' }}>
          <span style={BADGE}>
            <CalendarDay size={15} aria-hidden />
            Expired: {deadline}
          </span>
          <h2 style={TITLE}>{path.title}</h2>
          <p style={LEDE}>Your renewal cycle has ended{firstName?.trim() ? `, ${firstName.trim()}` : ''}.</p>
        </div>
        {/* Stats pinned toward the bottom; the View Details link sits below,
            bottom-right, aligned with the Begin New Cycle CTA opposite. */}
        <div style={{ position: 'relative', marginTop: 'auto', paddingTop: 18 }}>
          <div style={STATS}>
            <Stat k="Expired on" v={deadline} />
            <Stat k="Progress at expiry" v={`${totalCompleted} / ${totalRequired} hrs`} />
            <Stat k={mandatoryLabel} v={`${mandatory.completed} / ${mandatory.required}`} />
            <Stat k={electiveLabel} v={`${elective.completed} / ${elective.required}`} />
          </div>
        </div>
        {onViewDetails && (
          <button type="button" style={DETAILS_LINK} onClick={onViewDetails}>
            View Details <ChevronRight size={14} aria-hidden />
          </button>
        )}
      </div>

      {/* ── right · white action panel ── */}
      <div style={ACTION_PANEL}>
        <p style={EYEBROW}>What&apos;s next</p>
        <h3 style={ACTION_TITLE}>Start your new renewal cycle</h3>
        <p style={ACTION_BODY}>
          Your completed and in-progress courses stay in My Courses. Start a fresh cycle to keep going.
        </p>
        {/* Single full-width primary CTA — bottom-pinned so it lines up with the
            View Details link on the charcoal card opposite. */}
        <div style={{ marginTop: 'auto', paddingTop: 8 }}>
          <button
            type="button"
            style={PRIMARY_CTA}
            onClick={() => (onBeginNewCycle ? onBeginNewCycle() : console.info('cta:begin-new-cycle'))}
          >
            Begin New Cycle
          </button>
        </div>
      </div>
    </section>
  )
}

function Stat({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgb(255 255 255 / 0.6)', whiteSpace: 'nowrap' }}>
        {k}
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 700, marginTop: 3, whiteSpace: 'nowrap' }}>{v}</div>
    </div>
  )
}

/* ── styles ── */
const BADGE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  padding: '7px 13px',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-error-100)',
  color: 'var(--color-error-700)',
}
const TITLE: CSSProperties = {
  margin: '14px 0 6px',
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 23,
  lineHeight: 1.16,
  color: 'var(--color-text-inverse)',
}
const LEDE: CSSProperties = {
  margin: '0 0 20px',
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  lineHeight: 1.5,
  color: 'rgb(255 255 255 / 0.82)',
  maxWidth: '52ch',
}
const STATS: CSSProperties = { display: 'flex', gap: 24, flexWrap: 'wrap' }
// Bottom-right "View Details ›" — the same slot as the V1 band (bottom of the
// left column, its center lined up with the primary CTA opposite). `marginBottom`
// lifts it ~9px so its center matches the 48px Begin New Cycle button (accounting
// for the charcoal card's deeper bottom padding). White for charcoal legibility.
const DETAILS_LINK: CSSProperties = {
  alignSelf: 'flex-end',
  marginTop: 12,
  marginBottom: 9,
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
  color: 'rgb(255 255 255 / 0.92)',
  whiteSpace: 'nowrap',
}

const ACTION_PANEL: CSSProperties = {
  background: 'var(--color-surface-card)',
  padding: '24px 26px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  gap: 10,
}
const EYEBROW: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}
const ACTION_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}
const ACTION_BODY: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: 1.55,
  color: 'var(--color-text-secondary)',
  maxWidth: '36ch',
}
const CTA_BASE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 48,
  padding: '0 22px',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 16,
  width: '100%',
}
const PRIMARY_CTA: CSSProperties = {
  ...CTA_BASE,
  border: 0,
  background: 'var(--color-cta-500)',
  color: 'rgb(255 255 255 / 1)',
}
