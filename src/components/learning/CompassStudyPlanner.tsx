import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, Check, ChevronLeft, ChevronRight, RubiLogo, RubiMark, XmarkRegular } from '@/icons'
import {
  PLANNER_META_LEAD,
  PLANNER_PACES,
  PLANNER_RUBI_FALLBACK,
  PLANNER_RUBI_HEAD,
  PLANNER_RUBI_NOTHING_TO_UNDO,
  PLANNER_RUBI_PLACEHOLDER,
  PLANNER_SLIDER_RANGE,
  PLANNER_STARTERS,
  PLANNER_TITLE,
  type PlannerStarterId,
} from '@/data/compassStudyPlannerFixtures'
import { DOW_SHORT, addDays, dateFromKey, dayKey, fmtHM, fmtShort, midnight, sameDay } from './compassStudyPlannerModel'
import {
  applyDay,
  cells,
  clearFlash,
  closeNotice,
  daysAway,
  dismissAway,
  finishPhrase,
  finishReadback,
  finishText,
  finishWith,
  fmtLong,
  isDirty,
  normNote,
  paceName,
  periodLabel,
  returnInfo,
  runStarter,
  savePlan,
  sayRubi,
  sayUser,
  schedule,
  selEnd,
  selPreview,
  selStart,
  selToggle,
  setDay,
  setPace,
  setPanel,
  setView,
  starterFollowUp,
  stepWeek,
  toggleEdit,
  undoChanges,
  undoDay,
  undoRubi,
  weekly,
  whereGoes,
  type PlanState,
} from './compassPlanStore'
import { useCompassPlan } from './compassPlanHooks'
import './compassStudyPlanner.css'

/**
 * THE STUDY PLANNER — what the Compass rail's "Study planner" row opens on
 * Anjani's surface. First ported 2026-10-15 from her OCT2 master; rebuilt the
 * same day from her second master (the file published as the type-scale
 * preview), which is a different planner in most of its behaviour:
 *
 * - THE WEEK IS THE DEFAULT VIEW, drawn as a list of days; "Full plan" is
 *   the whole span, this week to exam week, as compact cells with bars.
 * - TAKING A DAY OFF has two concepts (`compass-planner-day-off`): a Skip
 *   button on the day, or a menu that says where the session would land
 *   before you commit. Both leave a notice with Undo that does not time out.
 *   "Pick several days…" is a selection mode, loud on purpose.
 * - AFTER TIME AWAY the plan says what moved, once, sized to the absence
 *   (`compass-planner-return`, seeded by `compass-planner-absence`).
 * - BELOW THE WEEK, nothing, next week, or the coming sessions
 *   (`compass-planner-under`).
 * - RUBI'S PANEL opens and closes; her changes tag the pace "Changed by
 *   Rubi" until the learner adjusts it themselves or undoes them all.
 *
 * The state lives in `CompassPlanContext`, shared with the Overview's Tonight
 * card — see `compassPlanStore` for why one plan. This component holds only
 * what is local to the page: the day menu's anchor, the saved toast, the
 * timers for Rubi's beat.
 *
 * ⚠ HER PROTOTYPE BOX IS NOT HERE — "Rubi on / off", "Study today / Miss
 * today / Away a week", "Return A / B", "Below week", "Day off" are the five
 * design controls read by the provider. Everything they switched is.
 */

type Pop = { key: string; left: number; top: number }

