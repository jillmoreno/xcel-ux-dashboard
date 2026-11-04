import type { CSSProperties, ReactNode } from 'react'
import { ArrowLeft, CircleCheck, CircleExclamation, FileCertificateRegular, HourglassClock, PersonRunning } from '@/icons'
import { Sheet } from '@/components/ui/Sheet'
import { CERT_ACTION_META, certificatePdfUrl, type Certificate } from '@/data/certificateFixtures'
import { ReportingStatus } from './CertificateCard'
import { COMPASS_BUTTON } from '@/components/compass/compassButton'

/**
 * CERTIFICATE DETAILS slide-over. From the 2.0 Certificates designs.
 *
 * THREE ARMS, and it had exactly one until 2026-11-02:
 *
 *   action required  the original. One component covers all five action
 *                    variants (Survey / Affidavit / Proctored Exam / Document /
 *                    Payment) — the banner reason, pending label and optional
 *                    explanation paragraph come from `CERT_ACTION_META`.
 *                    Affidavit is the only variant with an explanation block.
 *                    UNCHANGED: every line it drew, it still draws.
 *
 *   issued           a certificate the learner has earned — the common case,
 *                    and the one that had no arm at all. The body keyed off
 *                    `CERT_ACTION_META[data.action]`, which an issued record
 *                    has no `action` for, so the whole sheet rendered EMPTY
 *                    under an "Action Required" banner. That is why no card
 *                    anywhere opened one: `CertificateCard` and
 *                    `AtlasCertificateCard` both gated `clickable` on
 *                    action-required, which hid the hole rather than fixing it.
 *
 *   in progress      the certificate for a course still under way (the Atlas
 *                    page's Life & Health card). Nothing has been issued, so
 *                    there is no document and no reporting line — the sheet
 *                    says what is outstanding and offers the course.
 *
 * ⚠ `inProgress` IS THE HOST'S WORD, NOT THE RECORD'S. A not-yet-earned
 * certificate is still `status: 'completed'` in the fixtures — Atlas draws it
 * as in-progress from `inProgressIds`, a presentational decision — so the panel
 * cannot read it off `data` and has to be told. If that ever becomes a real
 * record state, this prop is what collapses into it.
 */
