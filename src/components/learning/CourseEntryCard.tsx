import { LoFiWidgetBody } from '@/components/lo-fi/LoFiPlaceholders'
import { useLoFi } from '@/context/LoFiContext'
import type { CSSProperties } from 'react'
import { ArrowRight } from '@/icons'
import {
  NY_LH_CURRENT_CHAPTER,
  NY_LH_CURRENT_LESSON_PART,
  NY_LH_LESSON_PARTS,
  NY_LH_LESSON_MINUTES_INVENTED,
} from '@/data/nyProducerRequirements'

/**
 * THE COMBINED COURSE ENTRY CARD — `course-entry-style: combined`, 2026-09-28.
 *
 * One card doing what the COURSE PROGRESS header and the Jump Back In card do
 * as two blocks: which course, how far in, and the one action that continues
 * it. The direct ask, from a reference showing both halves inside a single
 * bordered card.
 *
 * ⚠ IT IS A SIBLING, NOT A REWRITE. The header markup in `MembershipOverview`
 * and `JumpBackInWidget` are both untouched — the flag picks between them at
 * the call site. That is this repo's pattern for changing something that
 * already exists (`CourseContentV2` is the other example), and it is what lets
 * the two be compared rather than one replaced on a hunch.
 *
 * FOUR DECISIONS, all asked for rather than inferred (2026-09-28):
 *
 *  1. NO TARGET EXAM DATE, though the reference shows one. That cell was
 *     removed from the header on 2026-09-21 by direct ask, and the reasoning
 *     still holds: the date is echoed on the Schedule State Exam card, which is
 *     the control that asked for it. A combined card is not a reason to reverse
 *     it.
 *  2. NO "COURSE OVERVIEW" BUTTON, though the reference has one — asked to be
 *     dropped. `Details →` is the one way out of this card.
 *  3. THE BAR AND THE FIGURE BOTH STAY, and the figure LEADS the meta row with
 *     the rule after it, exactly as the split header does. The reference has
 *     neither; keeping them is what stops this being a downgrade.
 *  4. ALL THREE CTA SHAPES SURVIVE — Start course / Resume / Review course.
 *     The reference says "Begin Course" for everything, which would say "begin"
 *     to someone 62% in. This is a LAYOUT change; the states stay honest.
 */
export function CourseEntryCard({
  courseTitle,
  cover,
  percent,
  stats,
  lessonsCompleted,
  complete = false,
  showDetails = false,
  onResume,
  onDetails,
}: {
  courseTitle: string
  /** Cover art. Absent → the card renders text-only rather than a gap. */
  cover?: string | null
  /** 0–100. At 0 the figure and its rule drop, as in the split header. */
  percent: number
  /** The `{ value, caption }` pairs the split header already builds, passed in
   *  rather than re-derived — two derivations of "17 days" would eventually
   *  disagree, and the whole point of the A/B is that only the LAYOUT differs. */
  stats: { value: string; caption: string }[]
  /** Completed lesson count — the lesson number is this plus one. */
  lessonsCompleted: number
  complete?: boolean
  /**
   * Show the `Details →` link — `course-entry-details`, OFF by default
   * (2026-09-28, the direct ask).
   *
   * ⚠ DEFAULTS TO FALSE HERE TOO, matching the flag rather than being the
   * opposite of it. A component whose own default disagrees with its flag's is
   * a bug waiting for the day someone renders it without the prop.
   *
   * The reason it is off: this card exists to get one press — Resume — and a
   * second link on the same row competes for it. The flag is how to compare the
   * two, not a setting to leave on absent-mindedly.
   */
  showDetails?: boolean
  onResume?: () => void
  onDetails?: () => void
}) {
  const pct = Math.max(0, Math.min(100, percent))
  /* Same rule as the split header: the figure is ABSENT at 0, not rendered as
     "0%". It takes its dividing rule with it, so the stats start at the edge. */
  const showPercent = pct > 0

  /* LO-FI — the shell stays, the detail goes. `LoFiPlaceholders`' own rule:
     "the outer shell of each component stays intact — same dimensions, same
     position in the grid — so the page TEMPLATE remains visible while the
     Hi-Fi DETAILS get stripped." That is what makes lo-fi a question about
     LAYOUT rather than a broken page. */
  const { loFi } = useLoFi()
  if (loFi) {
    return (
      <section aria-label="Current course" style={card}>
        <LoFiWidgetBody rows={4} showCta ariaLabel="Lo-fi current course card" />
      </section>
    )
  }
  return (
    <section aria-label="Current course" style={card}>
      <div style={topRow}>
        {cover ? <img src={cover} alt="" aria-hidden style={coverStyle} /> : null}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="cre-eyebrow-ink" style={eyebrow}>
            Current course
          </p>
          <h2 style={title}>{courseTitle}</h2>

          <div aria-hidden style={track}>
            <div style={{ ...fill, width: `${pct}%` }} />
          </div>

          <div style={metaRow}>
            <div style={metaLeft}>
              {showPercent && (
                <span style={figureWrap}>
                  <span style={figure}>{Math.round(pct)}</span>
                  <span style={figureUnit}>%</span>
                </span>
              )}
              <div style={{ ...statCluster, ...(showPercent ? withRule : null) }}>
                {stats.map((s) => (
                  <span key={s.caption} style={statPair}>
                    <span style={statValue}>{s.value}</span>
                    <span style={statCaption}>{s.caption}</span>
                  </span>
                ))}
              </div>
            </div>
            {showDetails && (
              <button type="button" onClick={onDetails} style={detailsLink}>
                Details <ArrowRight size={13} aria-hidden />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* The hairline is what makes this ONE card rather than two stacked. The
          reference draws it too, and it is doing the job the dashed divider
          between the old blocks used to do — see the note in `MembershipOverview`
          about why that one went. */}
      <div aria-hidden style={divider} />

      <div style={lessonRow}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {complete ? (
            /* At 100% the lesson line, the title and the estimate all go — none
               of them answers anything once the coursework is done, which is the
               same call `JumpBackInWidget` makes in its own complete state. */
            <p style={lessonTitle}>All coursework complete</p>
          ) : (
            <>
              <p style={lessonMeta}>
                {/* The book glyph came off on 2026-09-28, the direct ask. The
                    line is already a small-caps label; the icon was decorating
                    a label rather than naming anything. */}
                Lesson {lessonsCompleted + 1}
                <span aria-hidden style={dot} />
                Part {NY_LH_CURRENT_LESSON_PART} of {NY_LH_LESSON_PARTS}
                <span aria-hidden style={dot} />
                {/* ⚠ INVENTED, and named as such at its source — nothing in the
                    fixtures knows how long a lesson takes. See
                    `NY_LH_LESSON_MINUTES_INVENTED`. */}
                <span style={estimate}>About {NY_LH_LESSON_MINUTES_INVENTED} minutes</span>
              </p>
              <h3 style={lessonTitle}>{NY_LH_CURRENT_CHAPTER}</h3>
            </>
          )}
        </div>
        <button type="button" data-cta-id="home.resume" onClick={onResume} style={cta}>
          {complete ? 'Review course' : lessonsCompleted > 0 ? 'Resume' : 'Start course'}{' '}
          <ArrowRight size={16} aria-hidden />
        </button>
      </div>
    </section>
  )
}

/* ─── styles ──────────────────────────────────────────────────────────── */

const card: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-primary-100)',
  /* 4 — `--radius-sm`, matching the Study Journey and Schedule State Exam
     cards beside it (2026-09-28, the direct ask). The token, not a literal. */
  borderRadius: 'var(--radius-sm)',
  padding: 20,
  minWidth: 0,
}

