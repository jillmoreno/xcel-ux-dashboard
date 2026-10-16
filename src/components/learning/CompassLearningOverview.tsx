import { useState } from 'react'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { ArrowRight, Check, ChevronRight, CircleInfo, Lock, RubiLogo } from '@/icons'
import {
  COMPASS_ASSIGNMENTS,
  COMPASS_DAY_ONE_ASSIGNMENTS,
  COMPASS_DAY_ONE_ASSIGNMENTS_SUMMARY,
  COMPASS_DAY_ONE_HEADER,
  COMPASS_DAY_ONE_INSIGHTS,
  COMPASS_DAY_ONE_INSIGHTS_CAPTION,
  COMPASS_DAY_ONE_INSIGHTS_HEADING,
  COMPASS_DAY_ONE_READINESS,
  COMPASS_DAY_ONE_START,
  COMPASS_ASSIGNMENTS_SUMMARY,
  COMPASS_INSIGHTS,
  COMPASS_INSIGHTS_CAPTION,
  COMPASS_OVERVIEW_HEADER,
  COMPASS_DASHBOARD_NUDGES,
  COMPASS_READINESS,
  COMPASS_READINESS_EXPLAINER,
  COMPASS_TONIGHT,
  type AssignmentState,
} from '@/data/compassLearningFixtures'
import { DOW_SHORT, fmtHM } from './compassStudyPlannerModel'
import { returnInfo, schedule, tonight, tonightOff, tonightUndo, weekItems, weekSummary } from './compassPlanStore'
import { useCompassPlan } from './compassPlanHooks'
import './compassStudyPlanner.css'
import './compassOverview.css'

/**
 * The Compass Learning overview body — Anjani's `screen-dashboard`.
 *
 * First built 2026-09-23 off the Figma frame (765:3471), whose body is two
 * pasted screenshots of her prototype; redrawn 2026-10-15 from her second
 * master, class for class (`compassOverview.css`), after "the overview page
 * does not match anjanis link". Four bands: TONIGHT (read from the plan),
 * WHERE YOU ARE (the ring, its explainer popover, Rubi's nudge), YOUR
 * ASSIGNMENTS (the table, with her hover tooltips on each readiness label),
 * and WHAT YOUR ANSWERS SHOW.
 *
 * ⚠ THE HEADER IS THE PAGE'S, NOT THIS BODY'S. On Anjani's surface
 * `CompassLearningPage` draws her "Welcome back, Jordan / Your learning
 * journey" (`OverviewHeader` below); on the `atlas` arm it keeps the Figma
 * frame's "Let's get started / Compass Learning" and the exam strip.
 *
 * ⚠ THE TABLE HAS NO ACTION BUTTONS NOW. The 2026-09-23 port drew Practice
 * again / Continue / Start in a fourth column, reasoning that one destination
 * with three routes made the page feel like one thing. Her second master's
 * table has an empty fourth column and no buttons; the two routes into the
 * session are Start session and Start practice, as she draws them.
 *
 * ⚠ A SIBLING OF `CompassOverviewSections`, NOT A REPLACEMENT FOR IT — that
 * one is the lo-fi Overview the course launcher still shows.
 */

/**
 * WHICH OF HER TWO DASHBOARDS IS ON SCREEN — the design bar's Dashboard
 * control (2026-10-16). Her prototype swaps them with a dev button; here
 * every section asks this and takes its own fixture.
 */
function useDayOne(): boolean {
  return useFeatureFlag('compass-dashboard-state').variant === 'day-one'
}

export function CompassLearningOverview({
  onStartSession,
  onViewPlan,
}: {
  onStartSession?: () => void
  /** "View your plan" — opens the Study planner page. */
  onViewPlan?: () => void
}) {
  const dayOne = useDayOne()
  return (
    <div className="cre-ov">
      {/* ⚠ DAY ONE REPLACES THE TONIGHT CARD RATHER THAN EMPTYING IT. That
          card is built from the PLAN (`tonight(plan, sched)`, the week strip,
          the undo) and on day one there is no plan — which is her whole
          point: "plan sets after your first check". An emptied Tonight would
          be claiming a session exists and declining to name it. */}
      {dayOne ? <DayOneStart onStart={onStartSession} /> : <TonightCallout onStart={onStartSession} onViewPlan={onViewPlan} />}
      <ReadinessBand onStart={onStartSession} />
      <AssignmentsTable />
      <InsightsBand />
    </div>
  )
}

/** Her page header — drawn by `CompassLearningPage` above this body on
 *  Anjani's surface. */
