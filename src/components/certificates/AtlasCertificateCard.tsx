import type { CSSProperties } from 'react'
import { FileCertificateRegular, MoreVertical } from '@/icons'
import type { Certificate } from '@/data/certificateFixtures'
import { ReportingStatus } from './CertificateCard'

/**
 * THE ATLAS CERTIFICATE CARD — Figma "Atlas UX Design" 375:1250 (2026-10-13,
 * Eric's request), for Eric/Atlas WIP's Certificates page. A sibling of
 * `CertificateCard`, not a variant of it: that card stays exactly as every
 * other version shows it, and this one imports its Reporting Status
 * (`ReportingStatus`) and formats dates the same way, so the two always say
 * the same thing.
 *
 *   status    a Tertiary 200 bar (20 radius, no outline — Figma 379:1374,
 *             the fourth pass): a Primary 100 "Certificate" pill with the regular
 *             file-certificate glyph on the left, the status word on the
 *             right — Figma 375:1311, the design's third pass that day
 *   heading   the title alone, in the serif heading face (Heading 4, 22 / 24)
 *   details   state | hours | requirement, then "Certificate Issued: date"
 *             and "Reporting Status: **value**", all Open Sans 12 / 17
 *   options   a 28 Tertiary 200 circle with the ⋮, 4 right of the bar
 *
 * White, 24 padding, 16 radius, no outline. The Figma frame takes its colours
 * from the XCEL skin; they are tokens here, so the card follows the Brand
 * control like the rest of the page. The design draws a Completed card;
 * the other statuses keep their own word and (action required) their alert
 * glyph in the same badge.
 */
export function AtlasCertificateCard({
  data,
  onOpen,
  onOptions,
  inProgress = false,
  style,
  barColor,
}: {
  data: Certificate
  /** A certificate not yet earned — the course is still under way (Eric/Atlas
   *  WIP's Life & Health, 2026-10-13): the bar reads IN-PROGRESS with no
   *  Certificate pill, and the issued and reporting lines are hidden. */
  inProgress?: boolean
  /** Merged over the card (Eric/Atlas White's outline, 2026-10-14). */
  style?: CSSProperties
  /** The status bar's fill, in place of tan 300 (Eric/Atlas WIP's Secondary
   *  200, 2026-10-14). */
  barColor?: string
  /** Open the action-required detail slide-over. */
  onOpen?: (id: string) => void
  /** Kebab (⋮) menu click — falls back to a console stub. */
  onOptions?: (id: string) => void
}) {
  const isAction = data.status === 'action-required'
  const clickable = isAction && onOpen != null
  const open = () => onOpen?.(data.id)
  const status = inProgress
    ? 'In-Progress'
    : isAction
      ? 'Action required'
      : data.status === 'external'
        ? 'External'
        : 'Completed'

  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `View details for ${data.title}` : undefined}
      onClick={clickable ? open : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                open()
              }
            }
          : undefined
      }
      style={{ ...CARD, ...style, cursor: clickable ? 'pointer' : 'default' }}
    >
      {/* The status bar across the top (Figma 379:1368): the Certificate pill
          left, the status word right. */}
      <div style={TOP_ROW}>
        <div style={barColor ? { ...STATUS_BAR, background: barColor } : STATUS_BAR}>
          {inProgress ? null : (
            <span style={PILL}>
              <span aria-hidden style={{ display: 'inline-flex', justifyContent: 'center', width: 14 }}>
                <FileCertificateRegular size={13} aria-hidden />
              </span>
              Certificate
            </span>
          )}
          <span style={STATUS}>{status}</span>
        </div>
        {/* The ⋮, beside the bar (Figma 379:1369; it sat in the bottom-right
            corner until the design's fourth pass). Stops propagation so it
            never also opens a clickable card. */}
        <button
          type="button"
          aria-label={`Options for ${data.title}`}
          style={KEBAB}
          onClick={(e) => {
            e.stopPropagation()
            if (onOptions) onOptions(data.id)
            else console.info('certificate:options', data.id)
          }}
        >
          <MoreVertical size={14} aria-hidden />
        </button>
      </div>
      <h3 style={TITLE}>{data.title}</h3>

      <div style={DETAILS}>
        <div style={REQUIREMENTS}>
          <span>{data.state}</span>
          <span aria-hidden style={SEPARATOR} />
          <span>
            {data.hours} {data.hours === 1 ? 'Hour' : 'Hours'}
          </span>
          <span aria-hidden style={SEPARATOR} />
          <span>{data.badge}</span>
        </div>
        {inProgress ? null : (
        <div style={DETAIL}>
          <span>{isAction ? 'Course Completed:' : 'Certificate Issued:'}</span>
          <span>{formatDate(data.completedDate)}</span>
        </div>
        )}
        {data.reporting && !inProgress ? (
          <div style={DETAIL}>
            <span>Reporting Status:</span>
            <span style={{ fontWeight: 700 }}>
              <ReportingStatus reporting={data.reporting} />
            </span>
          </div>
        ) : null}
      </div>

    </div>
  )
}

