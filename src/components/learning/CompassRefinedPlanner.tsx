import { useState } from 'react'
import { CalendarRegular, Check, Clock, Gauge, RubiLogo } from '@/icons'
import {
  JEFF_MVP_PLANNER as PLAN,
  JEFF_MVP_PLANNER_COPY as COPY,
  type JeffMvpPlannerCell,
} from '@/data/compassJeffMvpFixtures'
import { CompassRefinedColumn, CompassRefinedHead } from './CompassRefinedChrome'
import './compassRefined.css'

type PlannerCell = JeffMvpPlannerCell

/**
 * JEFF'S STUDY PLANNER — 2026-11-09, the sixth page ported.
 *
 * An exam date, a weekly pace, and a calendar that rebuilds itself when a day
 * is marked off. His lead is the promise the page has to keep: "Your plan
 * rebuilds itself when life gets in the way."
 *
 * ⚠ NOT ANJANI'S PLANNER. `CompassStudyPlanner` is hers and has been on her
 * rail since 2026-10-08, with its own model. This is a different designer's
 * answer to the same screen, beside it, like every page of his MVP.
 *
 * ⚠ TWO CALENDARS, NOT ONE WITH A ZOOM: 7 cells at 150px under "This week ·
 * Sep 20 – 26", or 63 at 96px under "Sep 22 to exam day". Different counts,
 * heights and titles, so both are stored rather than derived.
 *
 * ⚠ THE HOVER CARD IS THE FEATURE. Each cell carries what skipping it would
 * do — "Policy provisions moves to Wed, Sep 23." — and, for an empty day,
 * "Mark it off so nothing moves here." A calendar that only drew the sessions
 * would be a different design making a weaker claim.
 *
 * ⚠ HIS DATES ARE FIXED TO TUESDAY 22 SEPTEMBER 2026. Carried as data rather
 * than recomputed from the clock, so the page keeps matching the screenshots
 * his review is based on. See the fixture note.
 */
