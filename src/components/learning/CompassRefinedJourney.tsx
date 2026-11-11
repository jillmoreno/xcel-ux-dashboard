import { REFINED_COURSE, REFINED_OVERVIEW_TITLE } from '@/data/compassRefinedCopy'
import { CompassRefinedFocus, type FocusLayout } from './CompassRefinedFocus'
import { REFINED_RUBI_INTRO } from '@/data/compassRefinedCopy'
import { useState } from 'react'
import { CircleCheck, Clock, FileText, RubiLogo } from '@/icons'
import { PathLine, ReadinessRing, TopicTable } from './CompassRefinedParts'
import {
  journeyStage,
  type Hero as HeroModel,
  type JourneyModel,
  type PathRow,
  type Prog,
  type Ring,
  type TopicRow,
} from './compassReadinessModel'
import './compassRefinedJourney.css'

/**
 * "YOUR LEARNING JOURNEY" — his `JOverview`, ported 2026-11-05.
 *
 * Thirteen of his sixteen states: the eight QE course stages and the five
 * unified ones.
 *
 * ⚠ THE PAGE ARGUES ONE THING: lessons and practice are TWO SIGNALS, not one
 * progress bar. Course progress comes from lessons; Readiness comes from Exam
 * Prep practice; neither feeds the other. His gate line says it at the foot of
 * every stage, the two rings say it side by side, and the tab strip says it
 * again by making you choose which one you are looking at.
 *
 * ⚠ READINESS DOES NOT EXIST UNTIL THE CERTIFICATE. Stages q1–q7 have no
 * Readiness at all — not zero, absent — and q8 is the moment it appears. That
 * is the prototype's first claim and the easiest thing to lose in a port that
 * renders a 0% ring instead of no ring.
 *
 * ⚠ TWO LAYOUTS, HIS. The `q` stages draw the QE strip: one progress ring and
 * the four regulated steps. The `u` stages draw the pair — Readiness to pass
 * beside Your course progress — and, from u3, a tab strip over the table.
 */
