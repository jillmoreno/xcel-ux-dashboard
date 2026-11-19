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
import { CompassJeffMvpColumn, CompassJeffMvpHead } from './CompassJeffMvpShell'
import './compassJeffMvp.css'

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
export function CompassJeffMvpPrep() {
  const [open, setOpen] = useState<Record<number, boolean>>({})
  const isOpen = (n: number, fallback: boolean) => open[n] ?? fallback

  return (
    <div className="cjm-page">
      <button type="button" className="cjm-ask">
        <RubiLogo size={17} aria-hidden />
        Ask Rubi
      </button>
      <CompassJeffMvpColumn>
        {/* ⚠ COURSE LINE ABOVE THE LEAD, as his orders them — so both go in
            `below` rather than one through the Head's own `lead` slot, which
            renders first. Practice has the same order for the same reason. */}
        <CompassJeffMvpHead
          title={COPY.title}
          below={
            <>
              <p className="cjm-ov__course cjm-prep__course">{COPY.course}</p>
              <p className="cjm-lead">{COPY.lead}</p>
            </>
          }
        />

        {/* ---------- where you left off ---------- */}
        <section className="cjm-resume" aria-label={COPY.resumeEyebrow}>
          <span className="cjm-resume__thumb" aria-hidden>
            <span className="cjm-resume__play">
              <ChevronRight size={14} />
            </span>
          </span>
          <div className="cjm-resume__text">
            <p className="cjm-eyebrow">{COPY.resumeEyebrow}</p>
            <p className="cjm-resume__title">{COPY.resumeTitle}</p>
          </div>
          <button type="button" className="cjm-cta">
            {COPY.resumeCta}
            <ChevronRight size={13} aria-hidden />
          </button>
        </section>

        {/* ---------- the review card ---------- */}
        <section className="cjm-course" aria-label={COPY.cardTitle}>
          <header className="cjm-course__head">
            <span className="cjm-tile" aria-hidden>
              <LifeRing size={16} />
            </span>
            <div className="cjm-course__name">
              <p className="cjm-eyebrow">{COPY.cardEyebrow}</p>
              <div className="cjm-prep__titlerow">
                <h2 className="cjm-h2 cjm-serif">{COPY.cardTitle}</h2>
                {/* ⚠ THE WHOLE POINT OF THE PAGE, in one pill. */}
                <span className="cjm-pill cjm-pill--optional">{COPY.optionalPill}</span>
              </div>
            </div>
            <div className="cjm-course__stat">
              <span className="cjm-prep__band">{COPY.band}</span>
              <span className="cjm-course__of">{COPY.chaptersDone}</span>
            </div>
            <div className="cjm-course__ring">
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
                <span className="cjm-course__pct cjm-serif" aria-hidden>
                  {COPY.ringPct}
                </span>
              </div>
            </div>
          </header>

          {PREP.rows.map((r, i) =>
            r.kind === 'exam' ? (
              <div className="cjm-exam cjm-exam--flat" key={`exam-${i}`}>
                <span className="cjm-tile cjm-tile--exam" aria-hidden>
                  <FileText size={15} />
                </span>
                <div className="cjm-exam__name">
                  <p className="cjm-exam__eyebrow">{COPY.examEyebrow}</p>
                  <p className="cjm-exam__title">{r.title}</p>
                </div>
                {/* ⚠ OPEN, NOT LOCKED — no padlock, no disabled state. This is
                    the page where every exam can be taken now. */}
                <button type="button" className="cjm-btn" aria-label={r.actionLabel}>
                  {COPY.examCta}
                </button>
              </div>
            ) : (
              <article
                key={`ch-${r.n}`}
                className={`cjm-ch${r.inProgress ? ' cjm-ch--current' : ''}${
                  isOpen(r.n, r.expanded) ? ' is-open' : ''
                }`}
              >
                <div className="cjm-ch__row">
                  <span className="cjm-tile cjm-tile--mark" aria-hidden>
                    {r.inProgress ? <ChevronRight size={15} /> : <CircleSolid size={8} />}
                  </span>
                  <div className="cjm-ch__name">
                    <p className="cjm-ch__eyebrow" style={{ color: `var(--cjm-${r.eyebrowTone})` }}>
                      {r.eyebrow}
                    </p>
                    <p className="cjm-ch__title">{r.title}</p>
                    {r.inProgress ? (
                      <span className="cjm-bar cjm-bar--ch" role="img" aria-label={r.progAria}>
                        <span className="cjm-bar__fill" style={{ width: r.progPct }} />
                      </span>
                    ) : null}
                  </div>
                  <span className="cjm-ch__status" style={{ color: `var(--cjm-${r.statusTone})` }}>
                    {r.status}
                  </span>
                  <button
                    type="button"
                    className={r.inProgress ? 'cjm-btn cjm-btn--primary' : 'cjm-btn'}
                    aria-label={r.actionLabel}
                  >
                    {r.action}
                  </button>
                  <button
                    type="button"
                    className="cjm-chev"
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
                  <div className="cjm-ch__body">
                    <ul className="cjm-lessons">
                      {r.lessons.map((l) => (
                        <li key={l.label} className={`cjm-lesson cjm-lesson--${l.state}`}>
                          <span className="cjm-lesson__mark" aria-hidden>
                            {l.state === 'done' ? (
                              <Check size={13} />
                            ) : l.state === 'current' ? (
                              <CircleSolid size={8} />
                            ) : (
                              <CircleSolid size={6} />
                            )}
                          </span>
                          <span className="cjm-lesson__label">{l.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            ),
          )}
        </section>
      </CompassJeffMvpColumn>
    </div>
  )
}
