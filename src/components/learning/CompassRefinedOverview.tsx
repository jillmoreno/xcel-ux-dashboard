import { useState } from 'react'
import { ArrowRight, ChevronDown, ClipboardList, Library, Notebook, RubiLogo } from '@/icons'
import {
  JEFF_MVP_OVERVIEW as OV,
  JEFF_MVP_OVERVIEW_COPY as COPY,
  type JeffMvpPage,
} from '@/data/compassJeffMvpFixtures'
import { CompassRefinedColumn, CompassRefinedHead } from './CompassRefinedChrome'
import './compassRefined.css'

/**
 * JEFF'S OVERVIEW — 2026-11-09, the third page ported and the one his own
 * export opens on.
 *
 * It is the page that states the argument the rest of his MVP carries out:
 * two signals, kept apart. Lessons build Progress; Exam Prep practice builds
 * Readiness; course activity does not move Readiness. The whole lower half of
 * the page is a tab strip switching between those two measures, and the
 * footnote says it in one sentence.
 *
 * ⚠ THE TAB SWAPS THE TABLE, NOT A FILTER ON IT. Title, summary, column heads
 * and row shape all change: "Your prep by exam topic" over five columns
 * becomes "Course progress by topic" over three. Two fixtures, each extracted
 * with every row open.
 *
 * ⚠ THE LAST READINESS ROW IS NOT A TOPIC. Exam Simulator has no
 * share-of-exam wedge, no band, no chevron, and "Uses all topics" where the
 * band would be. Drawing it like the five above would claim a Readiness score
 * his design deliberately withholds.
 *
 * ⚠ THE OUTER RING ARC IS EMPTY, WITH A BUTT CAP. Nought of three simulator
 * exams taken, and a round cap on a zero-length arc draws a dot — which would
 * read as "a little bit done". His choice, kept.
 */