const topRow: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 16, minWidth: 0 }

const coverStyle: CSSProperties = {
  width: 104,
  alignSelf: 'stretch',
  height: 'auto',
  flex: 'none',
  /* The same two diagonally-opposite corners the split header rounds. */
  borderRadius: '0 var(--radius-md) 0 var(--radius-md)',
  objectFit: 'cover',
  display: 'block',
}

const eyebrow: CSSProperties = {
  margin: '0 0 6px',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const title: CSSProperties = {
  margin: 0,
  minWidth: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 26,
  lineHeight: 1.15,
  color: 'var(--color-text-primary)',
}

const track: CSSProperties = {
  marginTop: 12,
  width: '100%',
  height: 8,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-neutral-300)',
  overflow: 'hidden',
}

const fill: CSSProperties = {
  height: '100%',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-primary-500)',
}

/* ⚠ `nowrap`. With `wrap` the Details link was the thing that gave way and
   dropped BELOW the stats, left-aligned under the figure — which reads as a
   stray link rather than as the row's action. The stat cluster wraps internally
   instead, so the row keeps its shape and Details stays where the split header
   puts it. */
const metaRow: CSSProperties = {
  marginTop: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 20,
  flexWrap: 'nowrap',
}

const metaLeft: CSSProperties = { display: 'flex', alignItems: 'center', gap: 15, minWidth: 0 }

const figureWrap: CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 2, flexShrink: 0 }

const figure: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 30,
  lineHeight: 1,
  color: 'var(--color-text-primary)',
}

const figureUnit: CSSProperties = { ...figure, fontSize: 16 }

const statCluster: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 18,
  flexWrap: 'wrap',
  minWidth: 0,
}

/* ⚠ `--color-neutral-300`, NOT `--color-border-subtle`: the subtle token reads
   1.29:1 light and 1.38:1 dark, i.e. a rule that disappears in one theme. The
   split header's own note records the same decision. */
const withRule: CSSProperties = {
  borderLeft: '1px solid var(--color-neutral-300)',
  paddingLeft: 15,
}

const statPair: CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 6 }

const statValue: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
}

const statCaption: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}

const detailsLink: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: 0,
  border: 0,
  background: 'transparent',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-primary-600)',
  flexShrink: 0,
}

const divider: CSSProperties = {
  margin: '18px 0',
  height: 1,
  background: 'var(--color-primary-100)',
}

const lessonRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }

const lessonMeta: CSSProperties = {
  margin: '0 0 4px',
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

const dot: CSSProperties = {
  display: 'inline-block',
  width: 3,
  height: 3,
  borderRadius: '50%',
  margin: '0 8px',
  verticalAlign: 'middle',
  background: 'var(--color-neutral-300)',
}

/** Quieter than the lesson line: a note about the work, not a name for it. */
const estimate: CSSProperties = { fontWeight: 400, letterSpacing: '0.04em', textTransform: 'none' }

const lessonTitle: CSSProperties = {
  margin: 0,
  /* ⚠ BODY FACE, not `--font-heading`: the `dashboard-heading-font` variant
     re-points the heading token at a serif, and a chapter name is a row label
     rather than a heading. `JumpBackInWidget` makes the same call. */
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 15,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

const cta: CSSProperties = {
  flexShrink: 0,
  padding: '0 20px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  height: 44,
  borderRadius: 'var(--radius-md)',
  border: 0,
  cursor: 'pointer',
  background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))',
  color: 'rgb(255 255 255 / 1)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 14,
}
