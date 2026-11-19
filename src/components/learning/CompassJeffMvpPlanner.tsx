import { useState } from 'react'
import { CalendarRegular, Check, Clock, Gauge, RubiLogo } from '@/icons'
import {
  JEFF_MVP_PLANNER as PLAN,
  JEFF_MVP_PLANNER_COPY as COPY,
  type JeffMvpPlannerCell,
} from '@/data/compassJeffMvpFixtures'
import { CompassJeffMvpColumn, CompassJeffMvpHead } from './CompassJeffMvpShell'
import './compassJeffMvp.css'

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
export function CompassJeffMvpPlanner() {
  const [view, setView] = useState<'week' | 'full'>('week')
  const [editing, setEditing] = useState(false)
  const [pace, setPace] = useState<string>(PLAN.paceName)
  const [openCell, setOpenCell] = useState<string | null>(null)

  const cells = view === 'week' ? PLAN.week : PLAN.full

  return (
    <div className="cjm-page">
      <button type="button" className="cjm-ask">
        <RubiLogo size={17} aria-hidden />
        Ask Rubi
      </button>
      <CompassJeffMvpColumn>
        <CompassJeffMvpHead
          title={COPY.title}
          below={
            <>
              <p className="cjm-ov__course cjm-prep__course">{COPY.course}</p>
              <p className="cjm-lead">{COPY.lead}</p>
            </>
          }
        />

        {/* ---------- the three facts ---------- */}
        <section className="cjm-pl__stats" aria-label={COPY.paceLabel}>
          <div className="cjm-pl__stat">
            <p className="cjm-eyebrow">{COPY.goalLabel}</p>
            <p className="cjm-pl__statbig">
              <CalendarRegular size={16} aria-hidden />
              {PLAN.daysAway} {COPY.daysAwaySuffix}
            </p>
          </div>
          <div className="cjm-pl__stat">
            <p className="cjm-eyebrow">{COPY.paceLabel}</p>
            <p className="cjm-pl__statbig">
              <Gauge size={16} aria-hidden />
              {pace}
            </p>
            <p className="cjm-pl__statsub">
              {PLAN.weekTotal} {COPY.weekSuffix}
            </p>
          </div>
          <div className="cjm-pl__stat">
            <p className="cjm-eyebrow">{COPY.finishLabel}</p>
            <p className="cjm-pl__statbig" style={{ color: `var(--cjm-${PLAN.finishTone})` }}>
              <Check size={16} aria-hidden />
              {PLAN.finishLabel}
            </p>
            <p className="cjm-pl__statsub">{PLAN.finishNote}</p>
          </div>
          <button
            type="button"
            className="cjm-btn cjm-pl__change"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? COPY.donePace : COPY.changePace}
          </button>
        </section>

        {/* ---------- the pace editor ---------- */}
        {editing ? (
          <section className="cjm-pl__editor" aria-label={COPY.pickPace}>
            <p className="cjm-eyebrow">{COPY.pickPace}</p>
            <div className="cjm-pl__paces">
              {PLAN.paces.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  role="radio"
                  aria-checked={pace === p.name}
                  className={pace === p.name ? 'cjm-pl__pace is-on' : 'cjm-pl__pace'}
                  onClick={() => setPace(p.name)}
                >
                  <span className="cjm-pl__pacename">
                    {p.name}
                    {p.suggested ? <span className="cjm-pill cjm-pill--quiet">{COPY.suggested}</span> : null}
                  </span>
                  <span className="cjm-pl__pacetotal">
                    {p.total} {COPY.weekSuffix}
                  </span>
                  <span className="cjm-pl__paceper">
                    {p.perDay} {COPY.perDaySuffix}
                  </span>
                  {/* ⚠ A PACE THAT DOES NOT GET THERE SAYS SO IN RED, and his
                      Relaxed option is exactly that: "Won't finish before your
                      exam". Dropping the option would hide the trade-off the
                      editor exists to show. */}
                  <span
                    className="cjm-pl__pacefinish"
                    style={{ color: p.late ? 'var(--cjm-conf-low-ink)' : `var(--cjm-${p.finishTone})` }}
                  >
                    {p.finish}
                  </span>
                </button>
              ))}
            </div>
            <p className="cjm-pl__spread">{COPY.spreadNote}</p>
            <p className="cjm-pl__weektotal">
              {PLAN.weekTotal} {COPY.weekSuffix}
            </p>
            <ul className="cjm-pl__sliders">
              {PLAN.sliders.map((s) => (
                <li key={s.label}>
                  <span className="cjm-pl__sliderday">{s.label}</span>
                  <span className="cjm-pl__slidertrack" aria-hidden>
                    <span className="cjm-pl__sliderfill" style={{ width: `${(s.value / 150) * 100}%` }} />
                  </span>
                  <span className="cjm-pl__slidertext">{s.text}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ---------- the calendar ---------- */}
        <section className="cjm-pl__cal" aria-label={view === 'week' ? PLAN.weekTitle : PLAN.fullTitle}>
          <header className="cjm-pl__calhead">
            <h2 className="cjm-pl__caltitle">{view === 'week' ? PLAN.weekTitle : PLAN.fullTitle}</h2>
            <div className="cjm-pl__views">
              {PLAN.views.map((label, i) => {
                const key = i === 0 ? 'week' : 'full'
                const on = view === key
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={on}
                    className={on ? 'cjm-pl__view is-on' : 'cjm-pl__view'}
                    onClick={() => setView(key as 'week' | 'full')}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </header>
          <p className="cjm-pl__hint">{COPY.skipHint}</p>

          <div className={view === 'week' ? 'cjm-pl__grid' : 'cjm-pl__grid cjm-pl__grid--full'}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <span className="cjm-pl__dow" key={d}>
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

          <div className="cjm-pl__legend">
            {COPY.legend.map((l) => (
              <span key={l.label}>
                {l.kind === 'bar' ? (
                  <span className="cjm-pl__swbar" style={{ background: `var(--cjm-${l.tone})` }} aria-hidden />
                ) : l.kind === 'square' ? (
                  <span className="cjm-pl__swsq" style={{ background: `var(--cjm-${l.tone})` }} aria-hidden />
                ) : (
                  /* ⚠ A STRUCK-THROUGH SAMPLE DATE, not a colour chip — see
                     the fixture note. It is the one legend entry that shows
                     the gesture rather than naming a colour. */
                  <span className="cjm-pl__swstruck" aria-hidden>
                    {COPY.legendSample}
                  </span>
                )}
                {l.label}
              </span>
            ))}
          </div>
        </section>
      </CompassJeffMvpColumn>
    </div>
  )
}

function Cell({ cell, open, onOpen }: { cell: PlannerCell; open: boolean; onOpen: () => void }) {
  const cls = [
    'cjm-pl__cell',
    cell.isToday ? 'is-today' : '',
    cell.isOff ? 'is-off' : '',
    cell.isExam ? 'is-exam' : '',
    cell.disabled ? 'is-disabled' : '',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div className={cls}>
      <button type="button" className="cjm-pl__celltop" aria-label={cell.aria} onClick={onOpen}>
        <span className={cell.struck ? 'cjm-pl__date is-struck' : 'cjm-pl__date'}>{cell.date}</span>
        {cell.isToday ? <span className="cjm-pl__today">{COPY.today}</span> : null}
      </button>
      {/* ⚠ HIS ORDER INSIDE A CELL: Off, then Exam day, then the session, then
          the spaced review. Four independent `sc-if`s, not a chain — a day can
          carry more than one of them, which is the whole reason they are not
          an either/or. */}
      {cell.isOff ? <span className="cjm-pl__offword">{COPY.off}</span> : null}
      {cell.isExam ? <span className="cjm-pl__examday">{COPY.examDay}</span> : null}
      {cell.hasSession ? (
        <span className="cjm-pl__session">
          <span className="cjm-pl__topic">{cell.topic}</span>
          <span className="cjm-pl__dur">
            <Clock size={11} aria-hidden />
            {cell.dur}
          </span>
        </span>
      ) : null}
      {/* ⚠ A SPACED REVIEW IS AN EXTRA LINE, NOT A COLOUR ON THE SESSION. His
          cell for the 25th draws Taxation · 1h 30m with its steel rule AND a
          second "Spaced review" line with an amber one. The first pass read
          `review` as a modifier and the words went missing from the page. */}
      {cell.review ? <span className="cjm-pl__review">{COPY.spacedReview}</span> : null}
      {cell.canSkip ? (
        <button type="button" className="cjm-pl__skip" onClick={onOpen}>
          {COPY.skip}
        </button>
      ) : null}
      {open ? (
        <div className={`cjm-pl__pop cjm-pl__pop--${cell.popSide}`} role="dialog" aria-label={cell.popTitle}>
          <p className="cjm-pl__popsub">{cell.popSub}</p>
          <p className="cjm-pl__poptitle">{cell.popTitle}</p>
          <p className="cjm-pl__popnote">{cell.popNote}</p>
          <button type="button" className="cjm-link cjm-link--flush">
            {COPY.pickSeveral}
          </button>
        </div>
      ) : null}
    </div>
  )
}
