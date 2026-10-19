import type { CSSProperties } from 'react'
import { ArrowLeft, ChevronRight, X } from '@/icons'
import { examFactsFor, jurisdictionName } from '@/data/nyProducerRequirements'
import { useExamDate } from '@/data/examDateStore'
import { EXAM_FAQ, examDetailRows } from '@/data/examDetails'
import { GoverningAgencyBlock } from './GoverningAgencyBlock'
import './examDetails.css'

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
  /* THE VENDOR FOLLOWS THE JURISDICTION (2026-10-15). "PSI" was written into
     the sub-line, so a Florida sitting — Pearson VUE, in person only — was
     announced as PSI's. */
  const vendor = examFactsFor(state).vendor
  /* Read here rather than threaded from `MembershipOverview`: the store is the
     one source for "is there a date", every other surface reads it the same
     way, and a prop would be a second copy that can disagree. */
  const hasExamDate = Boolean(useExamDate())
  return (
    <>
      {/* The step sheet's header, matched deliberately — this opens from the
          same column and stacks under the same sheets, so a different close
          affordance would read as an unrelated surface. */}
      <div style={{ flexShrink: 0, padding: '18px 22px 0' }}>
        <button type="button" onClick={onClose} className="cre-link-action cre-cta-ink" style={closeStyle}>
          <X size={14} aria-hidden />
          Close
        </button>
        <p style={eyebrowStyle}>Your state exam</p>
        <h2 style={titleStyle}>Exam Details</h2>
        <p style={subStyle}>{where ? `${where} licence · ${vendor}` : vendor}</p>
      </div>

      <div style={bodyStyle}>
        <ul style={rowListStyle}>
          {examDetailRows(hasExamDate, state).map((row) => (
            <li key={row.id}>
              <button type="button" className="cre-exam-row" style={rowStyle} onClick={() => onSelect(row.id)}>
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
        <GoverningAgencyBlock state={state} />
      </div>
    </>
  )
}

export function ExamFaqPanel({ onClose, onBack }: { onClose: () => void; onBack?: () => void }) {
  return (
    <>
      <div style={{ flexShrink: 0, padding: '18px 22px 0' }}>
      {/* ⚠ BACK, NOT CLOSE, WHEN THIS OPENED FROM A MENU (2026-10-19,
          Jillienne: "lets make it seamless so it seems like a journey …
          clicking the option, and new sheet auto shows instantly and then a
          back link is available at the top left to return to the first
          sheet"). Opened on its own — from Quick Links, or a Step's link —
          there is nothing behind it, so Close is still the only honest
          control. One slot, one affordance: a Back AND a Close in the same
          corner asks the reader which one dismisses the sheet. */}
        {onBack ? (
          <button type="button" onClick={onBack} className="cre-link-action cre-cta-ink" style={closeStyle}>
            <ArrowLeft size={14} aria-hidden />
            Back
          </button>
        ) : (
          <button type="button" onClick={onClose} className="cre-link-action cre-cta-ink" style={closeStyle}>
            <X size={14} aria-hidden />
            Close
          </button>
        )}
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

/* ⚠ `cre-cta-ink` OWNS THE COLOUR (2026-10-19, Jillienne: "these should be
   the blue link cta color"). It was `--color-text-secondary`, a grey, while
   the links INSIDE the same sheet — dice.fldfs.com, myfloridacfo.com — are
   that class's navy. Two link treatments on one panel, and the one at the
   top was the quieter of the two despite being the only control that does
   anything structural.

   ⚠ AND THE INLINE `color` HAD TO GO, not be changed to the same value.
   Inline beats the stylesheet, so a second declaration here would have
   pinned the colour and stopped following the theme — `cre-cta-ink` has a
   `[data-theme='dark']` arm, which an inline hex silently defeats. */
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
  /* ⚠ NO `background` OR `border-color` HERE — `.cre-exam-row` owns both, or
     its hover could never outrank the element. The WIDTH and STYLE stay, so
     the box is the same size whichever rule paints it. */
  borderWidth: 1,
  borderStyle: 'solid',
  /* 12, not 4 (2026-10-19) — `--radius-lg`, the roundest of the three stops,
     which is also what the sheet's own corners use. */
  borderRadius: 'var(--radius-lg)',
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