export function CompassStudyPlanner() {
  const { plan: s, dispatch, controls } = useCompassPlan()
  const { rubi, returnVer, under, dayMode } = controls
  const [toast, setToast] = useState<string | null>(null)
  const [pop, setPop] = useState<Pop | null>(null)
  const [draft, setDraft] = useState('')
  const mainRef = useRef<HTMLElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const timers = useRef<number[]>([])
  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const sched = useMemo(() => schedule(s), [s])
  const readback = finishReadback(s, sched)
  const wk = weekly(s)
  const pace = paceName(s.dayMins)
  const dirty = isDirty(s)
  const norm = normNote(s)
  const R = returnInfo(s, returnVer)
  const today = midnight(s.today)
  const exam = midnight(s.exam)

  /* the flash clears itself after the animation */
  useEffect(() => {
    if (!s.flash.size) return
    const t = window.setTimeout(() => dispatch(clearFlash), 1200)
    return () => window.clearTimeout(t)
  }, [s.flash, dispatch])
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [s.lines])
  /* the day menu closes on Escape, a click elsewhere, or a resize */
  useEffect(() => {
    if (!pop) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPop(null)
    }
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('.cre-planner__pop') || t.closest('.cre-planner__day')) return
      setPop(null)
    }
    const onResize = () => setPop(null)
    document.addEventListener('keydown', onKey)
    document.addEventListener('click', onClick)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClick)
      window.removeEventListener('resize', onResize)
    }
  }, [pop])
  useEffect(() => {
    if (!s.selMode) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch(selEnd(false))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [s.selMode, dispatch])

  /* ---- learner controls ---- */
  const save = () => {
    dispatch(savePlan)
    setToast('Plan saved.')
    later(2600, () => setToast(null))
  }
  const openPop = (key: string, cell: HTMLElement) => {
    const main = mainRef.current
    if (!main) return
    const r = cell.getBoundingClientRect()
    const m = main.getBoundingClientRect()
    const pw = 280
    let left = r.left - m.left + main.scrollLeft
    const top = r.bottom - m.top + main.scrollTop + 6
    if (left + pw > main.clientWidth - 12) left = r.right - m.left + main.scrollLeft - pw
    left = Math.max(8, left)
    setPop({ key, left, top })
  }
  const dayClick = (key: string, e: React.MouseEvent<HTMLElement>) => {
    if (s.selMode) {
      dispatch(selToggle(key, e.shiftKey))
      return
    }
    openPop(key, e.currentTarget)
  }
  const apply = (key: string, how: 'off' | 'back') => {
    setPop(null)
    dispatch(applyDay(key, how))
  }

  /* ---- Rubi ---- */
  const starter = (id: PlannerStarterId) => {
    const snapshot = s
    dispatch(runStarter(id))
    later(260, () => dispatch(starterFollowUp(id, snapshot)))
  }
  const send = () => {
    const v = draft.trim()
    if (!v) return
    setDraft('')
    dispatch(sayUser(v))
    if (/^\s*undo\b/i.test(v)) {
      later(240, () => dispatch(s.stack.length ? undoRubi : sayRubi(PLANNER_RUBI_NOTHING_TO_UNDO)))
      return
    }
    later(280, () => dispatch(sayRubi(PLANNER_RUBI_FALLBACK)))
  }

  const panelShown = rubi && s.panelOpen
  const grid = cells(s)
  const seen = { sess: false, rev: false, off: false, exam: false }
  const undoLine = s.stack[s.stack.length - 1]?.line
  const howto =
    dayMode === 'skip'
      ? (typeof window === 'undefined' || !window.matchMedia || window.matchMedia('(hover:hover)').matches)
        ? "Can't study on a day? Point at it and choose Skip."
        : "Can't study on a day? Tap Skip."
      : "Can't study on a day? Click it."

  return (
    <div className={`cre-planner${panelShown ? '' : ' cre-planner--wide'}`} role="region" aria-label="Study planner">
      <main className="cre-planner__main" ref={mainRef}>
        <div className="cre-planner__inner">
          <div className="cre-planner__top">
            <div>
              <h1>{PLANNER_TITLE}</h1>
              <p className="cre-planner__meta">{PLANNER_META_LEAD}</p>
            </div>
            {rubi && !s.panelOpen ? (
              <button type="button" className="cre-planner__ropen" onClick={() => dispatch(setPanel(true))} aria-expanded={false}>
                <RubiLogo size={16} aria-hidden />
                <span>Rubi</span>
              </button>
            ) : null}
          </div>

          <section className="cre-planner__bar" aria-label="Your plan">
            <div className="cre-planner__row">
              <div className="cre-planner__f">
                <div className="k">Your exam</div>
                <div className="v">{fmtShort(exam)}</div>
                <div className="s">{daysAway(s)} days away</div>
              </div>
              <div className={`cre-planner__f${s.byRubi ? ' cre-planner__f--flash' : ''}`}>
                <div className="k">
                  Your pace
                  {s.byRubi ? (
                    <span className="cre-planner__bytag">
                      <RubiLogo size={13} aria-hidden />
                      Changed by Rubi
                    </span>
                  ) : null}
                </div>
                <div className="v">{pace}</div>
                <div className="s">{wk ? `${fmtHM(wk)} a week` : 'no study time set'}</div>
              </div>
              <div className="cre-planner__f cre-planner__f--lead">
                <div className="k">Course finishes</div>
                <div className="v">{readback.finish}</div>
                <div className={`s s--${readback.tone}`} role="status" aria-live="polite">
                  {readback.status}
                </div>
              </div>
              {s.editOpen && dirty ? null : (
                <button type="button" className="cre-planner__btn-out" onClick={() => dispatch(toggleEdit)}>
                  {s.editOpen ? 'Done' : 'Change pace'}
                </button>
              )}
            </div>

            {s.editOpen ? (
              <div className="cre-planner__edit">
                <p className="cre-planner__lbl">Pick a pace</p>
                <div className="cre-planner__paces" role="group" aria-label="Pick a pace">
                  {PLANNER_PACES.map((p) => {
                    const f = finishWith(s, p.mins)
                    const fits = !!f && f.fits
                    return (
                      <button key={p.id} type="button" aria-pressed={p.name === pace} onClick={() => dispatch(setPace(p.id))}>
                        <span className="pn">
                          {p.name}
                          {p.id === 'average' ? <span className="ptag">Suggested</span> : null}
                        </span>
                        <span className="phr">
                          {fmtHM(p.mins.reduce((a, b) => a + b, 0))}
                          <span className="pu"> a week</span>
                        </span>
                        <span className="pd">{fmtHM(Math.max(...p.mins))} on study days</span>
                        <span className={`pf${fits ? '' : ' miss'}`}>
                          {!f ? '' : fits && f.date ? `Finishes ${fmtShort(f.date)}` : "Won't finish before your exam"}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <p className="cre-planner__lbl">
                  Spread it across your week
                  <span className="sub">weekends can be different from weekdays</span>
                  <span className="tot">{wk ? `${fmtHM(wk)} a week` : 'nothing set'}</span>
                </p>
                <div className="cre-planner__week">
                  {DOW_SHORT.map((dn, n) => (
                    <div className="cre-planner__drow" key={dn}>
                      <span className="dn">{dn}</span>
                      <input
                        type="range"
                        min={PLANNER_SLIDER_RANGE.min}
                        max={PLANNER_SLIDER_RANGE.max}
                        step={PLANNER_SLIDER_RANGE.step}
                        value={s.dayMins[n]}
                        aria-label={`${dn} study time`}
                        aria-valuetext={s.dayMins[n] ? fmtHM(s.dayMins[n]) : 'none'}
                        onChange={(e) => dispatch(setDay(n, Number(e.target.value)))}
                      />
                      <span className={`dv${s.dayMins[n] ? '' : ' dv--zero'}`}>{fmtHM(s.dayMins[n])}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {norm ? <NormNote rubi={rubi} weekly={norm} /> : null}

            {R ? (
              <div
                className={`cre-planner__miss${rubi ? ' cre-planner__miss--rubi' : ''}${R.fits ? (R.tight ? ' cre-planner__miss--tight' : '') : ' cre-planner__miss--warn'}`}
                role="status"
              >
                <div className="cre-planner__mtop">
                  <span className="who">
                    {rubi ? (
                      <>
                        <RubiLogo size={13} aria-hidden />
                        Rubi
                      </>
                    ) : (
                      'Your plan'
                    )}
                  </span>
                  <button type="button" className="cre-planner__px" onClick={() => dispatch(dismissAway)} aria-label="Dismiss">
                    ×
                  </button>
                </div>
                {R.head ? <p className="cre-planner__mhead">{R.head}</p> : null}
                <p className="cre-planner__mbody">{R.body}</p>
                {R.catchup ? (
                  <p className="cre-planner__mwhy">
                    Before your break you studied {R.recap.join(' and ')}. A short review brings {R.recap.length > 1 ? 'them' : 'it'} back before you move on.
                  </p>
                ) : null}
                {R.next ? (
                  <div className="cre-planner__macts">
                    {R.catchup ? (
                      <>
                        <button type="button" className="cre-planner__mgo">
                          Start with a quick review
                        </button>
                        <button type="button" className="cre-planner__mlink">
                          Skip to {R.next.topic}
                        </button>
                      </>
                    ) : (
                      <button type="button" className="cre-planner__mgo">
                        {R.isToday ? 'Start today' : `Pick up ${R.nextDate ? DOW_SHORT[R.nextDate.getDay()] : ''}`}: {R.next.topic}
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}

            {toast ? (
              <p className="cre-planner__toast" role="status">
                {toast}
              </p>
            ) : null}
            {s.editOpen && dirty ? (
              <div className="cre-planner__save">
                <span className="m">You've changed your pace.</span>
                <button type="button" className="go" onClick={save}>
                  Save plan
                </button>
                <button type="button" className="undo" onClick={() => dispatch(undoChanges)}>
                  Undo changes
                </button>
              </div>
            ) : null}
          </section>

          <div className="cre-planner__ctl">
            <h2>{periodLabel(s)}</h2>
            {s.view === 'week' ? (
              <div className="cre-planner__arrows">
                <button type="button" onClick={() => dispatch(stepWeek(-1))} aria-label="Previous">
                  <ChevronLeft size={15} aria-hidden />
                </button>
                <button type="button" onClick={() => dispatch(stepWeek(1))} aria-label="Next">
                  <ChevronRight size={15} aria-hidden />
                </button>
              </div>
            ) : null}
            <div className="cre-planner__vtoggle" role="group" aria-label="Calendar view">
              <button type="button" aria-pressed={s.view === 'week'} onClick={() => dispatch(setView('week'))}>
                This week
              </button>
              <button type="button" aria-pressed={s.view === 'month'} onClick={() => dispatch(setView('month'))}>
                Full plan
              </button>
            </div>
          </div>

          <p className="cre-planner__howto">{howto}</p>

          {s.selMode ? (
            <div className="cre-planner__selbar" role="region" aria-label="Marking days off">
              <span className="lbl">Marking days off</span>
              <span className="n">{s.sel.size ? `${s.sel.size} ${s.sel.size === 1 ? 'day' : 'days'} picked` : 'No days picked yet'}</span>
              <span className="f">
                {s.sel.size ? <Phrase p={finishPhrase(finishText(s), selPreview(s))} /> : "Tap the days you can't study. Hold Shift to pick a range."}
              </span>
              <button type="button" className="cx" onClick={() => dispatch(selEnd(false))}>
                Cancel
              </button>
              <button type="button" className="go" disabled={!s.sel.size} onClick={() => dispatch(selEnd(true))}>
                {s.sel.size ? `Take ${s.sel.size} ${s.sel.size === 1 ? 'day' : 'days'} off` : 'Take days off'}
              </button>
            </div>
          ) : null}

          {s.notice ? (
            <div className="cre-planner__daytoast" role="status">
              <span className="m">
                {s.notice.msg}
                {s.notice.undone ? (
                  <b>{s.notice.after}.</b>
                ) : s.notice.after === "won't fit" && s.notice.before !== "won't fit" ? (
                  <>
                    {' '}
                    <b>Your plan no longer fits before your exam.</b>
                  </>
                ) : s.notice.showFinish ? (
                  <>
                    {' '}
                    <Phrase p={finishPhrase(s.notice.before, s.notice.after)} />.
                  </>
                ) : null}
              </span>
              {s.notice.undone ? null : (
                <button type="button" className="cre-planner__tbtn" onClick={() => dispatch(undoDay)}>
                  Undo
                </button>
              )}
              <button type="button" className="cre-planner__px" onClick={() => dispatch(closeNotice)} aria-label="Dismiss">
                ×
              </button>
            </div>
          ) : null}

          {pop ? <DayMenu s={s} pop={pop} sched={sched} onApply={apply} onClose={() => setPop(null)} onPick={(k) => { setPop(null); dispatch(selStart(k)) }} onPace={() => { setPop(null); if (!s.editOpen) dispatch(toggleEdit) }} /> : null}

          <div className={`cre-planner__dow${s.view === 'week' ? ' cre-planner__dow--week' : ''}`} aria-hidden>
            {DOW_SHORT.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className={`cre-planner__grid${s.view === 'week' ? ' cre-planner__grid--week' : ''}`}>
            {grid.map(({ date }, i) => {
              const key = dayKey(date)
              const isExam = sameDay(date, exam)
              const isToday = sameDay(date, today)
              const past = midnight(date) < today
              const plan = sched.map[key]
              const blocked = s.off.has(key)
              const offDay = !past && !isExam && !plan && (blocked || (sched.finish != null && midnight(date) <= midnight(sched.finish)))
              const wasDone = past && s.done.has(key)
              const cls = ['cre-planner__day']
              if (past) cls.push('cre-planner__day--past')
              if (isToday) cls.push('cre-planner__day--today')
              if (isExam) cls.push('cre-planner__day--exam')
              else if (offDay) cls.push('cre-planner__day--off')
              if (s.flash.has(key)) cls.push('cre-planner__day--changed')
              if (plan) cls.push('cre-planner__day--sess')
              if (plan?.review) cls.push('cre-planner__day--rev')
              if (wasDone) cls.push('cre-planner__day--done')
              const pickable = s.selMode && !past && !isExam && !offDay
              if (pickable) cls.push('cre-planner__day--pickable')
              if (pickable && s.sel.has(key)) cls.push('cre-planner__day--picked')
              if (plan) seen.sess = true
              if (plan?.review) seen.rev = true
              if (offDay) seen.off = true
              if (isExam) seen.exam = true

              const catchup = isToday && R?.catchup
              const body = wasDone ? (
                <span className="cre-planner__done">
                  <Check size={12} aria-hidden />
                  Done
                </span>
              ) : isExam ? (
                <span className="cre-planner__chip cre-planner__chip--exam">Exam day</span>
              ) : plan ? (
                <>
                  {catchup ? <span className="cre-planner__chip cre-planner__chip--rev">Catch-up review</span> : null}
                  <span className="cre-planner__chip cre-planner__chip--sess">{plan.topic}</span>
                  <span className="cre-planner__mins">{fmtHM(plan.mins)}</span>
                  {plan.review ? <span className="cre-planner__chip cre-planner__chip--rev">Spaced review</span> : null}
                </>
              ) : offDay ? (
                <span className="cre-planner__offmark">Off</span>
              ) : null
              const numText = s.view === 'month' && (date.getDate() === 1 || i === 0) ? fmtShort(date) : String(date.getDate())
              const num = (
                <>
                  <span className="wd">{DOW_SHORT[date.getDay()]}</span>
                  <span className="num">
                    {numText}
                    {isToday ? <span className="cre-planner__todaytag">Today</span> : null}
                  </span>
                </>
              )
              const clickable = !past && !isExam
              const aria =
                `${isToday ? 'Today, ' : ''}${DOW_SHORT[date.getDay()]} ${fmtShort(date)}` +
                (plan ? `, ${plan.topic}, ${fmtHM(plan.mins)}${plan.review ? ', plus spaced review' : ''}` : offDay ? ', day off' : '')
              if (!clickable) {
                return (
                  <div key={key} className={cls.join(' ')} data-key={key}>
                    {num}
                    {body}
                  </div>
                )
              }
              if (dayMode === 'skip' && !s.selMode && plan && !offDay) {
                return (
                  <div key={key} className={`${cls.join(' ')} cre-planner__day--skip`} data-key={key}>
                    <div className="cre-planner__dvis" aria-hidden>
                      {num}
                      {body}
                    </div>
                    <button type="button" className="cre-planner__dayhit" aria-haspopup="dialog" aria-label={aria} onClick={(e) => dayClick(key, e)} />
                    <button type="button" className="cre-planner__skip" aria-label={`Skip ${aria}`} onClick={() => apply(key, 'off')}>
                      Skip
                    </button>
                  </div>
                )
              }
              return (
                <button
                  key={key}
                  type="button"
                  className={cls.join(' ')}
                  data-key={key}
                  aria-haspopup={s.selMode ? undefined : 'dialog'}
                  aria-pressed={s.selMode ? s.sel.has(key) : undefined}
                  aria-label={`${aria}${s.selMode && s.sel.has(key) ? ', selected' : ''}`}
                  onClick={(e) => dayClick(key, e)}
                >
                  {num}
                  {body}
                </button>
              )
            })}
          </div>

          {Object.values(seen).some(Boolean) ? (
            <div className="cre-planner__legend" aria-label="Legend">
              {seen.sess ? (
                <span className="li">
                  <span className="sw sw--sess" aria-hidden />
                  Study session
                </span>
              ) : null}
              {seen.rev ? (
                <span className="li">
                  <span className="sw sw--rev" aria-hidden />
                  Spaced review
                </span>
              ) : null}
              {seen.off ? (
                <span className="li">
                  <span className="sw sw--off" aria-hidden>
                    14
                  </span>
                  Day off
                </span>
              ) : null}
              {seen.exam ? (
                <span className="li">
                  <span className="sw sw--exam" aria-hidden />
                  Exam day
                </span>
              ) : null}
            </div>
          ) : null}

          {s.view === 'week' && under !== 'none' ? <Under s={s} sched={sched} under={under} onNext={() => dispatch(stepWeek(1))} /> : null}
        </div>
      </main>

      {panelShown ? (
        <aside className="cre-planner__rubi" aria-label="Rubi">
          <div className="cre-planner__rhead">
            <RubiMark width={30} aria-hidden />
            <div>
              <div className="nm">{PLANNER_RUBI_HEAD.name}</div>
              <div className="tg">{PLANNER_RUBI_HEAD.tagline}</div>
            </div>
            <button type="button" className="cre-planner__rclose" onClick={() => dispatch(setPanel(false))} aria-label="Close Rubi">
              <XmarkRegular size={14} aria-hidden />
            </button>
          </div>
          <div className="cre-planner__rscroll" ref={scrollRef} role="log" aria-label="Conversation">
            {s.lines.map((line, i) =>
              line.kind === 'applied' ? (
                <div className="cre-planner__applied" key={`a-${line.id}`}>
                  <Check size={13} aria-hidden />
                  <span className="atext">
                    {line.text}
                    {line.before && line.after && line.before !== line.after ? (
                      <>
                        <br />
                        <span className="cre-planner__moved">
                          Finish {line.before} → <b>{line.after}</b>
                        </span>
                      </>
                    ) : null}
                  </span>
                  {line.id === undoLine ? (
                    <button type="button" className="cre-planner__undo" onClick={() => dispatch(undoRubi)} aria-label={`Undo: ${line.text}`}>
                      Undo
                    </button>
                  ) : null}
                </div>
              ) : line.kind === 'u' ? (
                <div className="cre-planner__msg cre-planner__msg--u" key={`m-${line.id}`}>
                  <p className="tx">{line.text}</p>
                </div>
              ) : (
                <div className="cre-planner__msg cre-planner__msg--r" key={`m-${line.id}`}>
                  {/* the mark sits on the first message of each Rubi turn */}
                  <span className={`cre-planner__mmark${i > 0 && s.lines[i - 1].kind === 'r' ? ' cre-planner__mmark--ghost' : ''}`} aria-hidden>
                    <RubiLogo size={18} />
                  </span>
                  <p className="tx">{line.boldPace ? <BoldPace text={line.text} /> : line.text}</p>
                </div>
              ),
            )}
          </div>
          <div className="cre-planner__rfoot">
            {s.startersUsed ? null : (
              <div className="cre-planner__pills">
                {PLANNER_STARTERS.map((st) => (
                  <button type="button" key={st.id} onClick={() => starter(st.id)}>
                    {st.label}
                  </button>
                ))}
              </div>
            )}
            <div className="cre-planner__rinp">
              <span className="cre-planner__imark" aria-hidden>
                <RubiLogo size={15} />
              </span>
              <input
                value={draft}
                placeholder={PLANNER_RUBI_PLACEHOLDER}
                aria-label="Ask Rubi"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send()
                }}
              />
              <button type="button" className="send" onClick={send} aria-label="Send">
                <ArrowRight size={14} aria-hidden />
              </button>
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  )
}

function BoldPace({ text }: { text: string }) {
  const i = text.indexOf('Average')
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <b>Average</b>
      {text.slice(i + 'Average'.length)}
    </>
  )
}

function Phrase({ p }: { p: { text: string; bold?: string } }) {
  return (
    <>
      {p.text}
      {p.bold ? <b>{p.bold}</b> : null}
    </>
  )
}

/** The per-day menu — what this day is, and the one or two things you can do
 *  about it, each saying where the session would land. */
function DayMenu({
  s,
  pop,
  sched,
  onApply,
  onClose,
  onPick,
  onPace,
}: {
  s: PlanState
  pop: Pop
  sched: ReturnType<typeof schedule>
  onApply: (key: string, how: 'off' | 'back') => void
  onClose: () => void
  onPick: (key: string) => void
  onPace: () => void
}) {
  const first = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    first.current?.focus()
  }, [pop.key])
  const d = dateFromKey(pop.key)
  const dow = d.getDay()
  const plan = sched.map[pop.key]
  const blocked = s.off.has(pop.key)
  const full = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dow]
  let what: string
  let actions: ReactNode = null
  if (blocked) {
    what = 'You marked this day off.'
    actions = (
      <button type="button" className="cre-planner__pa cre-planner__pa--main" ref={first} onClick={() => onApply(pop.key, 'back')}>
        <span className="t">I can study this day after all</span>
        <span className="h">Your sessions move up to fill it.</span>
      </button>
    )
  } else if (plan) {
    what = `${plan.topic} · ${fmtHM(plan.mins)}${plan.review ? ' · plus spaced review' : ''}`
    const landed = whereGoes(s, pop.key, plan.idx)
    const off = new Set(s.off)
    off.add(pop.key)
    const breaks = finishText({ ...s, off }) === "won't fit"
    actions = (
      <>
        <button type="button" className="cre-planner__pa cre-planner__pa--main" ref={first} onClick={() => onApply(pop.key, 'off')}>
          <span className="t">I can't study this day</span>
          <span className={`h${breaks ? ' warn' : ''}`}>
            {!landed ? 'Your plan no longer fits before your exam.' : `${plan.topic} moves to ${fmtLong(landed)}.`}
            {breaks && landed ? ' Your plan no longer fits before your exam.' : ''}
          </span>
        </button>
        <button type="button" className="cre-planner__plink" onClick={() => onPick(pop.key)}>
          Pick several days…
        </button>
      </>
    )
  } else {
    what = s.dayMins[dow] ? 'Nothing planned. Your plan finishes before this day.' : `${full}s are off in your pace.`
    if (!s.dayMins[dow]) {
      actions = (
        <button type="button" className="cre-planner__pa" ref={first} onClick={onPace}>
          <span className="t">Change your pace</span>
          <span className="h">Add time on {full}s with the sliders.</span>
        </button>
      )
    }
  }
  return (
    <div className="cre-planner__pop" role="dialog" aria-label="Change this day" style={{ left: pop.left, top: pop.top }}>
      <div className="cre-planner__ph">
        <b>{fmtLong(d)}</b>
        <button type="button" className="cre-planner__px" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <p className="cre-planner__pw">{what}</p>
      {actions}
    </div>
  )
}

/** Below the week — next week as a quieter row, or the coming sessions. */
function Under({ s, sched, under, onNext }: { s: PlanState; sched: ReturnType<typeof schedule>; under: 'next' | 'coming'; onNext: () => void }) {
  const wkStart = addDays(s.cursor, -s.cursor.getDay())
  const nxStart = addDays(wkStart, 7)
  const nxEnd = addDays(nxStart, 6)
  const exam = midnight(s.exam)
  const long = (x: Date) => `${DOW_SHORT[x.getDay()]}, ${fmtShort(x)}`
  if (under === 'next') {
    if (nxStart > exam) return null
    return (
      <div className="cre-planner__under cre-planner__under--next">
        <div className="uh">
          <span className="ut">Next week</span>
          <span className="us">
            {fmtShort(nxStart)} – {nxStart.getMonth() === nxEnd.getMonth() ? nxEnd.getDate() : fmtShort(nxEnd)}
          </span>
          <button type="button" className="ul" onClick={onNext}>
            Go to next week
          </button>
        </div>
        <ol className="cre-planner__nxrow" aria-label="Next week">
          {Array.from({ length: 7 }, (_, i) => {
            const d = addDays(nxStart, i)
            const k = dayKey(d)
            const p = sched.map[k]
            const isExam = sameDay(d, exam)
            const off = !p && !isExam && (s.off.has(k) || !s.dayMins[d.getDay()])
            return (
              <li key={k} className={`cre-planner__nx${isExam ? ' ex' : ''}${off ? ' off' : ''}`}>
                <span className="d">{d.getDate()}</span>
                {isExam ? (
                  <span className="t">Exam day</span>
                ) : p ? (
                  <>
                    <span className="t">{p.topic}</span>
                    <span className="m">{fmtHM(p.mins)}</span>
                    {p.review ? <span className="r">Spaced review</span> : null}
                  </>
                ) : off ? (
                  <span className="m">Off</span>
                ) : null}
              </li>
            )
          })}
        </ol>
      </div>
    )
  }
  const after = Object.keys(sched.map)
    .map((k) => [dateFromKey(k), sched.map[k]] as const)
    .filter(([d]) => d >= nxStart)
    .sort((a, b) => a[0].getTime() - b[0].getTime())
  const list = after.slice(0, 4)
  const rev = after.find(([, p]) => p.review)
  if (!list.length) return null
  return (
    <div className="cre-planner__under cre-planner__under--coming">
      <div className="uh">
        <span className="ut">Coming up</span>
      </div>
      <ul className="cre-planner__cu">
        {list.map(([d, p]) => (
          <li key={dayKey(d)}>
            <span className="cd">{long(d)}</span>
            <span className="ct">
              {p.topic}
              {p.review ? <span className="crv">Spaced review</span> : null}
            </span>
            <span className="cm">{fmtHM(p.mins)}</span>
          </li>
        ))}
      </ul>
      {rev && !list.includes(rev) ? (
        <p className="cre-planner__cur">
          <span className="dot" aria-hidden />
          <span>
            Next spaced review: <b>{long(rev[0])}</b>, with {rev[1].topic}
          </span>
        </p>
      ) : null}
    </div>
  )
}

/* The norm note: context, not a rule. Only drawn under 7h a week. */
function NormNote({ rubi, weekly }: { rubi: boolean; weekly: number }) {
  const mine = fmtHM(weekly)
  return (
    <div className={`cre-planner__norm${rubi ? ' cre-planner__norm--rubi' : ''}`}>
      {rubi ? (
        <>
          <span className="who">
            <RubiLogo size={13} aria-hidden />
            Rubi
          </span>{' '}
          — you're at {mine} a week. Most people taking Life &amp; Health settle around 7 hours.{' '}
          <span className="aside">Yours still works if that is what your week allows.</span>
        </>
      ) : (
        <>
          <span className="who">Good to know</span> — most people taking Life &amp; Health study about 7 hours a week.{' '}
          <span className="aside">You're at {mine}.</span>
        </>
      )}
    </div>
  )
}