export function CompassRefinedOverview({
  onSelectPage,
}: {
  onSelectPage?: (p: JeffMvpPage) => void
}) {
  const [tab, setTab] = useState<'readiness' | 'progress'>('readiness')
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const go = (p: JeffMvpPage) => () => onSelectPage?.(p)
  const table = tab === 'readiness' ? OV.readiness : OV.progress

  return (
    <div className="crf-page">
      <button type="button" className="crf-ask">
        <RubiLogo size={17} aria-hidden />
        Ask Rubi
      </button>
      <CompassRefinedColumn>
        {/* ⚠ NO `below` ANY MORE — 2026-11-10. His Overview put the course
            name, the access date and two pills under the title; the course
            and the date are the head's eyebrow on every page now, and the
            pills were removed on the direct ask ("Remove Learn + Prepare
            Pill", "Remove open access-move freely"). Both said something
            about access that the eyebrow's date already says, and they said
            it only here. `COPY.course`, `.access`, `.phasePill` and
            `.accessPill` stay in his fixture — this page stopped reading
            them, which is not the same as deciding they are wrong for his. */}
        <CompassRefinedHead title={COPY.title} ruled />

        {/* ---------- your next step ---------- */}
        <section className="crf-next" aria-label={COPY.nextTitle}>
          <div className="crf-next__body crf-next__body--ov">
            <div style={{ minWidth: 0 }}>
              <p className="crf-eyebrow crf-eyebrow--steel">{COPY.nextEyebrow}</p>
              <h2 className="crf-next__title">{COPY.nextTitle}</h2>
              <p className="crf-next__text">{COPY.nextBody}</p>
            </div>
            <div className="crf-next__set">
              <p className="crf-eyebrow">{COPY.nextSetEyebrow}</p>
              <p className="crf-set__title">{COPY.nextSetTitle}</p>
              <p className="crf-set__meta">{COPY.nextSetMeta}</p>
              <button type="button" className="crf-cta" onClick={go('learn')}>
                {COPY.nextCta}
                <ArrowRight size={13} aria-hidden />
              </button>
              <button type="button" className="crf-link" onClick={go('practice')}>
                {COPY.nextAlt}
              </button>
            </div>
          </div>
        </section>

        {/* ---------- Rubi recommends · continue preparing ---------- */}
        <section className="crf-twoup" aria-label={COPY.rubiEyebrow}>
          <div className="crf-rubi">
            <p className="crf-eyebrow crf-eyebrow--rubi">
              <RubiLogo size={13} aria-hidden />
              {COPY.rubiEyebrow}
            </p>
            <p className="crf-rubi__title">{COPY.rubiTitle}</p>
            <p className="crf-card__text">{COPY.rubiBody}</p>
            <button type="button" className="crf-cta" onClick={go('learn')}>
              {COPY.rubiCta}
              <ArrowRight size={13} aria-hidden />
            </button>
          </div>
          <div className="crf-continue">
            <p className="crf-eyebrow">{COPY.continueEyebrow}</p>
            <div className="crf-continue__cards">
              {COPY.continueCards.map((c) => {
                const Icon =
                  c.page === 'practice' ? Library : c.page === 'flashcards' ? Notebook : ClipboardList
                return (
                  <article className="crf-mini" key={c.title}>
                    <span className="crf-mini__icon" aria-hidden>
                      <Icon size={17} />
                    </span>
                    <p className="crf-mini__title">{c.title}</p>
                    <p className="crf-mini__body">{c.body}</p>
                    <button
                      type="button"
                      className="crf-link crf-link--flush"
                      onClick={go(c.page as JeffMvpPage)}
                    >
                      {COPY.continueCta}
                      <ArrowRight size={11} aria-hidden />
                    </button>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* ---------- the two measures ---------- */}
        <section className="crf-twoup crf-twoup--stats" aria-label={COPY.readyEyebrow}>
          <div className="crf-stat">
            <p className="crf-stat__head">
              <span className="crf-eyebrow">{COPY.readyEyebrow}</span>
              <span className="crf-stat__source">{COPY.readySource}</span>
            </p>
            <div className="crf-stat__body">
              <ReadinessRings />
              <ul className="crf-legend">
                {COPY.readyLegend.map((l) => (
                  <li key={l.label}>
                    <span className="crf-dot crf-dot--lg" style={{ background: `var(--cjm-${l.dotTone})` }} aria-hidden />
                    <span className="crf-legend__pair">
                      <b>{l.label}</b>
                      <span>{l.value}</span>
                    </span>
                  </li>
                ))}
                {/* ⚠ THE FIFTH ROW IS NOT A MEASURE — hollow dot, stacked
                    lines, muted. It is what none of the arcs is tracking. */}
                <li>
                  <span className="crf-dot crf-dot--hollow" aria-hidden />
                  <span className="crf-legend__stack">
                    <b>{COPY.bookLabel}</b>
                    <span>{COPY.bookValue}</span>
                  </span>
                </li>
              </ul>
            </div>
            <p className="crf-stat__caption">{COPY.readyCaption}</p>
          </div>

          <div className="crf-stat">
            <p className="crf-stat__head">
              <span className="crf-eyebrow">{COPY.progressEyebrow}</span>
              <span className="crf-stat__source">{COPY.progressSource}</span>
            </p>
            <div className="crf-stat__body">
              <LessonRing />
              <div className="crf-stat__text">
                <p className="crf-stat__pair">
                  <b>{COPY.progressCourse}</b>
                  <span>{COPY.progressLessons}</span>
                </p>
                <p className="crf-stat__note">{COPY.progressNote}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- the tabs ---------- */}
        <div className="crf-tabs" role="tablist" aria-label="Which measure">
          {OV.tabs.map((t, i) => {
            const key = i === 0 ? 'readiness' : 'progress'
            const on = tab === key
            return (
              <button
                key={t.label}
                type="button"
                role="tab"
                aria-selected={on}
                className={on ? 'crf-tab is-on' : 'crf-tab'}
                onClick={() => setTab(key as 'readiness' | 'progress')}
              >
                <span className="crf-tab__label">{t.label}</span>
                <span className="crf-tab__sub">{t.sub}</span>
              </button>
            )
          })}
        </div>

        {/* ---------- the table ---------- */}
        <div className="crf-tablehead">
          <div style={{ minWidth: 0 }}>
            <h2 className="crf-h2">{table.tableTitle}</h2>
            <p className="crf-topics__sub">{table.summary}</p>
          </div>
          <p className="crf-tablehead__note">{table.tableNote}</p>
        </div>

        {tab === 'readiness' ? (
          <ReadinessTable open={open} setOpen={setOpen} go={go} />
        ) : (
          <ProgressTable open={open} setOpen={setOpen} />
        )}

        <p className="crf-footnote">{COPY.footnote}</p>
      </CompassRefinedColumn>
    </div>
  )
}

/* ---------------- the Readiness table ---------------- */

function ReadinessTable({
  open,
  setOpen,
  go,
}: {
  open: Record<string, boolean>
  setOpen: (f: (o: Record<string, boolean>) => Record<string, boolean>) => void
  go: (p: JeffMvpPage) => () => void
}) {
  return (
    <div className="crf-table">
      <div className="crf-table__row crf-table__head crf-table__row--r">
        {COPY.readinessCols.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      {OV.readiness.rows.map((r) => {
        const expanded = open[r.name] ?? r.expanded
        return (
          <article key={r.name} className={expanded ? 'crf-trow is-open' : 'crf-trow'}>
            <div className="crf-table__row crf-table__row--r">
              <span className="crf-trow__name">
                {/* The share-of-exam wedge: a short vertical bar whose filled
                    part is the topic's weight. Absent on the simulator row. */}
                {r.hasPie ? (
                  <span className="crf-wedge" aria-hidden>
                    <span className="crf-wedge__fill" style={{ height: r.barW }} />
                  </span>
                ) : (
                  <span className="crf-wedge crf-wedge--none" aria-hidden />
                )}
                <span style={{ minWidth: 0 }}>
                  <b>{r.name}</b>
                  <span className="crf-trow__weight">{r.weight}</span>
                </span>
              </span>

              <span className="crf-trow__practice">
                {r.practice}
                {r.hasCov ? (
                  <span className="crf-bar crf-bar--cov" aria-hidden>
                    <span className="crf-bar__fill" style={{ width: r.covPct }} />
                  </span>
                ) : null}
              </span>

              <span className="crf-trow__band">
                {r.hasBand ? (
                  <>
                    <span
                      className="crf-pill"
                      style={{
                        background: `var(--cjm-${r.bandBg})`,
                        border: `1px solid var(--cjm-${r.bandBorder})`,
                        color: `var(--cjm-${r.bandTone})`,
                      }}
                    >
                      {r.band}
                    </span>
                    <span className="crf-trow__num">{r.num}%</span>
                  </>
                ) : (
                  <span className="crf-trow__nonote">{r.bandNote}</span>
                )}
              </span>

              <span className="crf-trow__last">{r.last}</span>

              <span className="crf-trow__next">
                <button
                  type="button"
                  className={r.isPrimary ? 'crf-btn crf-btn--primary' : 'crf-btn'}
                  onClick={go(r.name === 'Exam Simulator' ? 'exam-simulator' : 'practice')}
                >
                  {r.action}
                </button>
                {/* ⚠ NO CHEVRON ON THE SIMULATOR ROW — his `noExpand`. */}
                {r.canExpand ? (
                  <button
                    type="button"
                    className="crf-chev"
                    aria-expanded={expanded}
                    aria-label={expanded ? r.collapseLabel : r.expandLabel}
                    onClick={() => setOpen((o) => ({ ...o, [r.name]: !expanded }))}
                  >
                    <ChevronDown
                      size={14}
                      aria-hidden
                      style={{ transform: expanded ? 'rotate(180deg)' : undefined }}
                    />
                  </button>
                ) : (
                  <span className="crf-chev crf-chev--none" />
                )}
              </span>
            </div>

            {expanded && r.subs.length ? (
              <div className="crf-subs">
                <p className="crf-subs__eyebrow">{COPY.subEyebrow}</p>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {r.subs.map((s) => (
                    <li className="crf-sub" key={s.name}>
                      <span className="crf-sub__name">{s.name}</span>
                      <span className="crf-sub__note" style={{ color: `var(--cjm-${s.noteTone})` }}>
                        {s.note}
                      </span>
                      <span className="crf-sub__bar" aria-hidden>
                        {s.segs.map((g, i) => (
                          <span
                            key={i}
                            style={{ flex: `${g.flex} 1 0`, height: g.height, background: `var(--cjm-${g.tone})` }}
                          />
                        ))}
                      </span>
                      <span className="crf-sub__band">
                        {s.band} <b>{s.num}</b>
                      </span>
                      {s.rubi ? (
                        <span className="crf-sub__when">
                          <span>
                            {COPY.aboutMins} {s.mins}
                          </span>
                          {COPY.startHere}
                        </span>
                      ) : (
                        <span />
                      )}
                      {/* ⚠ EVERY SUB-ROW GETS A PRACTICE BUTTON. What differs
                          is fill and destination: the weakest one is filled
                          and opens a question set (`PracticeSession`), the
                          rest are outlined and open the Practice page. His
                          `rubiCta` is "Practice" on the weakest row and EMPTY
                          on the others — rendering it directly drops the
                          button from two rows out of three, which is how this
                          first ran. */}
                      <button
                        type="button"
                        className={s.rubi ? 'crf-btn crf-btn--primary' : 'crf-btn'}
                        aria-label={`Practice ${s.name}`}
                        onClick={go(s.rubi ? 'practice-session' : 'practice')}
                      >
                        {COPY.subCta}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}

/* ---------------- the Course progress table ---------------- */

function ProgressTable({
  open,
  setOpen,
}: {
  open: Record<string, boolean>
  setOpen: (f: (o: Record<string, boolean>) => Record<string, boolean>) => void
}) {
  return (
    <div className="crf-table">
      <div className="crf-table__row crf-table__head crf-table__row--p">
        {COPY.progressCols.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      {OV.progress.rows.map((r) => {
        const expanded = open['l:' + r.name] ?? false
        return (
          <article key={r.name} className={expanded ? 'crf-trow is-open' : 'crf-trow'}>
            <div className="crf-table__row crf-table__row--p">
              <span className="crf-trow__name">
                <span style={{ minWidth: 0 }}>
                  <b>{r.name}</b>
                  <span className="crf-trow__weight">{r.weight}</span>
                </span>
              </span>
              <span className="crf-trow__practice">
                <span style={{ color: `var(--cjm-${r.tone})`, fontWeight: 600 }}>{r.lessons}</span>
                {/* ⚠ THE PERCENTAGE IS TEXT BESIDE THE BAR, not just the bar's
                    width. His row reads "8 of 8 · complete" over a 140px
                    track followed by "100%". Drawing the bar alone loses the
                    number from five rows. */}
                <span className="crf-lbar" role="img" aria-label={r.aria}>
                  <span className="crf-lbar__track">
                    <span
                      className="crf-lbar__fill"
                      style={{ width: r.pct, background: `var(--cjm-${r.barTone})` }}
                    />
                  </span>
                  <b style={{ color: `var(--cjm-${r.tone})` }}>{r.pct}</b>
                </span>
              </span>
              <span className="crf-trow__next">
                {/* ⚠ `isText` — a completed topic's "Review" is PLAIN TEXT in
                    his table, not a button; only the in-progress rows get a
                    control. */}
                {r.isText ? (
                  <span className="crf-trow__plain">{r.action}</span>
                ) : (
                  <button type="button" className="crf-btn">
                    {r.action}
                  </button>
                )}
                {r.canExpand ? (
                  <button
                    type="button"
                    className="crf-chev"
                    aria-expanded={expanded}
                    aria-label={expanded ? r.collapseLabel : r.expandLabel}
                    onClick={() => setOpen((o) => ({ ...o, ['l:' + r.name]: !expanded }))}
                  >
                    <ChevronDown
                      size={14}
                      aria-hidden
                      style={{ transform: expanded ? 'rotate(180deg)' : undefined }}
                    />
                  </button>
                ) : (
                  <span className="crf-chev crf-chev--none" />
                )}
              </span>
            </div>
            {expanded && r.lessonList.length ? (
              <ul className="crf-llist">
                {r.lessonList.map((l) => (
                  <li key={l.label}>
                    <span className="crf-dot" style={{ background: `var(--cjm-${l.tone})` }} aria-hidden />
                    <span className="crf-llist__label">{l.label}</span>
                    <span className="crf-llist__status" style={{ color: `var(--cjm-${l.tone})` }}>
                      {l.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}

/* ---------------- the two rings ---------------- */

/** Three arcs, outside in: simulator · practice · Readiness. His order, and
 *  the caption under the card says it so a reviewer can check. */
function ReadinessRings() {
  return (
    <div className="crf-rings">
      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <svg viewBox="0 0 168 168" width="200" height="200" role="img" aria-label={COPY.ringAria}>
          <g transform="rotate(-90 84 84)">
            {COPY.ringArcs.map((a) => (
              <g key={a.r}>
                <circle cx="84" cy="84" r={a.r} fill="none" stroke="var(--cjm-ring-cool)" strokeWidth="9" />
                <circle
                  cx="84"
                  cy="84"
                  r={a.r}
                  fill="none"
                  stroke={`var(--cjm-${a.tone})`}
                  strokeWidth="9"
                  strokeDasharray={a.dash}
                  strokeLinecap={a.cap as 'butt' | 'round'}
                />
              </g>
            ))}
          </g>
        </svg>
        <span className="crf-rings__band" aria-hidden>
          <span className="crf-pill crf-pill--band">{COPY.readyBand}</span>
        </span>
      </div>
    </div>
  )
}

function LessonRing() {
  return (
    <div className="crf-lessonring">
      <div style={{ position: 'relative', width: 128, height: 128 }}>
        <svg viewBox="0 0 120 120" width="128" height="128" role="img" aria-label={COPY.progressRingAria}>
          <g transform="rotate(-90 60 60)">
            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--cjm-ring-pale)" strokeWidth="12" />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="var(--cjm-steel)"
              strokeWidth="12"
              strokeDasharray={COPY.progressRingDash}
              strokeLinecap="round"
            />
          </g>
        </svg>
        <span className="crf-lessonring__mid" aria-hidden>
          <b>{COPY.progressPct}</b>
          <span>{COPY.progressWord}</span>
        </span>
      </div>
    </div>
  )
}