export function CompassRefinedPlanner() {
  const [view, setView] = useState<'week' | 'full'>('week')
  const [editing, setEditing] = useState(false)
  const [pace, setPace] = useState<string>(PLAN.paceName)
  const [openCell, setOpenCell] = useState<string | null>(null)

  const cells = view === 'week' ? PLAN.week : PLAN.full

  return (
    <div className="crf-page">
      <button type="button" className="crf-ask">
        <RubiLogo size={17} aria-hidden />
        Ask Rubi
      </button>
      <CompassRefinedColumn>
        <CompassRefinedHead
          title={COPY.title}
          below={
            <>
              <p className="crf-ov__course crf-prep__course">{COPY.course}</p>
              <p className="crf-lead">{COPY.lead}</p>
            </>
          }
        />

        {/* ---------- the three facts ---------- */}
        <section className="crf-pl__stats" aria-label={COPY.paceLabel}>
          <div className="crf-pl__stat">
            <p className="crf-eyebrow">{COPY.goalLabel}</p>
            <p className="crf-pl__statbig">
              <CalendarRegular size={16} aria-hidden />
              {PLAN.daysAway} {COPY.daysAwaySuffix}
            </p>
          </div>
          <div className="crf-pl__stat">
            <p className="crf-eyebrow">{COPY.paceLabel}</p>
            <p className="crf-pl__statbig">
              <Gauge size={16} aria-hidden />
              {pace}
            </p>
            <p className="crf-pl__statsub">
              {PLAN.weekTotal} {COPY.weekSuffix}
            </p>
          </div>
          <div className="crf-pl__stat">
            <p className="crf-eyebrow">{COPY.finishLabel}</p>
            <p className="crf-pl__statbig" style={{ color: `var(--cjm-${PLAN.finishTone})` }}>
              <Check size={16} aria-hidden />
              {PLAN.finishLabel}
            </p>
            <p className="crf-pl__statsub">{PLAN.finishNote}</p>
          </div>
          <button
            type="button"
            className="crf-btn crf-pl__change"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? COPY.donePace : COPY.changePace}
          </button>
        </section>

        {/* ---------- the pace editor ---------- */}
        {editing ? (
          <section className="crf-pl__editor" aria-label={COPY.pickPace}>
            <p className="crf-eyebrow">{COPY.pickPace}</p>
            <div className="crf-pl__paces">
              {PLAN.paces.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  role="radio"
                  aria-checked={pace === p.name}
                  className={pace === p.name ? 'crf-pl__pace is-on' : 'crf-pl__pace'}
                  onClick={() => setPace(p.name)}
                >
                  <span className="crf-pl__pacename">
                    {p.name}
                    {p.suggested ? <span className="crf-pill crf-pill--quiet">{COPY.suggested}</span> : null}
                  </span>
                  <span className="crf-pl__pacetotal">
                    {p.total} {COPY.weekSuffix}
                  </span>
                  <span className="crf-pl__paceper">
                    {p.perDay} {COPY.perDaySuffix}
                  </span>
                  {/* ⚠ A PACE THAT DOES NOT GET THERE SAYS SO IN RED, and his
                      Relaxed option is exactly that: "Won't finish before your
                      exam". Dropping the option would hide the trade-off the
                      editor exists to show. */}
                  <span
                    className="crf-pl__pacefinish"
                    style={{ color: p.late ? 'var(--cjm-conf-low-ink)' : `var(--cjm-${p.finishTone})` }}
                  >
                    {p.finish}
                  </span>
                </button>
              ))}
            </div>
            <p className="crf-pl__spread">{COPY.spreadNote}</p>
            <p className="crf-pl__weektotal">
              {PLAN.weekTotal} {COPY.weekSuffix}
            </p>
            <ul className="crf-pl__sliders">
              {PLAN.sliders.map((s) => (
                <li key={s.label}>
                  <span className="crf-pl__sliderday">{s.label}</span>
                  <span className="crf-pl__slidertrack" aria-hidden>
                    <span className="crf-pl__sliderfill" style={{ width: `${(s.value / 150) * 100}%` }} />
                  </span>
                  <span className="crf-pl__slidertext">{s.text}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ---------- the calendar ---------- */}
        <section className="crf-pl__cal" aria-label={view === 'week' ? PLAN.weekTitle : PLAN.fullTitle}>
          <header className="crf-pl__calhead">
            <h2 className="crf-pl__caltitle">{view === 'week' ? PLAN.weekTitle : PLAN.fullTitle}</h2>
            <div className="crf-pl__views">
              {PLAN.views.map((label, i) => {
                const key = i === 0 ? 'week' : 'full'
                const on = view === key
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={on}
                    className={on ? 'crf-pl__view is-on' : 'crf-pl__view'}
                    onClick={() => setView(key as 'week' | 'full')}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </header>
          <p className="crf-pl__hint">{COPY.skipHint}</p>

          <div className={view === 'week' ? 'crf-pl__grid' : 'crf-pl__grid crf-pl__grid--full'}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <span className="crf-pl__dow" key={d}>
                {d}
              </span>
            ))}
            {cells.map((c) => (
              <Cell
                key={c.longDate}
                cell={c}
                open={openCell === c.longDate}
                onOpen={() => setOpenCell(openCell === c.longDate ? null : c.longDate)}
              />
            ))}
          </div>

          <div className="crf-pl__legend">
            {COPY.legend.map((l) => (
              <span key={l.label}>
                {l.kind === 'bar' ? (
                  <span className="crf-pl__swbar" style={{ background: `var(--cjm-${l.tone})` }} aria-hidden />
                ) : l.kind === 'square' ? (
                  <span className="crf-pl__swsq" style={{ background: `var(--cjm-${l.tone})` }} aria-hidden />
                ) : (
                  /* ⚠ A STRUCK-THROUGH SAMPLE DATE, not a colour chip — see
                     the fixture note. It is the one legend entry that shows
                     the gesture rather than naming a colour. */
                  <span className="crf-pl__swstruck" aria-hidden>
                    {COPY.legendSample}
                  </span>
                )}
                {l.label}
              </span>
            ))}
          </div>
        </section>
      </CompassRefinedColumn>
    </div>
  )
}

function Cell({ cell, open, onOpen }: { cell: PlannerCell; open: boolean; onOpen: () => void }) {
  const cls = [
    'crf-pl__cell',
    cell.isToday ? 'is-today' : '',
    cell.isOff ? 'is-off' : '',
    cell.isExam ? 'is-exam' : '',
    cell.disabled ? 'is-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div className={cls}>
      <button type="button" className="crf-pl__celltop" aria-label={cell.aria} onClick={onOpen}>
        <span className={cell.struck ? 'crf-pl__date is-struck' : 'crf-pl__date'}>{cell.date}</span>
        {cell.isToday ? <span className="crf-pl__today">{COPY.today}</span> : null}
      </button>
      {/* ⚠ HIS ORDER INSIDE A CELL: Off, then Exam day, then the session, then
          the spaced review. Four independent `sc-if`s, not a chain — a day can
          carry more than one of them, which is the whole reason they are not
          an either/or. */}
      {cell.isOff ? <span className="crf-pl__offword">{COPY.off}</span> : null}
      {cell.isExam ? <span className="crf-pl__examday">{COPY.examDay}</span> : null}
      {cell.hasSession ? (
        <span className="crf-pl__session">
          <span className="crf-pl__topic">{cell.topic}</span>
          <span className="crf-pl__dur">
            <Clock size={11} aria-hidden />
            {cell.dur}
          </span>
        </span>
      ) : null}
      {/* ⚠ A SPACED REVIEW IS AN EXTRA LINE, NOT A COLOUR ON THE SESSION. His
          cell for the 25th draws Taxation · 1h 30m with its steel rule AND a
          second "Spaced review" line with an amber one. The first pass read
          `review` as a modifier and the words went missing from the page. */}
      {cell.review ? <span className="crf-pl__review">{COPY.spacedReview}</span> : null}
      {cell.canSkip ? (
        <button type="button" className="crf-pl__skip" onClick={onOpen}>
          {COPY.skip}
        </button>
      ) : null}
      {open ? (
        <div className={`crf-pl__pop crf-pl__pop--${cell.popSide}`} role="dialog" aria-label={cell.popTitle}>
          <p className="crf-pl__popsub">{cell.popSub}</p>
          <p className="crf-pl__poptitle">{cell.popTitle}</p>
          <p className="crf-pl__popnote">{cell.popNote}</p>
          <button type="button" className="crf-link crf-link--flush">
            {COPY.pickSeveral}
          </button>
        </div>
      ) : null}
    </div>
  )
}
