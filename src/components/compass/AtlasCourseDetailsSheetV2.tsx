import type { CSSProperties, ReactNode } from 'react'
import { X } from '@/icons'
import { Sheet } from '@/components/ui/Sheet'
import { useSheetInset, useSheetTitleSerif } from '@/components/learning/useSheetTitleSerif'
import type { AtlasCourseCardData } from './AtlasCourseCard'
import { STATE_ABBR } from '@/data/catalogFixtures'

/**
 * THE PRD CARD'S COURSE DETAILS SHEET — 2026-11-24, Jillienne, on a COPY of `AtlasCourseDetailsSheet` (Eric's, 2026-11-18,
 * which the 2026-11-18 card keeps). Two changes, both hers that day: each fact on ONE LINE, the label at the left and the
 * value at the right ("have the Topic on left, and the detail on the right so these display in one line"); and a
 * "Description" sub-header over the package paragraph ("this needs a 'Description' sub-header"). Everything else is the
 * original's, whose notes follow. The facts as rows left the body the same day ("remove these"): the ruled row under the
 * title says them once.
 *
 * A MY COURSES CARD'S COURSE DETAILS — 2026-11-18, Eric: "remove the state, category and line of authority copy … move the
 * deleted sections into a right hand side slide out sheet with its appropriate styling", and a paragraph under them on the
 * course's package.
 *
 * The Atlas side sheet's own head, matched to Exam Details (`ExamDetailsPanel`) on purpose: Close top left, the eyebrow,
 * the title in the heading serif and the 32 inset on the Atlas versions (`useSheetTitleSerif` / `useSheetInset`). The body
 * is the three facts the card used to carry, then `packageSummary`. A fact the course does not have is not drawn.
 */
export function AtlasCourseDetailsSheetV2({
  data,
  open,
  onClose,
  actions,
  notice,
}: {
  data: AtlasCourseCardData
  open: boolean
  onClose: () => void
  /** THE COURSE'S BUTTONS, under the title — the same ones Home's course head offers when this course is active
   *  (2026-11-24, Jillienne: "that sheet view should give the user the same ctas that are currently available as if this
   *  course was active in the atlas home"). The card builds them; the sheet only places them. */
  actions?: ReactNode
  /** THE DEADLINE'S OWN BOX, above the buttons (2026-11-24, Jillienne) — the card builds it (`SheetExtensionBox`) when the
   *  course is inside its last week or past its date; absent otherwise. */
  notice?: ReactNode
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
        {/* The card's ruled labels row — FL | Licensing | Health — under the title, then a little room, then the buttons
            (2026-11-24, Jillienne: "add this same style of line under the course title, then a little padding, and then the
            available ctas"). The same values the body lists in full below. */}
        {facts.length ? (
          <div style={LABELS} data-testid="sheet-labels">
            {facts.map((f, i) => (
              <span key={f.label} style={{ display: 'contents' }}>
                {i > 0 ? <span aria-hidden style={LABEL_RULE} /> : null}
                <span>{f.label === 'State' ? (STATE_ABBR[f.value] ?? f.value) : f.value}</span>
              </span>
            ))}
          </div>
        ) : null}
        {notice ? <div style={NOTICE}>{notice}</div> : null}
        {actions ? <div style={ACTIONS}>{actions}</div> : null}
        {/* A light rule between the buttons and the Description (2026-11-24, Jillienne). */}
        <div aria-hidden style={DIVIDER} />
      </div>
      <div style={{ ...BODY, ...sheetInset }}>
        {/* The three facts as rows stood here until 2026-11-24 (Jillienne: "remove these") — the ruled row under the title
            says them now, once. */}
        {data.packageSummary ? (
          <>
            <h3 style={SUMMARY_HEAD}>Description</h3>
            <p style={SUMMARY}>{data.packageSummary}</p>
          </>
        ) : null}
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
/* The labels row under the title — the card's `FACTS` row verbatim: 12 / 500, hairlines between, the secondary ink. */
const LABELS: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 8,
  rowGap: 4,
  marginTop: 8,
  color: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 400,
  lineHeight: '18px',
}
const LABEL_RULE: CSSProperties = { width: 1, height: 12, background: 'var(--color-border-subtle)', flex: 'none' }
/* The buttons under the labels, 8 apart, wrapping — Home's course head's row (2026-11-24); 24 below the labels ("add padding
   above the ctas"; 16 before). */
const ACTIONS: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24 }
/* The deadline box's slot: 24 below the labels, like the buttons; the buttons then follow it at 16. */
const NOTICE: CSSProperties = { marginTop: 24 }
/* The rule under the buttons, Primary 100 — the card's own edge — 20 below them; the body's 18 follows. */
const DIVIDER: CSSProperties = { height: 1, marginTop: 20, background: 'var(--color-primary-100)' }
const BODY: CSSProperties = { flex: 1, overflowY: 'auto', padding: '18px 22px 24px' }
/* "Description" over the package paragraph (2026-11-24): the facts' label face, one weight up. */
const SUMMARY_HEAD: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '18px',
  fontWeight: 700,
  color: 'var(--color-text-secondary)',
}
const SUMMARY: CSSProperties = {
  margin: '4px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
}
