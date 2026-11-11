import { REFINED_COURSE } from '@/data/compassRefinedCopy'
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
export function CompassRefinedJourney({ stage = 'u3' }: { stage?: string }) {
  const m = journeyStage(stage)
  const [tab, setTab] = useState(0)
  const tabs = m.tabs ?? []
  /* His tabs carry their own selected flag; a click moves it. */
  const activeTab = tabs.length ? tab : 0
  const showPrep = m.prepTable && (!tabs.length || activeTab === 0)
  const showStd = m.stdTable || (tabs.length > 0 && activeTab === 1)

  return (
    <div className="crf-rd" data-stage={m.stage}>
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
      <p className="crf-rd-hello">{m.hello}</p>
      <h1 className="serif crf-rd-h1">Your learning journey</h1>
      <p className="crf-rd-meta">
        <span>Life &amp; Health · Florida 2-15</span>
        <span aria-hidden>·</span>
        <span>{m.metaLine}</span>
        {/* ⚠ THE TWO PILLS GO HERE TOO — 2026-11-10, "Remove Learn + Prepare
            Pill" and "Remove open access-move freely". They were removed from
            the MVP Overview's header the same day; this page is Refined's
            Overview now, and it was drawing them again. `m.phase` and
            `m.pathway` stay in the model — this page stopped rendering them,
            which is not the same as deciding they are wrong for the version
            that still does. */}
      </p>

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

      {m.hero?.title ? <Hero hero={m.hero} /> : null}

      {/* ---- the signals ---- */}
      {m.uLayout ? (
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
      ) : (
        <section className="crf-rd-qe" aria-label="Your course progress">
          <div className="crf-rd-ready-head">
            <span className="crf-rd-eyebrow">Your course progress</span>
            {/* ⚠ "from your course lessons" — the same caption the unified
                page puts over this ring, and the other half of the sentence
                the Readiness ring carries ("from Exam Prep practice only").
                The table's own note belongs over the table. */}
            <span className="crf-rd-note">from your course lessons</span>
          </div>
          <div className="crf-rd-qe-body">
            <ProgressRing prog={m.prog} />
            {m.prog?.hasSteps && m.prog.steps?.length ? (
              /* The four regulated steps — lessons, affidavit, final exam,
                 survey and certificate. ⚠ Their ORDER is the regulation. */
              <ol className="crf-rd-steps">
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
          </div>
        </section>
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
            <section className="crf-rd-rubi crf-rd-rubi--card" aria-label={m.focus.label}>
              <p className="crf-rd-eyebrow crf-rd-rubi-eyebrow">
                <RubiLogo size={15} aria-hidden />
                {m.focus.label}
              </p>
              <h3 className="crf-rd-rubi-title">{m.focus.title}</h3>
              <p className="crf-rd-rubi-why">{m.focus.why}</p>
              <button type="button" className="crf-rd-rubi-cta">
                {m.focus.cta}
              </button>
            </section>
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
