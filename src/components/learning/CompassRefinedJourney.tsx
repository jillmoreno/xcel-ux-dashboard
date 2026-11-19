import { useState } from 'react'
import { useAccount } from '@/context/AccountContext'
import { REFINED_COURSE, REFINED_OVERVIEW_TITLE, refinedAccessDaysLabel } from '@/data/compassRefinedCopy'
import { CompassRefinedFocus } from './CompassRefinedFocus'
import { FOCUS_DEFAULTS, type FocusOptions } from './compassRefinedFocusModel'
import { REFINED_RUBI_INTRO } from '@/data/compassRefinedCopy'
import { CircleCheck, Clock, FileText, RubiLogo } from '@/icons'
import { PathLine, ReadinessRing } from './CompassRefinedParts'
import {
  journeyStage,
  type Hero as HeroModel,
  type JourneyModel,
  type PathRow,
  type Prog,
  type Ring,
} from './compassReadinessModel'
import { CompassRefinedRubiToast } from './CompassRefinedRubiToast'
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
  focus = FOCUS_DEFAULTS,
}: {
  stage?: string
  /** Every design decision open on the first widget, as one object — see
   *  `FocusOptions`. Passed in, so this stays a plain function of its
   *  props. */
  focus?: FocusOptions
}) {
  const m = journeyStage(stage)
  const accessDays = refinedAccessDaysLabel()
  /* ⚠ RUBI'S FIRST-RUN TOAST — 2026-11-11. Shown at 0% in the Ask Rubi
     pill's place; dismissing hands the corner back to the pill, which is
     also how a learner finds out where she lives. The gate is the same
     arithmetic the card opposite uses, so the toast and the day-one pace
     note appear and go together. */
  const [rubiToast, setRubiToast] = useState(true)
  const atStart = (Number.parseFloat(m.prog?.pct ?? '0') || 0) === 0
  /* ⚠ THE TAB STATE WENT WITH THE TABLE — 2026-11-11. `tab`, `activeTab`,
     `showPrep` and `showStd` existed only to pick which of his two topic
     tables drew and which tab was lit; with the section unwired they were
     state nothing read. `m.tabs`, `m.rows` and `m.prows` are untouched in
     the model, so they come back with the JSX. */

  return (
    <div className="crf-rd" data-stage={m.stage}>
      {/* ⚠ THE FLOATING ASK RUBI, AS THE MVP PAGES CARRY IT — 2026-11-11:
          "this should also be on the overview page." Every other Refined page
          has it top right; the Overview was the one that did not, so the way
          to reach her moved depending on which page you were on. The Rubi
          CARD further down is a different offer — an introduction, or a
          suggestion — and neither is "I have a question now". */}
      {atStart && rubiToast ? (
        <CompassRefinedRubiToast onDismiss={() => setRubiToast(false)} />
      ) : (
        <button type="button" className="crf-ask crf-rd-ask-float">
          <RubiLogo size={17} aria-hidden />
          Ask Rubi
        </button>
      )}
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
          {/* ⚠ HOW LONG IS LEFT — 2026-11-12: "add another data point
              after this that shows how many days remaining until access
              ends." Counted from the date in the line before it, not
              typed beside it; absent once that date has passed. */}
          {accessDays ? (
            <>
              <span className="crf-rd-brow__dot" aria-hidden>
                ·
              </span>
              <span className="crf-rd-brow__access">{accessDays}</span>
            </>
          ) : null}
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
            options={focus}
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

      {/* ⚠ "YOUR LESSONS BY TOPIC" IS UNWIRED — 2026-11-11, "remove this
          section for now." The table, its tabs and the expandable topic rows
          came out together; `m.tableTitle`, `m.summary`, `m.tableNote`,
          `m.rows`, `m.prows` and `m.tabs` are all still in the model, and the
          block is one `git show` away — it was the only thing between the
          Rubi card and the gate line. FOR NOW is the operative half: nothing
          about the data or the stage fixtures changed, so restoring it is
          putting the JSX back, not rebuilding it. */}

      {/* ⚠ THE GATE LINE IS UNWIRED — 2026-11-11, "remove". It read
          "Lessons open in order. Exam Prep and Readiness open after your
          certificate. Nothing on this page grades you during the course." —
          three rules in one sentence, closing a page that no longer carries
          the table those rules were written over. `m.gate` is untouched in
          every stage fixture, so it comes back with one line. */}
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
  /* ⚠ THE NAME COMES FROM THE ACCOUNT, not a prop — 2026-11-11. Every test
     here already wraps in `AccountProvider`, and threading a first name
     through four components to reach one greeting is the friction the focus
     options were bundled to remove. Flags stay read at the top; the learner
     is not a flag. */
  const { user } = useAccount()
  const intro = focus.label === REFINED_RUBI_INTRO.replacesLabel
  const copy = intro
    ? { ...REFINED_RUBI_INTRO, title: REFINED_RUBI_INTRO.title(user.firstName) }
    : focus
  return (
    <section className="crf-rd-rubi crf-rd-rubi--card" aria-label={copy.label}>
      <p className="crf-rd-eyebrow crf-rd-rubi-eyebrow">
        <RubiLogo size={15} aria-hidden />
        {copy.label}
      </p>
      {/* ⚠ ONE ROW, NOT FOUR BLOCKS — 2026-11-11, from the mock: the title,
          the body and the actions across a single line under the eyebrow. The
          stacked card spent four full-width blocks on what is, on most
          states, one sentence and one button. */}
      <div className="crf-rd-rubi-row">
      <h3 className="crf-rd-rubi-title">{copy.title}</h3>
      <p className="crf-rd-rubi-why">{copy.why}</p>
      <div className="crf-rd-rubi-actions">
        <button type="button" className="crf-rd-rubi-cta">
          {copy.cta}
        </button>
        {/* ⚠ NO "Not now" HERE — 2026-11-11, "remove the not now link". It
            belonged on the TOAST, which interrupts and therefore has to be
            dismissible. This band is part of the page: there is nothing to
            decline, and a decline that only hides a section a learner did not
            ask to see is a control for the sake of symmetry. The toast keeps
            its own. */}
      </div>
      </div>
    </section>
  )
}
