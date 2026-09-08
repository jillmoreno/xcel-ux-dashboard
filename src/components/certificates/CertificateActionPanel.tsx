import type { CSSProperties } from 'react'
import { ArrowLeft, CircleExclamation, PersonRunning } from '@/icons'
import { Sheet } from '@/components/ui/Sheet'
import { CERT_ACTION_META, type Certificate } from '@/data/certificateFixtures'

/**
 * Certificate Details slide-over for an action-required certificate. One
 * component covers all five action variants (Survey / Affidavit / Proctored
 * Exam / Document / Payment) — the banner reason, pending label, and optional
 * explanation paragraph come from `CERT_ACTION_META`. Affidavit is the only
 * variant with an explanation block. From the 2.0 Certificates designs.
 */
export function CertificateActionPanel({
  open,
  onClose,
  data,
}: {
  open: boolean
  onClose: () => void
  data: Certificate | null
}) {
  const meta = data?.action ? CERT_ACTION_META[data.action] : null
  const reason = meta && data ? meta.bannerReason.replaceAll('{state}', data.state) : ''
  const explanation = meta?.explanation && data ? meta.explanation.replaceAll('{state}', data.state) : null

  return (
    <Sheet open={open && data != null} onClose={onClose} title="Certificate Details" width={544}>
      {data && meta && (
        <div style={scrollStyle}>
          <button type="button" onClick={onClose} className="cre-link-action" style={backStyle}>
            <ArrowLeft size={16} aria-hidden />
            Back
          </button>
          <h2 style={headingStyle}>Certificate Details</h2>

          {/* Action Required banner */}
          <div style={bannerStyle}>
            <span aria-hidden style={bannerIconStyle}>
              <CircleExclamation size={20} aria-hidden />
            </span>
            <div>
              <p style={bannerTitleStyle}>Action Required</p>
              <p style={bannerReasonStyle}>{reason}</p>
            </div>
          </div>

          <div style={bodyStyle}>
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

            <dl style={factsStyle}>
              <Fact label="Enrolled:" value={formatDate(data.enrolledDate)} />
              <Fact label="Course Completed:" value={formatDate(data.completedDate)} />
            </dl>

            {explanation ? (
              <div style={explanationBoxStyle}>
                <p style={pendingBoldStyle}>Certificate Pending: {meta.pendingLabel}</p>
                <p style={explanationTextStyle}>{explanation}</p>
              </div>
            ) : (
              <p style={pendingBoldStyle}>Certificate Pending: {meta.pendingLabel}</p>
            )}

            {data.rosterReported && (
              <dl style={factsStyle}>
                <Fact label="Roster Reported:" value={data.rosterReported} />
              </dl>
            )}
          </div>

          <div style={{ marginTop: 8 }}>
            <p style={whatToDoStyle}>What would you like to do?</p>
            <button
              type="button"
              onClick={() => console.info('cert:go-to-course', data.id)}
              style={actionTileStyle}
            >
              <PersonRunning size={26} aria-hidden style={{ color: 'var(--color-tertiary-600)' }} />
              <span>Go to Course</span>
            </button>
          </div>
        </div>
      )}
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