export function OverviewHeader() {
  const h = useDayOne() ? COMPASS_DAY_ONE_HEADER : COMPASS_OVERVIEW_HEADER
  return (
    <header className="cre-ov cre-ov__hdr">
      <p className="cre-ov__welcome">{h.welcome}</p>
      <h1 className="cre-ov__h1">{h.title}</h1>
      <p className="cre-ov__meta">
        {h.metaLead}
        <b>{h.metaStrong}</b>
      </p>
    </header>
  )
}

/* ─── TONIGHT ──────────────────────────────────────────────────────────── */

/**
 * ⚠ READ FROM THE PLAN, NOT A FIXTURE — "the Tonight card and the strip share
 * one source of truth." The date, the session and "Session 1 of 4 this week"
 * come from `compassPlanStore`'s schedule, so they agree with the Study
 * planner to the day; "Can't study tonight" takes tonight off in that same
 * plan, says what moved, and can be undone. The week strip is hidden by
 * default behind Show my week; "View your plan" opens the planner.
 */
function TonightCallout({ onStart, onViewPlan }: { onStart?: () => void; onViewPlan?: () => void }) {
  const { plan, dispatch, controls } = useCompassPlan()
  const [show, setShow] = useState(false)
  const sched = schedule(plan)
  const t = tonight(plan, sched)
  const items = weekItems(plan, sched)
  const R = plan.tonightUndo ? null : returnInfo(plan, controls.returnVer)
  const go = R ? (R.catchup ? `Quick review first: ${R.recap.join(' and ')}` : R.next ? `${R.isToday ? 'Tonight' : 'Next'}: ${R.next.topic}` : '') : ''
  return (
    <section>
      <p className="cre-ov__eyebrow">Tonight</p>
      <div className="cre-ov__callout">
        <div className="cre-ov__row">
          <div className="cre-ov__date">
            {t.dayNumber}
            <span>{t.dayName}</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="cre-ov__title">{t.title}</div>
            <div className="cre-ov__sub">{t.subline}</div>
          </div>
          {t.canSkip ? (
            <button type="button" className="cre-ov__skip" onClick={() => dispatch(tonightOff)}>
              {COMPASS_TONIGHT.skipLabel}
            </button>
          ) : (
            <span />
          )}
          <button type="button" className="cre-ov__btn" onClick={onStart}>
            <ChevronRight size={12} aria-hidden />
            {t.startLabel}
          </button>
        </div>
        <div className="cre-dw">
          <div className="cre-dw__head">
            <span className="cre-dw__label">This week</span>
            <span className="cre-dw__sum">{weekSummary(items)}</span>
            <button type="button" className="cre-dw__switch" role="switch" aria-checked={show} onClick={() => setShow((v) => !v)}>
              <span className="trk" aria-hidden>
                <span className="thm" />
              </span>
              Show my week
            </button>
            <button type="button" className="cre-ov__link" onClick={onViewPlan}>
              {COMPASS_TONIGHT.planLabel}
              <ArrowRight size={14} aria-hidden />
            </button>
          </div>
          {show ? (
            <ol className="cre-dw__strip" aria-label="Your study week">
              {items.map((x) => (
                <li
                  key={x.key}
                  className={`cre-dw__day${x.now ? ' cre-dw__day--now' : ''}${x.past ? ' cre-dw__day--past' : ''}${x.exam ? ' cre-dw__day--exam' : ''}`}
                  aria-current={x.now ? 'date' : undefined}
                >
                  <span className="d">
                    {DOW_SHORT[x.date.getDay()]} <b>{x.date.getDate()}</b>
                  </span>
                  {x.exam ? (
                    <span className="t">Exam day</span>
                  ) : x.done ? (
                    <span className="t ok">
                      <Check size={12} aria-hidden />
                      Done
                    </span>
                  ) : x.plan ? (
                    <>
                      <span className="t">{x.plan.topic}</span>
                      <span className="m">{fmtHM(x.plan.mins)}</span>
                      {x.plan.review ? <span className="r">Spaced review</span> : null}
                    </>
                  ) : (
                    <span className="t off">{x.past ? '' : 'Off'}</span>
                  )}
                </li>
              ))}
            </ol>
          ) : null}
          {plan.tonightNote === 'back' ? (
            <p className="cre-dw__note" role="status">
              Tonight is back on.
            </p>
          ) : plan.tonightNote ? (
            <p className="cre-dw__note" role="status">
              <span>
                No problem. Tonight moved forward —{' '}
                {plan.tonightNote.before === plan.tonightNote.after
                  ? `you'll still finish ${plan.tonightNote.after}`
                  : `you'll finish ${plan.tonightNote.after} instead of ${plan.tonightNote.before}`}
                .
              </span>
              <button type="button" className="cre-dw__undo" onClick={() => dispatch(tonightUndo)}>
                Undo
              </button>
            </p>
          ) : R ? (
            <p className="cre-dw__note" role="status">
              <span className="cre-dw__ret">
                <RubiLogo size={14} aria-hidden />
                {R.line}
              </span>
              {go ? <span className="cre-dw__retgo">{go}</span> : null}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

/* ─── WHERE YOU ARE ────────────────────────────────────────────────────── */

/**
 * DAY ONE'S CARD — her "Start here" callout, where the Tonight card sits on
 * the loaded dashboard.
 *
 * It reuses the Tonight callout's own classes rather than growing a second
 * set: same box, same row, same button, different content. The date block is
 * dropped — there is no session to date — and the week strip under it is her
 * one sentence instead of the plan's switch and day list.
 */
function DayOneStart({ onStart }: { onStart?: () => void }) {
  const d = COMPASS_DAY_ONE_START
  return (
    <section>
      <p className="cre-ov__eyebrow">{d.eyebrow}</p>
      <div className="cre-ov__callout">
        <div className="cre-ov__row">
          <div style={{ minWidth: 0 }}>
            <div className="cre-ov__title">{d.title}</div>
            <div className="cre-ov__sub">{d.detail}</div>
          </div>
          <span />
          <button type="button" className="cre-ov__btn" onClick={onStart}>
            <ChevronRight size={12} aria-hidden />
            {d.action}
          </button>
        </div>
        <div className="cre-dw">
          <div className="cre-dw__head">
            <span className="cre-dw__sum">{d.week}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function ReadinessBand({ onStart }: { onStart?: () => void }) {
  const dayOne = useDayOne()
  const band = dayOne ? { ...COMPASS_READINESS, ...COMPASS_DAY_ONE_READINESS } : COMPASS_READINESS
  const { percent, ringLabel, lead, explainLabel, rubi, eyebrow, tag } = band
  /* Her day-one band carries one line the loaded one does not: a principle
     above the explainer ("Start off on the right foot"). It sits where the
     loaded band goes straight to its lead. */
  const principle = dayOne ? COMPASS_DAY_ONE_READINESS.principle : null
  /* HER DASHBOARD NUDGES — the design bar's Nudge control fires one into
     this slot (2026-10-16). `none` is her Clear, and leaves the band's own
     Rubi suggestion exactly as it shipped. */
  const firedNudge = COMPASS_DASHBOARD_NUDGES[useFeatureFlag('compass-dashboard-nudge').variant ?? 'none']
  const x = COMPASS_READINESS_EXPLAINER
  return (
    <section>
      <p className="cre-ov__eyebrow cre-ov__eyebrow--where">
        {eyebrow}
        <span className="cre-ov__tag">{tag}</span>
      </p>
      <div className="cre-ov__where">
        {/* The ring is a conic sweep with a punched-out centre. `role="img"`
            with the percentage in the label, because the number inside is
            drawn in two pieces and would otherwise be read apart. */}
        <div
          role="img"
          aria-label={`${percent}% ready`}
          className="cre-ov__ring"
          style={{ background: `conic-gradient(var(--color-primary-500) ${percent}%, var(--color-compass-page-ring-1) 0)` }}
        >
          <span aria-hidden className="cre-ov__ring-inner" />
          <b aria-hidden>
            {percent}
            <sup>%</sup>
            <span>{ringLabel}</span>
          </b>
        </div>
        <div className="cre-ov__lead">
          {principle ? <p style={{ fontWeight: 600 }}>{principle}</p> : null}
          <p>{lead}</p>
          {/* Her explainer: a hover / focus popover with the make-up of the
              figure. */}
          <div className="cre-ov__calc">
            <button type="button" aria-describedby="cre-ov-explainer">
              <CircleInfo size={15} aria-hidden />
              {explainLabel}
            </button>
            <div className="cre-ov__pop" id="cre-ov-explainer" role="tooltip">
              <h4>{x.title}</h4>
              <p>{x.body}</p>
              <div className="cre-ov__make">
                {x.makeup.map((m) => (
                  <div key={m.tone}>
                    <span className={`sw sw--${m.tone}`} aria-hidden />
                    <b>{m.share}</b>
                    <span>{m.note}</span>
                  </div>
                ))}
              </div>
              <p className="foot">{x.foot}</p>
            </div>
          </div>
        </div>
        <div className="cre-ov__rubi">
          {firedNudge ? (
            /* ⚠ THE NUDGE'S OWN SHAPE, not the suggestion's. Hers leads with
               WHEN it fired, then the line, then the reason underneath —
               the reason is the part her spec insists on, so it is text on
               the card rather than a tooltip. Its actions are hers too, and
               none of them is wired: the prototype does not resolve them
               either, and a button that silently does nothing is better than
               one that pretends to reshape a plan. */
            <>
              <p className="k">
                <RubiLogo size={13} aria-hidden />
                {firedNudge.when}
              </p>
              <h3>{firedNudge.line}</h3>
              <p>{firedNudge.why}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {firedNudge.actions.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    className={`cre-ov__btn${a.solid ? '' : ' cre-ov__btn--out'}`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="k">
                <RubiLogo size={13} aria-hidden />
                {rubi.eyebrow}
              </p>
              <h3>{rubi.title}</h3>
              <p>{rubi.detail}</p>
              <button type="button" className="cre-ov__btn cre-ov__btn--out" onClick={onStart}>
                {rubi.action}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

/* ─── YOUR ASSIGNMENTS ─────────────────────────────────────────────────── */

function AssignmentsTable() {
  const dayOne = useDayOne()
  const rows = dayOne ? COMPASS_DAY_ONE_ASSIGNMENTS : COMPASS_ASSIGNMENTS
  const summary = dayOne ? COMPASS_DAY_ONE_ASSIGNMENTS_SUMMARY : COMPASS_ASSIGNMENTS_SUMMARY
  return (
    <section>
      <p className="cre-ov__eyebrow" style={{ margin: '34px 0 4px', alignItems: 'baseline', gap: 14 }}>
        Your assignments
        <span className="stat">{summary}</span>
      </p>
      <table className="cre-ov__table">
        <thead>
          <tr>
            <th>Assignment</th>
            <th style={{ width: '40%' }}>Readiness</th>
            <th>Due</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.name}>
              <td>
                <div className="cre-ov__aname">
                  <Marker state={a.state} />
                  <div style={{ minWidth: 0 }}>
                    <div className={`nm${a.state === 'locked' ? ' nm--muted' : ''}`}>{a.name}</div>
                    <div className="wt">{a.weight}</div>
                  </div>
                </div>
              </td>
              <td>
                <span className="cre-ov__tt-wrap">
                  <span className={`cre-ov__rlabel cre-ov__rlabel--${a.state}`} tabIndex={0} aria-describedby={`cre-ov-tt-${a.name}`}>
                    {a.readinessLabel}
                  </span>
                  <span className="cre-ov__tt" id={`cre-ov-tt-${a.name}`} role="tooltip">
                    <span className="th">{a.tip.head}</span>
                    <span className="tb">{a.tip.body}</span>
                  </span>
                </span>
                <div className="cre-ov__pbar">
                  {a.state === 'locked' ? null : <i className={a.state} style={{ width: `${a.barPct}%` }} />}
                </div>
              </td>
              <td>
                <span className="cre-ov__due">{a.due}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function Marker({ state }: { state: AssignmentState }) {
  return (
    <span aria-hidden className={`cre-ov__marker cre-ov__marker--${state}`}>
      {state === 'proven' || state === 'not-proven' ? <Check size={13} /> : state === 'locked' ? <Lock size={12} /> : null}
    </span>
  )
}

/* ─── WHAT YOUR ANSWERS SHOW ───────────────────────────────────────────── */

function InsightsBand() {
  const dayOne = useDayOne()
  const items = dayOne ? COMPASS_DAY_ONE_INSIGHTS : COMPASS_INSIGHTS
  const caption = dayOne ? COMPASS_DAY_ONE_INSIGHTS_CAPTION : COMPASS_INSIGHTS_CAPTION
  const heading = dayOne ? COMPASS_DAY_ONE_INSIGHTS_HEADING : 'What your answers show'
  return (
    <section className="cre-ov__insights">
      <div className="cre-ov__ins-head">
        <span className="e">{heading}</span>
        <span className="c">{caption}</span>
      </div>
      <div className="cre-ov__ins-grid">
        {items.map((ins) => (
          <div key={ins.tag} className="cre-ov__ins">
            <p className="tag2">{ins.tag}</p>
            <h4>{ins.headline}</h4>
            <p>{ins.detail}</p>
            <button type="button" className="cre-ov__link">
              {ins.action}
              <ArrowRight size={14} aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