/** `2026-04-10` → `4/10/2026`, as `CertificateCard` writes it. */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${m}/${d}/${y}`
}

const CARD: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 24,
  boxSizing: 'border-box',
  borderRadius: 16,
  // White, on WIP (2026-10-14, Eric's request) — slate 100, tan 200 and
  // tan 100 were each tried that day. White's own fill and outline come in
  // through `style` (PlatformShell).
  background: 'var(--color-fixed-light)',
  overflow: 'hidden',
}
/* Figma 379:1374 — the bar and the ⋮ beside it, 4 apart. */
const TOP_ROW: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 4 }
/* Figma 379:1368 — the bar, its pill and the status word. */
const STATUS_BAR: CSSProperties = {
  flex: '1 1 0',
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  // The pill's 28, held without it (an in-progress card).
  minHeight: 28,
  boxSizing: 'border-box',
  borderRadius: 20,
  // Tertiary 300 (Figma 411:1382, 2026-10-14) — it was 200.
  background: 'var(--color-atlas-tan-300)',
}
const PILL: CSSProperties = {
  flex: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 14px',
  borderRadius: 20,
  border: '1px solid var(--color-primary-200)',
  background: 'var(--color-primary-100)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  letterSpacing: '-0.065px',
  color: 'var(--color-primary-600)',
  whiteSpace: 'nowrap',
}
const STATUS: CSSProperties = {
  flex: '1 1 0',
  minWidth: 0,
  textAlign: 'right',
  padding: '4px 12px 4px 0',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '14px',
  // Medium, sentence case, no tracking (Figma 411:1382, 2026-10-14) — it
  // was Regular capitals at 0.94px.
  fontWeight: 500,
  color: 'var(--color-compass-page-heading)',
  whiteSpace: 'nowrap',
}
/* Heading 4 — the serif face at the Atlas H8 step (22 / 24 under Playfair 2). */
const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 700,
  fontSize: 'var(--type-atlas-h8-base-size, 22px)',
  lineHeight: 'var(--type-atlas-h8-base-line, 24px)',
  letterSpacing: '-0.2px',
  color: 'var(--color-text-primary)',
}
const DETAILS: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 7 }
const TEXT: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '17px',
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
}
const REQUIREMENTS: CSSProperties = { ...TEXT, display: 'flex', alignItems: 'center', gap: 8 }
const DETAIL: CSSProperties = { ...TEXT, display: 'flex', alignItems: 'center', gap: 2 }
/* Figma's #D1D1D1 hairline — the shared card's separator token. */
const SEPARATOR: CSSProperties = { width: 1, height: 12, flex: 'none', background: 'var(--color-border-subtle)' }
/* Figma 379:1369 — a 28 circle in Tertiary 200, the ⋮ in the text colour. */
const KEBAB: CSSProperties = {
  flex: 'none',
  width: 28,
  height: 28,
  borderRadius: 20,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--color-atlas-tan-200)',
  color: 'var(--color-text-primary)',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
}
