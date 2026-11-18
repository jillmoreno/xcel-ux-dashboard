import type { CSSProperties } from 'react'
import { X } from '@/icons'
import { Sheet } from '@/components/ui/Sheet'
import { useSheetInset, useSheetTitleSerif } from '@/components/learning/useSheetTitleSerif'
import type { AtlasCourseCardData } from './AtlasCourseCard'

/**
 * A MY COURSES CARD'S COURSE DETAILS — 2026-11-18, Eric: "remove the state, category and line of authority copy … move the
 * deleted sections into a right hand side slide out sheet with its appropriate styling", and a paragraph under them on the
 * course's package.
 *
 * The Atlas side sheet's own head, matched to Exam Details (`ExamDetailsPanel`) on purpose: Close top left, the eyebrow,
 * the title in the heading serif and the 32 inset on the Atlas versions (`useSheetTitleSerif` / `useSheetInset`). The body
 * is the three facts the card used to carry, then `packageSummary`. A fact the course does not have is not drawn.
 */
export function AtlasCourseDetailsSheet({
  data,
  open,
  onClose,
}: {
  data: AtlasCourseCardData
  open: boolean
  onClose: () => void
}) {
  const titleSerif = useSheetTitleSerif()
  const sheetInset = useSheetInset()
  const facts = [
    { label: 'State', value: data.state },
    { label: 'Category', value: data.category },
    { label: 'Line of authority', value: data.lineOfAuthority },
  ].filter((f): f is { label: string; value: string } => Boolean(f.value))
  return (
    <Sheet open={open} onClose={onClose} title={`${data.title} details`} width={480}>
      <div style={{ flexShrink: 0, padding: '18px 22px 0', ...sheetInset }}>
        <button type="button" onClick={onClose} className="cre-link-action cre-cta-ink" style={CLOSE}>
          <X size={14} aria-hidden />
          Close
        </button>
        <p style={EYEBROW}>Course Details</p>
        <h2 style={{ ...TITLE, ...titleSerif }}>{data.title}</h2>
      </div>
      <div style={{ ...BODY, ...sheetInset }}>
        {facts.length ? (
          <dl style={FACTS}>
            {facts.map((f) => (
              <div key={f.label} style={FACT_ROW}>
                <dt style={FACT_LABEL}>{f.label}</dt>
                <dd style={FACT_VALUE}>{f.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {data.packageSummary ? <p style={SUMMARY}>{data.packageSummary}</p> : null}
      </div>
    </Sheet>
  )
}

/* Exam Details' head, verbatim. */
const CLOSE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
}
const EYEBROW: CSSProperties = {
  margin: '14px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}
const TITLE: CSSProperties = {
  margin: '6px 0 0',
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 21,
  lineHeight: '27px',
  color: 'var(--color-text-primary)',
}
const BODY: CSSProperties = { flex: 1, overflowY: 'auto', padding: '18px 22px 24px' }
/* The facts as rows on the Atlas hairline, label over value. */
const FACTS: CSSProperties = { margin: 0, padding: 0, borderTop: '1px solid var(--color-primary-200)' }
const FACT_ROW: CSSProperties = { padding: '12px 0', borderBottom: '1px solid var(--color-primary-200)' }
const FACT_LABEL: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}
const FACT_VALUE: CSSProperties = {
  margin: '2px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '20px',
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}
const SUMMARY: CSSProperties = {
  margin: '20px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
}