export function CompassRefinedJourney({
  stage = 'u3',
  layout = 'split',
}: {
  stage?: string
  /** `compass-overview-focus` — which of the three arrangements of Course
   *  Progress and Your Next Step draws. Passed in, so this stays a plain
   *  function of its props. */
  layout?: FocusLayout
}) {
  const m = journeyStage(stage)
  const [tab, setTab] = useState(0)
  const tabs = m.tabs ?? []
  /* His tabs carry their own selected flag; a click moves it. */
  const activeTab = tabs.length ? tab : 0
  const showPrep = m.prepTable && (!tabs.length || activeTab === 0)
  const showStd = m.stdTable || (tabs.length > 0 && activeTab === 1)

  return (
    <div className="crf-rd" data-stage={m.stage}>
      {/* ⚠ A REAL `header`, holding the eyebrow and the title and nothing
          else — 2026-11-10. These pages drew both as loose paragraphs in
          the page, so there was no element that WAS the header and nothing
          to keep copy out of it. */}
      <header className="crf-rd-head">
        {/* ⚠ THE COURSE EYEBROW — 2026-11-10. It is the FIRST thing on
            the page, above the greeting: an eyebrow labels the page, and the
            greeting is addressed to the learner. Below the greeting it read as
            a third stacked line of header rather than the context for it. */}
        <p className="crf-rd-brow">
          <span>{REFINED_COURSE.name}</span>
          <span className="crf-rd-brow__dot" aria-hidden>
            ·
          </span>
          <span className="crf-rd-brow__access">{REFINED_COURSE.access}</span>
        </p>
          <h1 className="serif crf-rd-h1">{REFINED_OVERVIEW_TITLE}</h1>
        </header>
      {/* ⚠ THE GREETING AND THE META ROW ARE GONE — 2026-11-11,
          Jillienne on both: "these 2 lines also fall into that catagory of
          not needed." They were the last copy standing between the header
          and the page, moved below the title the day before rather than
          removed; this finishes it. Every fact they carried is on the page
          already — the readiness figure in the Readiness-to-Pass panel, the
          exam date in the ring's own read-out, the certificate in the
          evidence list — so the row was a summary of the screen under it.
          `m.hello`, `m.metaLine`, `m.phase` and `m.pathway` stay in the
          shared model: the current version still draws them. */}

      {/* ⚠ THE BANNER IS A TEACHING MOMENT, not decoration: it appears only
          where the rules of the surface change (u1, when open access starts;
          u5, when booking opens). */}
      {m.hasBanner && m.banner?.items?.length ? (
        <section className="crf-rd-banner" aria-label={m.banner.eyebrow}>
          <p className="crf-rd-eyebrow">{m.banner.eyebrow}</p>
          <ol>
            {m.banner.items.map((it) => (
              <li key={it.n}>
                <b>{it.n}</b>
                <span>{it.text}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {/* ⚠ THE HERO AND THE COURSE-PROGRESS CARD ARE ONE COMPONENT ON THE
          COURSE SERIES — 2026-11-11, Jillienne: "these 2 components should be
          redesigned into 1 simple component that shows the Course Progress on
          the left, and the Your Next Step on the right."

          ⚠ ONLY ON THIS BRANCH. The unified (`uLayout`) states pair the
          progress ring with the READINESS panel instead — a different
          composition answering a different question — so the hero stays its
          own card there until somebody decides otherwise. Merging both on one
          reading of the ask would have been two changes under one sentence. */}
      {m.uLayout ? (
        <>
          {m.hero?.title ? <Hero hero={m.hero} /> : null}
          <div className="crf-rd-pair">
            <section className="crf-rd-ready" aria-label="Readiness to pass">
              <ReadinessPanel m={m} />
            </section>
            <section className="crf-rd-progress" aria-label="Your course progress">
              <div className="crf-rd-ready-head">
                <span className="crf-rd-eyebrow">Your course progress</span>
                <span className="crf-rd-note">from your course lessons</span>
              </div>
              <ProgressRing prog={m.prog} />
            </section>
          </div>
        </>
      ) : (
        <>
          <CompassRefinedFocus
            hero={m.hero?.title ? m.hero : undefined}
            prog={m.prog}
            layout={layout}
          />
          {/* ⚠ THE FOUR REGULATED STEPS KEEP THEIR OWN BLOCK. Lessons,
              affidavit, final exam, survey-and-certificate — their ORDER is
              the regulation, and a four-item list has no business inside a
              half-width bay beside a ring. They sit under the pair, where the
              progress story continues. */}
          {m.prog?.hasSteps && m.prog.steps?.length ? (
            <ol className="crf-rd-steps crf-rd-steps--own">
              {m.prog.steps.map((s, i) => (
                <li key={s.label} className={`is-${s.mark || 'todo'}`}>
                  <span className="crf-rd-step-n" aria-hidden>
                    {i + 1}
                  </span>
                  <span>
                    <b style={{ color: `var(--rd-${s.color})` }}>{s.label}</b>
                    <span className="crf-rd-step-status" style={{ color: `var(--rd-${s.stColor})` }}>
                      {s.status}
                    </span>
                    {s.detail && <span className="crf-rd-note">{s.detail}</span>}
                  </span>
                </li>
              ))}
            </ol>
          ) : null}
        </>
      )}

      {/* ⚠ READINESS APPEARS AT Q8, AND HIS DATA SAYS SO: `uPath` is empty
          through q1–q7 and carries its five measures from q8 on. So the panel
          is drawn when there is a path to draw — not when a stage flag says
          to — and "Readiness does not exist yet" needs no special case. */}
      {!m.uLayout && (m.uPath?.length ?? 0) > 0 ? (
        <section className="crf-rd-qe crf-rd-ready--intro" aria-label="Readiness to pass">
          <ReadinessPanel m={m} />
        </section>
      ) : null}

      {/* ---- Rubi and the tools ---- */}
      {(m.focus?.title || m.tools?.length) && (
        <div className="crf-rd-focus-row">
          {m.focus?.title ? (
            <RubiBlock focus={m.focus} />
          ) : null}
          {m.tools?.length ? (
            <section className="crf-rd-tools" aria-label={m.toolsTitle}>
              <p className="crf-rd-eyebrow">{m.toolsTitle}</p>
              <div className="crf-rd-tools-row">
                {m.tools.map((t) => (
                  <div className="crf-rd-tool" key={t.name}>
                    <span className="crf-rd-tool-icon" aria-hidden>
                      {t.icon === 'clock' ? <Clock size={16} /> : t.icon === 'cards' ? <FileText size={16} /> : <CircleCheck size={16} />}
                    </span>
                    <b>{t.name}</b>
                    <span className="crf-rd-note">{t.desc}</span>
                    <span className="crf-rd-tool-status" style={{ color: `var(--rd-${t.statusColor})` }}>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      {/* ---- the table, with his tabs over it ---- */}
      <section className="crf-rd-table" aria-label={m.tableTitle}>
        {tabs.length > 0 && (
          /* ⚠ THE TABS ARE THE ARGUMENT MADE INTERACTIVE: you cannot see both
             signals at once, because they are not one thing. */
          <div className="crf-rd-tabs" role="tablist">
            {tabs.map((t, i) => (
              <button
                key={t.label}
                type="button"
                role="tab"
                aria-selected={i === activeTab}
                className={`crf-rd-tab${i === activeTab ? ' is-on' : ''}`}
                onClick={() => setTab(i)}
              >
                <b>{t.label}</b>
                <span className="crf-rd-note">{t.sub}</span>
              </button>
            ))}
          </div>
        )}
        <div className="crf-rd-table-head">
          <div>
            <h2 className="crf-rd-h2">{showStd && tabs.length ? 'Your lessons by topic' : m.tableTitle}</h2>
            <p className="crf-rd-summary">{m.summary}</p>
          </div>
          <p className="crf-rd-note">{m.tableNote}</p>
        </div>
        {showPrep && !showStd ? (
          <TopicTable rows={(m.prows ?? []) as TopicRow[]} variant="prep" />
        ) : (
          <TopicTable
            rows={(m.rows ?? []) as TopicRow[]}
            variant="lessons"
            colLessons={m.colLessons !== false}
            colReady={!!m.colReady}
          />
        )}
      </section>

      <p className="crf-rd-gate">{m.gate}</p>
    </div>
  )
}

/**
 * THE READINESS PANEL, in both of its states. The ring appears only once
 * there is something to draw; the legend and the basis line stay either way,
 * because the panel's job is to say what Readiness is MADE of — which is
 * exactly what a learner with none of it needs to read.
 */
function ReadinessPanel({ m }: { m: JourneyModel }) {
  return (
    <>
      {/* ⚠ THE CAPTION DIFFERS BY LAYOUT, and both are his: beside the course
          ring the panel says where the number comes FROM ("from Exam Prep
          practice only"), because the contrast with the other ring is the
          point; standing alone at q8 it offers the explainer instead. */}
      <div className="crf-rd-ready-head">
        <span className="crf-rd-eyebrow">Readiness to pass</span>
        {m.uLayout ? (
          <span className="crf-rd-note">from Exam Prep practice only</span>
        ) : (
          <button type="button" className="crf-rd-quiet">How is this figured?</button>
        )}
      </div>
      {!m.uReady?.has && <p className="crf-rd-empty">{m.ready?.noneSub ?? 'Not enough data yet.'}</p>}
      <div className="crf-rd-ready-body">
        {m.uReady?.has ? <ReadinessRing ring={m.uReady as Ring} /> : null}
        <ul className="crf-rd-path">
          {(m.uPath ?? ([] as PathRow[])).map((p) => (
            <PathLine key={p.label} row={p} />
          ))}
        </ul>
      </div>
      {m.uBasis && <p className="crf-rd-basis">{m.uBasis}</p>}
    </>
  )
}

function Hero({ hero }: { hero: HeroModel }) {
  return (
    <section
      className="crf-rd-next"
      aria-label={hero.eyebrow || 'Your next step'}
      style={{ borderColor: `var(--rd-${hero.border})`, background: `var(--rd-${hero.bg})` }}
    >
      <div>
        <p className="crf-rd-eyebrow" style={{ color: `var(--rd-${hero.color})` }}>
          {hero.eyebrow}
        </p>
        <h2 className="crf-rd-next-title">{hero.title}</h2>
        {hero.sub && <p className="crf-rd-next-sub">{hero.sub}</p>}
      </div>
      <div className="crf-rd-next-aside">
        <p className="crf-rd-label">{hero.nextLabel}</p>
        <p>
          <b>{hero.next}</b>
        </p>
        <p className="crf-rd-note">{hero.meta}</p>
      </div>
      <div className="crf-rd-next-cta">
        {hero.cta && (
          <button type="button" className="crf-rd-primary" style={{ background: `var(--rd-${hero.ctaBg})` }}>
            {hero.cta}
          </button>
        )}
        {hero.alt && <button type="button" className="crf-rd-quiet">{hero.alt}</button>}
      </div>
    </section>
  )
}

/**
 * THE COURSE-PROGRESS RING — one arc, his dasharray, with the count beside it.
 * ⚠ A DIFFERENT DRAWING FROM READINESS ON PURPOSE: one measure, not three, so
 * the two rings cannot be mistaken for the same kind of number.
 */
function ProgressRing({ prog }: { prog?: Prog }) {
  if (!prog) return null
  return (
    <div className="crf-rd-prog">
      <div className="crf-rd-prog-ring">
        <svg viewBox="0 0 168 168" width="150" height="150" role="img" aria-label={prog.aria}>
          <g transform="rotate(-90 84 84)">
            <circle cx="84" cy="84" r="64" fill="none" className="crf-rd-track" strokeWidth="11" />
            <circle
              cx="84"
              cy="84"
              r="64"
              fill="none"
              stroke={`var(--rd-${prog.ringColor})`}
              strokeWidth="11"
              strokeDasharray={prog.dash}
              strokeLinecap={prog.cap as 'butt' | 'round'}
            />
          </g>
        </svg>
        <span className="crf-rd-prog-num">
          <b>{prog.pct}</b>
          <span>{prog.ringLab}</span>
        </span>
      </div>
      <div className="crf-rd-prog-side">
        <p>
          <b>QE course</b>
          <span className="crf-rd-note">{prog.lessonsVal}</span>
        </p>
        {prog.note && <p className="crf-rd-note">{prog.note}</p>}
        {prog.hasSeat && <p className="crf-rd-note">{prog.seat}</p>}
      </div>
    </div>
  )
}

/**
 * RUBI — the stage's own block, or Refined's introduction.
 *
 * ⚠ THE SWAP IS BY LABEL, not by stage number. Two of the sixteen states
 * carry the introduction and the rest carry a task suggestion; matching the
 * label means a stage that gains or loses the introduction later takes the
 * right block without this file being edited. See `REFINED_RUBI_INTRO`.
 */
function RubiBlock({ focus }: { focus: { label: string; title: string; why: string; cta: string } }) {
  const intro = focus.label === REFINED_RUBI_INTRO.replacesLabel
  const copy = intro ? REFINED_RUBI_INTRO : focus
  return (
    <section className="crf-rd-rubi crf-rd-rubi--card" aria-label={copy.label}>
      <p className="crf-rd-eyebrow crf-rd-rubi-eyebrow">
        <RubiLogo size={15} aria-hidden />
        {copy.label}
      </p>
      <h3 className="crf-rd-rubi-title">{copy.title}</h3>
      <p className="crf-rd-rubi-why">{copy.why}</p>
      <div className="crf-rd-rubi-actions">
        <button type="button" className="crf-rd-rubi-cta">
          {copy.cta}
        </button>
        {/* ⚠ ONLY THE INTRODUCTION OFFERS A WAY OUT. A task suggestion that
            can be declined needs somewhere for the decline to go; an
            introduction's is simply "not now". */}
        {intro ? (
          <button type="button" className="crf-rd-rubi-quiet">
            {REFINED_RUBI_INTRO.dismiss}
          </button>
        ) : null}
      </div>
    </section>
  )
}
