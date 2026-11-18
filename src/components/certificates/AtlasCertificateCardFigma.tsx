import { Fragment, type CSSProperties, type ReactNode } from 'react'
import { AngleRightRegular, CircleCheckRegular, CircleExclamation, ClipboardListRegular, FileCertificateRegular, GaugeRegular } from '@/icons'
import type { Certificate } from '@/data/certificateFixtures'
import { ReportingStatus } from './CertificateCard'

/**
 * THE ATLAS CERTIFICATE CARD, FIGMA 737:1477 — 2026-11-18, Eric: "rework the certificates and transcripts cards to match
 * the attached Figma file".
 *
 * A sibling of `AtlasCertificateCard` (375:1250), which is kept as it was and still draws the phone's cards (its in-card
 * expansion is the phone's kebab). One full-width row per certificate:
 *
 *   header    a 28 band between two Secondary 200 hairlines: the status badge (Success 100, circle-check, SemiBold 11)
 *             · "Progress: 100%" · "Certificate Issued: date" · "Reporting Status: value", Open Sans 12 / 17, 1px
 *             Secondary 200 separators between
 *   title     the heading serif, Bold 22 / 24
 *   facts     Category · Line of authority · hours · Mandatory/Elective, 11 / 13 secondary grey; then, at the right,
 *             "View Certificate ›" and "View Transcript ›" — Bold 11 Primary 500 text links with their Regular icons
 *
 * Secondary 100 fill, a 1px Secondary 200 outline, 24 in, 16 corners. Category is read off the record's profession
 * (Pre-Licensing → Licensing); Line of authority is the record's `lineOfAuthority`, and a fact with nothing to say is not
 * drawn. View Certificate opens the Certificate Details sheet, as clicking the card does; View Transcript opens the
 * transcripts page.
 */
