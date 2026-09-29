import type { CSSProperties } from 'react'
import { ChevronRight, X } from '@/icons'
import { jurisdictionName } from '@/data/nyProducerRequirements'
import { EXAM_FAQ, examDetailRows } from '@/data/examDetails'
import { GoverningAgencyBlock } from './GoverningAgencyBlock'

/**
 * EXAM DETAILS — the menu the exam-date card's footer opens, 2026-09-29.
 *
 * `ask-first`'s footer used to go straight to the Schedule State Exam step
 * sheet. That was one door onto three rooms: the same learner who wants to know
 * how to rebook also wants to know what the sitting is like and what happens if
 * they fail, and two of those were reachable only from OTHER cards in the
 * journey column. So the footer now opens this — a menu of the three, from the
 * card that owns the exam.
 *
 * ⚠ IT ADDS A HOP TO THE ONE DESTINATION THAT WAS ALREADY DIRECT. Someone who
 * only ever wanted "how do I book" now clicks twice. That is the accepted cost:
 * the previous label promised scheduling and nothing else, so the other two
 * sheets were effectively unreachable from here, and a menu that names all
 * three is the honest version of what the footer was always pointing at.
 *
 * TWO OF THE THREE ARE NOT NEW. Rows 1 and 2 open `GetLicensedStepPanel` on the
 * steps that already own that content (`schedule-exam`, `pass-exam`) — the same
 * sheets the Study Journey rows open, not copies. Only the FAQ is new, and it is
 * DEMO CONTENT (see `EXAM_FAQ`).
 *
 * The rows are a SECOND sheet over this one rather than a replacement of it, so
 * closing a detail returns you to the menu you chose from — see the two `Sheet`s
 * in `MembershipOverview`.
 *
 * The GOVERNING AGENCY block sits at the bottom, moved here from all three step
 * sheets on 2026-09-29 — `GoverningAgencyBlock` carries that decision and its
 * cost.
 */

export function ExamDetailsPanel({
  state,
  onSelect,
  onClose,
}: {
  /** Two-letter code, for the sub-line. */
  state?: string
  onSelect: (id: string) => void
  onClose: () => void
}) {
  const where = jurisdictionName(state)
  return (
    <>
      {/* The step sheet's header, matched deliberately — this opens from the
          same column and stacks under the same sheets, so a different close
          affordance would read as an unrelated surface. */}
      <div style={{ flexShrink: 0, padding: '18px 22px 0' }}>
        <button type="button" onClick={onClose} className="cre-link-action" style={closeStyle}>
          <X size={14} aria-hidden />
          Close
        </button>
        <p style={eyebrowStyle}>Your state exam</p>
        <h2 style={titleStyle}>Exam Details</h2>
        <p style={subStyle}>{where ? `${where} licence · PSI` : 'PSI'}</p>
      </div>

      <div style={bodyStyle}>
        <ul style={rowListStyle}>
          {examDetailRows().map((row) => (
            <li key={row.id}>
              <button type="button" style={rowStyle} onClick={() => onSelect(row.id)}>
                <span style={{ minWidth: 0 }}>
                  <span style={rowLabelStyle}>{row.label}</span>
                  <span style={rowDetailStyle}>{row.detail}</span>
                </span>
                <ChevronRight size={13} aria-hidden style={rowChevronStyle} />
              </button>
            </li>
          ))}
        </ul>
        {/* THE CONTACT BLOCK, once, at the bottom — below the three rows
            because it is not a fourth one. The rows lead somewhere; this is
            reference material you read in place. */}
        <GoverningAgencyBlock />
      </div>
    </>
  )
}

export function ExamFaqPanel({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div style={{ flexShrink: 0, padding: '18px 22px 0' }}>
        <button type="button" onClick={onClose} className="cre-link-action" style={closeStyle}>
          <X size={14} aria-hidden />
          Close
        </button>
        <p style={eyebrowStyle}>Your state exam</p>
        <h2 style={titleStyle}>Common questions</h2>
        <p style={subStyle}>Demo content — answers pending confirmation from PSI</p>
      </div>

      <div style={bodyStyle}>
        {/* A definition list, not an accordion. Five short answers fit in one
            scroll, and collapsing them would hide the thing the sheet exists to
            show behind five more clicks. */}
        <dl style={faqListStyle}>
          {EXAM_FAQ.map((item) => (
            <div key={item.q}>
              <dt style={faqQStyle}>{item.q}</dt>
              <dd style={faqAStyle}>{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  )
}

/* ─── styles ───────────────────────────────────────────────────────────────

   The header four are `GetLicensedStepPanel`'s values, repeated rather than
   imported. A shared header would be the better answer if a fourth panel
   appears; at two it would mean exporting four constants from a file whose own
   note says the panels are deliberately separate components. Revisit on the
   next one. */

const closeStyle: CSSProperties = {
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
  color: 'var(--color-text-secondary)',
}

const eyebrowStyle: CSSProperties = {
  margin: '14px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}

const titleStyle: CSSProperties = {
  margin: '6px 0 0',
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 21,
  lineHeight: '27px',
  color: 'var(--color-text-primary)',
}

const subStyle: CSSProperties = {
  margin: '4px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-secondary)',
}

const bodyStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '18px 22px 24px',
}

const rowListStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const rowStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  textAlign: 'left',
  padding: '14px 16px',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--color-surface-card)',
  cursor: 'pointer',
}

const rowLabelStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

const rowDetailStyle: CSSProperties = {
  display: 'block',
  marginTop: 3,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '16px',
  color: 'var(--color-text-secondary)',
}

const rowChevronStyle: CSSProperties = {
  flexShrink: 0,
  color: 'var(--color-text-tertiary)',
}

const faqListStyle: CSSProperties = {
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
}

const faqQStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  lineHeight: '18px',
  color: 'var(--color-text-primary)',
}

const faqAStyle: CSSProperties = {
  margin: '6px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '19px',
  color: 'var(--color-text-secondary)',
}