export function CertificateActionPanel({
  open,
  onClose,
  data,
  inProgress = false,
  inline = false,
}: {
  open: boolean
  onClose: () => void
  data: Certificate | null
  /** Draw the not-yet-earned arm — see the warning above. */
  inProgress?: boolean
  /**
   * INSIDE THE CARD, NOT A SHEET (2026-11-04, Eric's request, for the phone):
   * the same banner, facts and actions, drawn where the card puts them — no
   * Sheet, no Back, no heading, and none of the title / profession / state row
   * the card above already shows.
   */
  inline?: boolean
}) {
  const meta = data?.action ? CERT_ACTION_META[data.action] : null
  const reason = meta && data ? meta.bannerReason.replaceAll('{state}', data.state) : ''
  const explanation = meta?.explanation && data ? meta.explanation.replaceAll('{state}', data.state) : null
  /* An ISSUED certificate: not pending an action, and not still being earned.
     Derived rather than passed, so the three arms cannot all be true at once. */
  const issued = data != null && meta == null && !inProgress
  /* ⚠ A PLACEHOLDER ROUTE, and deliberately the only one. `certificatePdfUrl`
     returns the My Certificates list rather than a document — the real
     certificate is "most likely a PDF viewer plugin, not an in-app page" (the
     Atlas Home course-head handoff says so on its own View Certificate CTA).
     Going through the helper keeps every door in the product on one placeholder
     to replace, instead of this panel inventing a second. */
  const pdfUrl = issued ? certificatePdfUrl(data) : null
  /* In the card the banner's icon box sits on its first line's top, not the
     middle of a two-line message (2026-11-04, Eric's request). */
  const top = (st: CSSProperties): CSSProperties => (inline ? { ...st, alignItems: 'flex-start' } : st)

  return (
    <SheetOrInline inline={inline} open={open && data != null} onClose={onClose}>
      {data && (
        <div style={inline ? inlineStyle : scrollStyle}>
          {inline ? null : (
            <>
          <button type="button" onClick={onClose} className="cre-link-action" style={backStyle}>
            <ArrowLeft size={16} aria-hidden />
            Back
          </button>
          <h2 style={headingStyle}>Certificate Details</h2>
            </>
          )}

          {/* THE BANNER — one per arm, same shape, three ramps. */}
          {meta ? (
            <div style={top(bannerStyle)}>
              <span aria-hidden style={bannerIconStyle}>
                <CircleExclamation size={20} aria-hidden />
              </span>
              <div>
                <p style={bannerTitleStyle}>Action Required</p>
                <p style={bannerReasonStyle}>{reason}</p>
              </div>
            </div>
          ) : inProgress ? (
            <div style={top(pendingBannerStyle)}>
              <span aria-hidden style={pendingBannerIconStyle}>
                <HourglassClock size={20} aria-hidden />
              </span>
              <div>
                <p style={pendingBannerTitleStyle}>Not Yet Earned</p>
                <p style={pendingBannerReasonStyle}>
                  This certificate is issued when you finish the course.
                </p>
              </div>
            </div>
          ) : (
            <div style={top(issuedBannerStyle)}>
              <span aria-hidden style={issuedBannerIconStyle}>
                <CircleCheck size={20} aria-hidden />
              </span>
              <div>
                <p style={issuedBannerTitleStyle}>Certificate Issued</p>
                <p style={issuedBannerReasonStyle}>
                  {data.state} &middot; {data.hours} {data.hours === 1 ? 'hour' : 'hours'} &middot; {data.badge}
                </p>
              </div>
            </div>
          )}

          {/* In the card the facts sit 8 nearer the banner (2026-11-04,
              Eric's request) — 8, from the column's 16. */}
          <div style={inline ? { ...bodyStyle, marginTop: -8 } : bodyStyle}>
            {inline ? null : (
            <>
            <h3 style={titleStyle}>{data.title}</h3>
            <span style={professionStyle}>{data.profession}</span>
            <div style={metaRowStyle}>
              <span>{data.state}</span>
              <Divider />
              <span>
                {data.hours} {data.hours === 1 ? 'Hour' : 'Hours'}
              </span>
              <Divider />
              <span>{data.badge}</span>
            </div>
            </>
            )}

            <dl style={factsStyle}>
              <Fact label="Enrolled:" value={formatDate(data.enrolledDate)} />
              {/* An in-progress course has not been completed, so the date
                  would be a claim the card itself does not make. */}
              {inProgress ? null : issued ? (
                /* ⚠ ONE DATE UNDER THE CARD'S OWN LABEL. `Certificate` has no
                   separate issued date — `completedDate` is both — and the
                   Atlas card already prints it as "Certificate Issued". Saying
                   "Course Completed" here would show a reviewer the same date
                   under two names and read as a bug. Logged on the dev handoff
                   as a real gap for engineering, not papered over with an
                   invented second date. */
                <Fact label="Certificate Issued:" value={formatDate(data.completedDate)} />
              ) : (
                <Fact label="Course Completed:" value={formatDate(data.completedDate)} />
              )}
            </dl>

            {meta ? (
              explanation ? (
                <div style={explanationBoxStyle}>
                  <p style={pendingBoldStyle}>Certificate Pending: {meta.pendingLabel}</p>
                  <p style={explanationTextStyle}>{explanation}</p>
                </div>
              ) : (
                <p style={pendingBoldStyle}>Certificate Pending: {meta.pendingLabel}</p>
              )
            ) : null}

            {/* The card's own Reporting Status line, through the card's own
                component, so the two can never disagree. Issued only — nothing
                has been reported for a certificate that does not exist yet. */}
            {issued && data.reporting ? (
              <div
                /* In the card, 4 above it like the facts' own rows (2026-11-04),
                   not the body's 8. */
                style={inline ? { ...reportingRowStyle, marginTop: -4 } : reportingRowStyle}
              >
                <span style={{ color: 'var(--color-text-secondary)' }}>Reporting Status:</span>
                <span style={{ fontWeight: 700 }}>
                  <ReportingStatus reporting={data.reporting} />
                </span>
              </div>
            ) : null}

            {data.rosterReported && !inProgress && (
              <dl style={factsStyle}>
                <Fact label="Roster Reported:" value={data.rosterReported} />
              </dl>
            )}
          </div>

          {/* …and 8 less under them: the column's 16 alone, not 16 + 8. */}
          <div style={{ marginTop: inline ? 0 : 8 }}>
            <p style={whatToDoStyle}>What would you like to do?</p>
            {/* 8 between the buttons in the card, so View Certificate and Go to
                Course share one row at 402 (12 put them a pixel over). */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: inline ? 8 : 12 }}>
              {/* View Certificate leads on an issued one — it is the thing the
                  learner came for. See `pdfUrl` for what it opens today. */}
              {pdfUrl ? (
                <a
                  href={pdfUrl}
                  className={inline ? PRIMARY_CLASS : undefined}
                  style={{ ...(inline ? rowTileStyle : actionTileStyle), textDecoration: 'none' }}
                >
                  <FileCertificateRegular size={inline ? 15 : 26} aria-hidden style={inline ? INLINE_ICON : { color: 'var(--color-tertiary-600)' }} />
                  <span>View Certificate</span>
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => console.info('cert:go-to-course', data.id)}
                className={inline ? PRIMARY_CLASS : undefined}
                style={inline ? rowTileStyle : actionTileStyle}
              >
                <PersonRunning size={inline ? 15 : 26} aria-hidden style={inline ? INLINE_ICON : { color: 'var(--color-tertiary-600)' }} />
                <span>{inProgress ? 'Continue Course' : 'Go to Course'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </SheetOrInline>
  )
}

/** The panel's host: the Sheet, or — `inline` — nothing at all, so the body
 *  sits in whatever the caller puts it in. */
function SheetOrInline({ inline, open, onClose, children }: { inline: boolean; open: boolean; onClose: () => void; children: ReactNode }) {
  if (inline) return open ? <>{children}</> : null
  return (
    <Sheet open={open} onClose={onClose} title="Certificate Details" width={544}>
      {children}
    </Sheet>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <dt style={{ color: 'var(--color-text-secondary)' }}>{label}</dt>
      <dd style={{ margin: 0, color: 'var(--color-text-primary)' }}>{value}</dd>
    </div>
  )
}

function Divider() {
  return <span aria-hidden style={{ width: 1, height: 12, background: 'var(--color-border-subtle)' }} />
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${m}/${d}/${y}`
}

/* In the card: its own column of the same 16 gap, no scroll and no padding —
   the card's are around it. */
const inlineStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 }

/* IN THE CARD THE ACTIONS ARE THE STANDARD PRIMARY BUTTON (2026-11-04,
   Eric's request) — the brand's filled button, white label, its icon kept at
   15 (from the tiles' 26) on the left. Sized to their label, side by side;
   their sides 14, not 18, so the pair still shares one row at 402. */
const PRIMARY_CLASS = 'cre-compass-primary cre-compass-btn-primary'
const rowTileStyle: CSSProperties = {
  ...COMPASS_BUTTON,
  // 35 tall, My Courses' card buttons' height (same day, Eric's request);
  // the icon down another quarter to 15.
  height: 35,
  minHeight: 0,
  padding: '5px 14px',
}
const INLINE_ICON: CSSProperties = { flexShrink: 0, color: 'currentColor' }

const scrollStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: '24px 28px 32px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const backStyle: CSSProperties = {
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-action)',
}

const headingStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  fontSize: 22,
  lineHeight: '28px',
  color: 'var(--color-primary-700)',
}

const bannerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 16px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-warning-100)',
  color: 'var(--color-warning-800)',
}

const bannerIconStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: 'var(--radius-sm)',
  border: '1.5px solid var(--color-warning-400)',
  color: 'var(--color-warning-600)',
  flexShrink: 0,
}

const bannerTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 15,
  color: 'var(--color-warning-800)',
}

const bannerReasonStyle: CSSProperties = {
  margin: '2px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-warning-700)',
}

/* THE ISSUED AND IN-PROGRESS BANNERS (2026-11-02) — the Action Required
   banner's shape on two other ramps, so the three arms read as one component
   wearing three states rather than three different sheets.

   SUCCESS for issued, INFO for not-yet-earned, and the text sits on the -700 /
   -800 steps for the same reason `--color-status-success-text` is pinned to
   -600: the -500 of either ramp does not clear AA on its own 100 tint. */
const issuedBannerStyle: CSSProperties = {
  ...bannerStyle,
  background: 'var(--color-success-100)',
  color: 'var(--color-success-800)',
}
const issuedBannerIconStyle: CSSProperties = {
  ...bannerIconStyle,
  border: '1.5px solid var(--color-success-400)',
  color: 'var(--color-success-600)',
}
const issuedBannerTitleStyle: CSSProperties = { ...bannerTitleStyle, color: 'var(--color-success-800)' }
const issuedBannerReasonStyle: CSSProperties = { ...bannerReasonStyle, color: 'var(--color-success-700)' }

const pendingBannerStyle: CSSProperties = {
  ...bannerStyle,
  background: 'var(--color-info-100)',
  color: 'var(--color-info-800)',
}
const pendingBannerIconStyle: CSSProperties = {
  ...bannerIconStyle,
  border: '1.5px solid var(--color-info-400)',
  color: 'var(--color-info-700)',
}
const pendingBannerTitleStyle: CSSProperties = { ...bannerTitleStyle, color: 'var(--color-info-800)' }
const pendingBannerReasonStyle: CSSProperties = { ...bannerReasonStyle, color: 'var(--color-info-800)' }

/* The Reporting Status row — the facts list's type, laid out as a row because
   its value is a component (the card's `ReportingStatus`), not a string. */
const reportingRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
}

const bodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 18,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}

const professionStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  color: 'var(--color-text-secondary)',
}

const metaRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 8,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  color: 'var(--color-text-secondary)',
}

const factsStyle: CSSProperties = {
  margin: '8px 0 0',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
}

const pendingBoldStyle: CSSProperties = {
  margin: '4px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const explanationBoxStyle: CSSProperties = {
  marginTop: 8,
  padding: '12px 16px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-neutral-100)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const explanationTextStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: 1.5,
  color: 'var(--color-text-secondary)',
}

const whatToDoStyle: CSSProperties = {
  margin: '0 0 12px',
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 15,
  color: 'var(--color-primary-700)',
}

const actionTileStyle: CSSProperties = {
  width: 116,
  minHeight: 96,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  padding: 16,
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-card)',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-tertiary-700)',
  textAlign: 'center',
  lineHeight: 1.2,
}