export function AtlasCertificateCardFigma({
  data,
  onOpen,
  onTranscript,
  inProgress = false,
  openAnyStatus = false,
}: {
  data: Certificate
  /** Open the Certificate Details slide-over. */
  onOpen?: (id: string) => void
  /** View Transcript — the transcripts page. */
  onTranscript?: () => void
  /** Not yet earned (Eric's versions' Life & Health): an In Progress badge, no issued or reporting lines. */
  inProgress?: boolean
  /** Every card opens, not only an action-required one — `AtlasCertificateCard`'s rule, unchanged. */
  openAnyStatus?: boolean
}) {
  const isAction = data.status === 'action-required'
  const clickable = (isAction || openAnyStatus) && onOpen != null
  const open = () => onOpen?.(data.id)
  const badge = inProgress ? BADGES.progress : isAction ? BADGES.action : data.status === 'external' ? BADGES.external : BADGES.completed
  const BadgeIcon = badge.Icon

  const head: ReactNode[] = []
  if (!inProgress) head.push(
    <span key="progress" style={{ ...HEAD_TEXT, flex: 'none' }}>
      <strong style={{ fontWeight: 700 }}>Progress:</strong> 100%
    </span>,
  )
  if (!inProgress) head.push(
    <span key="issued" style={{ ...HEAD_TEXT, flex: '1 1 0', minWidth: 0 }}>
      {isAction ? 'Course Completed:' : 'Certificate Issued:'} <strong style={{ fontWeight: 700 }}>{formatDate(data.completedDate)}</strong>
    </span>,
  )
  if (data.reporting && !inProgress) head.push(
    <span key="reporting" style={{ ...HEAD_TEXT, flex: 'none' }}>
      Reporting Status:{' '}
      <strong style={{ fontWeight: 700 }}>
        <ReportingStatus reporting={data.reporting} />
      </strong>
    </span>,
  )

  const facts: ReactNode[] = [
    <span key="category">
      Category: <strong style={{ fontWeight: 700 }}>{categoryFor(data.profession)}</strong>
    </span>,
  ]
  if (data.lineOfAuthority) facts.push(
    <span key="loa">
      Line of authority: <strong style={{ fontWeight: 700 }}>{data.lineOfAuthority}</strong>
    </span>,
  )
  facts.push(<span key="hours">{data.hours} {data.hours === 1 ? 'Hour' : 'Hours'}</span>)
  facts.push(<span key="badge">{data.badge}</span>)

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `View details for ${data.title}` : undefined}
      onClick={clickable ? open : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                open()
              }
            }
          : undefined
      }
      style={{ ...CARD, cursor: clickable ? 'pointer' : 'default' }}
    >
      <div style={HEADER}>
        <span style={{ ...BADGE, background: badge.fill }}>
          <span aria-hidden style={{ display: 'inline-flex', justifyContent: 'center', width: 14 }}>
            <BadgeIcon size={13} aria-hidden />
          </span>
          {badge.label}
        </span>
        <div style={HEAD_RIGHT}>
          {head.map((node, i) => (
            <Fragment key={i}>
              {i > 0 ? <span aria-hidden style={HEAD_RULE} /> : null}
              {node}
            </Fragment>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={TITLE}>{data.title}</h3>
        <div style={FACTS_ROW}>
          {facts.map((node, i) => (
            <Fragment key={i}>
              {i > 0 ? <span aria-hidden style={FACT_RULE} /> : null}
              {node}
            </Fragment>
          ))}
          <div style={LINKS}>
            <button
              type="button"
              className="cre-atlas-card-review"
              style={LINK}
              disabled={!onOpen}
              onClick={(e) => {
                e.stopPropagation()
                open()
              }}
            >
              <FileCertificateRegular size={13} aria-hidden />
              View Certificate
              <AngleRightRegular size={13} aria-hidden style={{ width: 5 }} />
            </button>
            <span aria-hidden style={{ ...FACT_RULE, height: 16 }} />
            <button
              type="button"
              className="cre-atlas-card-review"
              style={LINK}
              disabled={!onTranscript}
              onClick={(e) => {
                e.stopPropagation()
                onTranscript?.()
              }}
            >
              <ClipboardListRegular size={13} aria-hidden style={{ width: 10 }} />
              View Transcript
              <AngleRightRegular size={13} aria-hidden style={{ width: 5 }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/** "Insurance Pre-Licensing" → "Licensing", "Insurance Continuing Education" → "Continuing Education" — the My Courses
 *  cards' words. Anything else is shown as the record has it. */
function categoryFor(profession: string): string {
  if (/pre-?licens/i.test(profession)) return 'Licensing'
  if (/continuing education/i.test(profession)) return 'Continuing Education'
  return profession
}

/** `2026-04-10` → `4/10/2026`, as `CertificateCard` writes it. */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${m}/${d}/${y}`
}

/* The design draws Completed; the other three keep their own word and glyph on the matching functional 100. */
const BADGES = {
  completed: { label: 'Completed', fill: 'var(--color-success-100)', Icon: CircleCheckRegular },
  external: { label: 'External', fill: 'var(--color-success-100)', Icon: CircleCheckRegular },
  progress: { label: 'In Progress', fill: 'var(--color-info-100)', Icon: GaugeRegular },
  action: { label: 'Action Required', fill: 'var(--color-warning-100)', Icon: CircleExclamation },
}

const CARD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 24,
  boxSizing: 'border-box',
  borderRadius: 16,
  border: '1px solid var(--color-secondary-200)',
  background: 'var(--color-secondary-100)',
  overflow: 'hidden',
  minWidth: 0,
}
/* Figma 740:1569 — the band: hairlines above and below, rounded on the left round the badge. */
const HEADER: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  height: 28,
  borderTop: '1px solid var(--color-secondary-200)',
  borderBottom: '1px solid var(--color-secondary-200)',
  borderTopLeftRadius: 20,
  borderBottomLeftRadius: 20,
}
const BADGE: CSSProperties = {
  flex: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  height: 28,
  boxSizing: 'border-box',
  padding: '0 12px',
  borderRadius: 20,
  color: 'var(--color-text-primary)',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 11,
  lineHeight: '14px',
  whiteSpace: 'nowrap',
}
const HEAD_RIGHT: CSSProperties = { flex: '1 1 0', minWidth: 0, height: '100%', display: 'flex', alignItems: 'center', gap: 12 }
const HEAD_TEXT: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '17px',
  color: 'var(--color-text-primary)',
  textAlign: 'right',
  whiteSpace: 'nowrap',
}
/* A full-height separator, 5 in from the band's edges. */
const HEAD_RULE: CSSProperties = { flex: 'none', alignSelf: 'stretch', margin: '5px 0', width: 1, borderRadius: 1, background: 'var(--color-secondary-200)' }
/* Playfair Bold 22 / 24 (Figma 737:1525). */
const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 700,
  fontSize: 22,
  lineHeight: '24px',
  letterSpacing: '-0.66px',
  color: 'var(--color-text-primary)',
}
const FACTS_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 16,
  flexWrap: 'wrap',
  rowGap: 10,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '13px',
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
}
const FACT_RULE: CSSProperties = { flex: 'none', width: 1, height: 13, borderRadius: 1, background: 'var(--color-secondary-200)' }
/* Pushed right, never squeezed — on a row too narrow for both, the links wrap under the facts, still at the right. */
const LINKS: CSSProperties = { flex: 'none', marginLeft: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14 }
/* Bold 11 / 14, Primary 500 (the design's "tertiary" #2D5872), 5 between icon, label and angle. */
const LINK: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: 0,
  border: 'none',
  background: 'none',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 11,
  lineHeight: '14px',
  color: 'var(--color-primary-500)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
}
