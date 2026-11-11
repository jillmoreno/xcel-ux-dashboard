import { useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronRight,
  CircleSolid,
  FileText,
  LifeRing,
  RubiLogo,
} from '@/icons'
import { JEFF_MVP_PREP as PREP, JEFF_MVP_PREP_COPY as COPY } from '@/data/compassJeffMvpFixtures'
import { CompassRefinedColumn, CompassRefinedHead } from './CompassRefinedChrome'
import './compassRefined.css'

/**
 * JEFF'S PREP REVIEW — 2026-11-09, the fifth page ported and the first of his
 * EXAM PREP group.
 *
 * Learn's cousin, and deliberately not Learn: six chapters with an exam after
 * most of them, and NOTHING LOCKED. His lead is the whole difference —
 * "Optional review before your state exam. Every chapter and review exam is
 * open, so take them in any order."
 *
 * ⚠ ONE FLAT LIST, NOT CHAPTERS WITH EXAMS NESTED INSIDE. His rows interleave
 * the two as siblings, which is why Chapter 5 simply has no exam row: five
 * exams for six chapters. Nesting them the way Learn does would force an
 * empty exam slot onto that chapter, and the only thing to put in it would be
 * something he did not write.
 *
 * ⚠ AN EXAM ROW DRAWS NO CHEVRON. His gives it an empty lesson list and a
 * no-op toggle; a disclosure that opens onto nothing is worse than none.
 *
 * ⚠ NOTHING HERE IS LOCKED, so there is no lock message and no padlock. If a
 * later pass finds itself reaching for Learn's locked styling on this page,
 * that is the signal it has misread which page it is on.
 */
export function CompassRefinedPrep() {
  const [open, setOpen] = useState<Record<number, boolean>>({})
  const isOpen = (n: number, fallback: boolean) => open[n] ?? fallback

  return (
    <div className="crf-page">
      <button type="button" className="crf-ask">
        <RubiLogo size={17} aria-hidden />
        Ask Rubi
      </button>
      <CompassRefinedColumn>
        {/* ⚠ COURSE LINE ABOVE THE LEAD, as his orders them — so both go in
            `below` rather than one through the Head's own `lead` slot, which
            renders first. Practice has the same order for the same reason. */}
        <CompassRefinedHead
          title={COPY.title}
          below={
            <>
              <p className="crf-lead">{COPY.lead}</p>
            </>
          }
        />

        {/* ---------- where you left off ---------- */}
        <section className="crf-resume" aria-label={COPY.resumeEyebrow}>
          <span className="crf-resume__thumb" aria-hidden>
            <span className="crf-resume__play">
              <ChevronRight size={14} />
            </span>
          </span>
          <div className="crf-resume__text">
            <p className="crf-eyebrow">{COPY.resumeEyebrow}</p>
            <p className="crf-resume__title">{COPY.resumeTitle}</p>
          </div>
          <button type="button" className="crf-cta">
            {COPY.resumeCta}
            <ChevronRight size={13} aria-hidden />
          </button>
        </section>

        {/* ---------- the review card ---------- */}
        <section className="crf-course" aria-label={COPY.cardTitle}>
          <header className="crf-course__head">
            <span className="crf-tile" aria-hidden>
              <LifeRing size={16} />
            </span>
            <div className="crf-course__name">
              <p className="crf-eyebrow">{COPY.cardEyebrow}</p>
              <div className="crf-prep__titlerow">
                <h2 className="crf-h2">{COPY.cardTitle}</h2>
                {/* ⚠ THE WHOLE POINT OF THE PAGE, in one pill. */}
                <span className="crf-pill crf-pill--optional">{COPY.optionalPill}</span>
              </div>
            </div>
            <div className="crf-course__stat">
              <span className="crf-prep__band">{COPY.band}</span>
              <span className="crf-course__of">{COPY.chaptersDone}</span>
            </div>
            <div className="crf-course__ring">
              <div style={{ position: 'relative', width: 72, height: 72 }}>
                <svg viewBox="0 0 120 120" width="72" height="72" role="img" aria-label={COPY.ringAria}>
                  <g transform="rotate(-90 60 60)">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="var(--cjm-ring-pale)" strokeWidth="12" />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="var(--cjm-steel)"
                      strokeWidth="12"
                      strokeDasharray={COPY.ringDash}
                      strokeLinecap="round"
                    />
                  </g>
                </svg>
                <span className="crf-course__pct" aria-hidden>
                  {COPY.ringPct}
                </span>
              </div>
            </div>
          </header>

          {PREP.rows.map((r, i) =>
            r.kind === 'exam' ? (
              <div className="crf-exam crf-exam--flat" key={`exam-${i}`}>
                <span className="crf-tile crf-tile--exam" aria-hidden>
                  <FileText size={15} />
                </span>
                <div className="crf-exam__name">
                  <p className="crf-exam__eyebrow">{COPY.examEyebrow}</p>
                  <p className="crf-exam__title">{r.title}</p>
                </div>
                {/* ⚠ OPEN, NOT LOCKED — no padlock, no disabled state. This is
                    the page where every exam can be taken now. */}
                <button type="button" className="crf-btn" aria-label={r.actionLabel}>
                  {COPY.examCta}
                </button>
              </div>
            ) : (
              <article
                key={`ch-${r.n}`}
                className={`crf-ch${r.inProgress ? ' crf-ch--current' : ''}${
                  isOpen(r.n, r.expanded) ? ' is-open' : ''
                }`}
              >
                <div className="crf-ch__row">
                  <span className="crf-tile crf-tile--mark" aria-hidden>
                    {r.inProgress ? <ChevronRight size={15} /> : <CircleSolid size={8} />}
                  </span>
                  <div className="crf-ch__name">
                    <p className="crf-ch__eyebrow" style={{ color: `var(--cjm-${r.eyebrowTone})` }}>
                      {r.eyebrow}
                    </p>
                    <p className="crf-ch__title">{r.title}</p>
                    {r.inProgress ? (
                      <span className="crf-bar crf-bar--ch" role="img" aria-label={r.progAria}>
                        <span className="crf-bar__fill" style={{ width: r.progPct }} />
                      </span>
                    ) : null}
                  </div>
                  <span className="crf-ch__status" style={{ color: `var(--cjm-${r.statusTone})` }}>
                    {r.status}
                  </span>
                  <button
                    type="button"
                    className={r.inProgress ? 'crf-btn crf-btn--primary' : 'crf-btn'}
                    aria-label={r.actionLabel}
                  >
                    {r.action}
                  </button>
                  <button
                    type="button"
                    className="crf-chev"
                    aria-expanded={isOpen(r.n, r.expanded)}
                    aria-label={isOpen(r.n, r.expanded) ? r.collapseLabel : r.expandLabel}
                    onClick={() => setOpen((o) => ({ ...o, [r.n]: !isOpen(r.n, r.expanded) }))}
                  >
                    <ChevronDown
                      size={14}
                      aria-hidden
                      style={{ transform: isOpen(r.n, r.expanded) ? 'rotate(180deg)' : undefined }}
                    />
                  </button>
                </div>
                {isOpen(r.n, r.expanded) ? (
                  <div className="crf-ch__body">
                    <ul className="crf-lessons">
                      {r.lessons.map((l) => (
                        <li key={l.label} className={`crf-lesson crf-lesson--${l.state}`}>
                          <span className="crf-lesson__mark" aria-hidden>
                            {l.state === 'done' ? (
                              <Check size={13} />
                            ) : l.state === 'current' ? (
                              <CircleSolid size={8} />
                            ) : (
                              <CircleSolid size={6} />
                            )}
                          </span>
                          <span className="crf-lesson__label">{l.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            ),
          )}
        </section>
      </CompassRefinedColumn>
    </div>
  )
}
