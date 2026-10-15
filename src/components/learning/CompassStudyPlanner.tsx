import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, Check, ChevronLeft, ChevronRight, RubiMark } from '@/icons'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import {
  PLANNER_BREAK_WEEK,
  PLANNER_HOWTO,
  PLANNER_LEGEND,
  PLANNER_META_LEAD,
  PLANNER_NORM_MINUTES,
  PLANNER_PACES,
  PLANNER_PLAN,
  PLANNER_RUBI_FALLBACK,
  PLANNER_RUBI_HEAD,
  PLANNER_RUBI_NOTHING_TO_UNDO,
  PLANNER_RUBI_PLACEHOLDER,
  PLANNER_RUBI_SEED,
  PLANNER_RUBI_UNDONE,
  PLANNER_SLIDER_RANGE,
  PLANNER_STARTERS,
  PLANNER_TITLE,
  type DayMinutes,
  type PlannerStarterId,
} from '@/data/compassStudyPlannerFixtures'
import {
  DOW_SHORT,
  copyMinutes,
  cursorForView,
  dayKey,
  daysAway,
  finishReadback,
  finishText,
  fmtHM,
  fmtLong,
  fmtShort,
  keysBetween,
  midnight,
  monthCells,
  paceName,
  periodLabel,
  sameDay,
  schedule,
  stepCursor,
  weekCells,
  weeklyMinutes,
} from './compassStudyPlannerModel'
import './compassStudyPlanner.css'

/**
 * THE STUDY PLANNER — what the Compass rail's "Study planner" row opens on
 * Anjani's surface, 2026-10-15. Her `screen-planner` from the OCT2 master of
 * `xcel-compass-nudge-journey.html`, which arrived "merged from
 * compass-study-planner-standalone"; from 2026-10-08 until then the row opened
 * on `CompassPageBody`'s empty ground.
 *
 * One page, one setup flow. The only difference between her two concepts is
 * whether the learner's package includes Rubi — `compass-planner-rubi`, a
 * design control here where her file draws a dashed "Prototype" toggle.
 * Inputs come from onboarding (fixed, see the fixtures); the planner reads
 * them back and lets the learner adjust. Days off are collected here.
 *
 * ⚠ THE FLOW IS HERS, INCLUDING THE PARTS THAT LOOK ODD. Closed → "Change
 * pace"; open and untouched → "Done", which just closes; open with unsaved
 * changes → the button is HIDDEN, because Save plan and Undo changes are the
 * only two honest ways out and a third control would muddy which one saves.
 * Rubi's changes undo newest-first, one at a time, and the Undo button sits on
 * whichever applied line is next. The three starters are for the first turn
 * only. Anything typed that is not "undo" gets her prototype's own
 * "in the real thing I'd act on this" reply — scaffolding kept, not hidden,
 * because a reply that pretended to understand would be worse.
 *
 * ⚠ ONE DEPARTURE, DELIBERATE. Her `plFlashDow` flashes the days of the week
 * that a starter CHANGED, computed after the change — so "Fridays are clear"
 * flashed nothing, since no Friday had a session left. Here the cells that
 * flash are the ones whose plan differs before and after, which is what the
 * flash was for. A reviewer comparing the two will see Fridays light up on
 * ours and not on hers; that is the reason.
 *
 * ⚠ EVERYTHING HERE IS LOCAL STATE. Save plan saves nothing anywhere — it
 * clears the dirty flag, closes the editor and says "Plan saved.", exactly as
 * her file does. Nothing reads or writes `examDateStore`, the study calendar
 * or the pace flags; see the fixtures for why not yet.
 */

type View = 'month' | 'week'
type Snapshot = { dayMins: DayMinutes; off: Set<string>; label: string; line: number }
type RubiLine =
  | { kind: 'r' | 'u'; id: number; text: ReactNode }
  | { kind: 'applied'; id: number; text: string; before: string; after: string }

const { today, exam, minsLeft } = PLANNER_PLAN

function seedLines(): RubiLine[] {
  return [
    {
      kind: 'r',
      id: -2,
      text: (
        <>
          {PLANNER_RUBI_SEED.before}
          <b>{PLANNER_RUBI_SEED.pace}</b>
          {PLANNER_RUBI_SEED.after}
        </>
      ),
    },
    { kind: 'r', id: -1, text: PLANNER_RUBI_SEED.second },
  ]
}

/** What Rubi says after each starter — her words, with the finish dates she
 *  quotes filled in. */
function starterReply(id: PlannerStarterId, before: string, after: string): string {
  switch (id) {
    case 'fri':
      return after === "won't fit"
        ? 'Fridays are clear. That takes you to six hours a week, and it no longer fits before your exam. Want me to move that time to another day?'
        : `Fridays are clear. Your finish moves from ${before} to ${after}.`
    case 'faster':
      return `I've moved you to the Crammer pace — two and a half hours on weekdays. That takes your finish from ${before} to ${after}, which is a bit more than two weeks. Undo if that's too much.`
    case 'break':
      return before === after
        ? 'That whole week is blocked. Your plan already finishes before it, so nothing else moves.'
        : `That whole week is blocked. Your sessions shift past it, so the finish moves from ${before} to ${after}.`
  }
}

export function CompassStudyPlanner() {
  const rubi = useFeatureFlag('compass-planner-rubi').enabled

  const [dayMins, setDayMins] = useState<DayMinutes>(() => copyMinutes(PLANNER_PLAN.dayMins))
  const [off, setOff] = useState<Set<string>>(() => new Set())
  const [view, setView] = useState<View>('month')
  const [cursor, setCursor] = useState<Date>(PLANNER_PLAN.cursor)
  const [editOpen, setEditOpen] = useState(false)
  /** The plan as it was before the first edit — non-null IS the dirty flag. */
  const [savedPlan, setSavedPlan] = useState<DayMinutes | null>(null)
  const [flash, setFlash] = useState<Set<string>>(() => new Set())
  const [toast, setToast] = useState<string | null>(null)
  const [lastClick, setLastClick] = useState<string | null>(null)

  const [lines, setLines] = useState<RubiLine[]>(seedLines)
  const [stack, setStack] = useState<Snapshot[]>([])
  const [startersUsed, setStartersUsed] = useState(false)
  const [draft, setDraft] = useState('')
  const seq = useRef(0)
  const nextId = () => ++seq.current
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const timers = useRef<number[]>([])
  const later = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const sched = useMemo(() => schedule({ today, exam, minsLeft, dayMins, off }), [dayMins, off])
  const readback = finishReadback(sched, dayMins, exam)
  const weekly = weeklyMinutes(dayMins)
  const dirty = savedPlan !== null
  const pace = paceName(dayMins)

  /* Switching the concept re-seeds the panel, as her `plSetRubi(true)` does —
     adjusted during render against the last value seen, the pattern React
     recommends over an effect that calls setState. The plan itself (pace,
     days off) survives the switch, as it does in her file. */
  const [seededFor, setSeededFor] = useState(rubi)
  if (seededFor !== rubi) {
    setSeededFor(rubi)
    if (rubi) {
      setLines(seedLines())
      setStack([])
      setStartersUsed(false)
    }
  }
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  const flashKeys = (keys: Iterable<string>) => {
    setFlash(new Set(keys))
    later(1200, () => setFlash(new Set()))
  }
  const say = (text: ReactNode, who: 'r' | 'u' = 'r') =>
    setLines((l) => [...l, { kind: who, id: nextId(), text }])
  const applied = (text: string, before: string, after: string, line: number) =>
    setLines((l) => [...l, { kind: 'applied', id: line, text, before, after }])

  /* ---- learner controls (both concepts) ---- */
  const mark = () => {
    if (!dirty) setSavedPlan(copyMinutes(dayMins))
  }
  const setPace = (id: string) => {
    const p = PLANNER_PACES.find((x) => x.id === id)
    if (!p) return
    mark()
    setDayMins(copyMinutes(p.mins))
  }
  const setDay = (n: number, v: number) => {
    mark()
    setDayMins((m) => {
      const next = copyMinutes(m)
      next[n] = v
      return next
    })
  }
  const savePlan = () => {
    setSavedPlan(null)
    setEditOpen(false)
    setToast('Plan saved.')
    later(2600, () => setToast(null))
  }
  const undoChanges = () => {
    if (savedPlan) setDayMins(copyMinutes(savedPlan))
    setSavedPlan(null)
    setEditOpen(false)
  }
  const toggleEdit = () => {
    setEditOpen((open) => {
      if (open && dirty) setSavedPlan(null)
      return !open
    })
  }
  const toggleDay = (key: string, shift: boolean) => {
    setOff((prev) => {
      const next = new Set(prev)
      if (shift && lastClick) {
        const blocking = !prev.has(key)
        const range = keysBetween(lastClick, key)
        range.forEach((k) => (blocking ? next.add(k) : next.delete(k)))
        flashKeys(range)
      } else if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    setLastClick(key)
  }
  const changeView = (v: View) => {
    setView(v)
    setCursor((c) => cursorForView(v, c, today))
  }

  /* ---- Rubi: the chat rebuilds the calendar as it goes ---- */
  const runStarter = (id: PlannerStarterId) => {
    const starter = PLANNER_STARTERS.find((s) => s.id === id)
    if (!starter) return
    setStartersUsed(true)
    say(starter.label, 'u')
    const before = finishText(sched, dayMins)
    const snap: Snapshot = { dayMins: copyMinutes(dayMins), off: new Set(off), label: starter.done, line: nextId() }
    let nextMins = copyMinutes(dayMins)
    const nextOff = new Set(off)
    if (id === 'fri') nextMins[5] = 0
    if (id === 'faster') nextMins = copyMinutes(PLANNER_PACES[0].mins)
    if (id === 'break') {
      for (let d = PLANNER_BREAK_WEEK.from; d <= PLANNER_BREAK_WEEK.to; d++) {
        nextOff.add(dayKey(new Date(today.getFullYear(), PLANNER_BREAK_WEEK.month, d)))
      }
      setCursor(new Date(today.getFullYear(), PLANNER_BREAK_WEEK.month, 1))
      setView('month')
    }
    const nextSched = schedule({ today, exam, minsLeft, dayMins: nextMins, off: nextOff })
    const changed = new Set<string>()
    for (const k of Object.keys(sched.map)) if (!nextSched.map[k]) changed.add(k)
    for (const k of Object.keys(nextSched.map)) if (!sched.map[k]) changed.add(k)
    if (id === 'break') for (const k of nextOff) if (!off.has(k)) changed.add(k)
    setDayMins(nextMins)
    setOff(nextOff)
    flashKeys(changed)
    const after = finishText(nextSched, nextMins)
    later(260, () => {
      say(starterReply(id, before, after))
      applied(starter.done, before, after, snap.line)
      setStack((s) => [...s, snap])
    })
  }
  const undoRubi = () => {
    const snap = stack[stack.length - 1]
    if (!snap) return
    const before = finishText(sched, dayMins)
    const restored = schedule({ today, exam, minsLeft, dayMins: snap.dayMins, off: snap.off })
    setStack((s) => s.slice(0, -1))
    setDayMins(copyMinutes(snap.dayMins))
    setOff(new Set(snap.off))
    say(PLANNER_RUBI_UNDONE)
    applied(`Undid: ${snap.label}`, before, finishText(restored, snap.dayMins), nextId())
  }
  const send = () => {
    const v = draft.trim()
    if (!v) return
    setDraft('')
    setStartersUsed(true)
    say(v, 'u')
    if (/^\s*undo\b/i.test(v)) {
      if (stack.length) later(240, undoRubi)
      else later(240, () => say(PLANNER_RUBI_NOTHING_TO_UNDO))
      return
    }
    later(280, () => say(PLANNER_RUBI_FALLBACK))
  }

  /* ---- calendar ---- */
  const cells = view === 'month' ? monthCells(cursor) : weekCells(cursor)
  const undoLine = stack[stack.length - 1]?.line

  return (
    <div className={`cre-planner${rubi ? '' : ' cre-planner--wide'}`} role="region" aria-label="Study planner">
      <main className="cre-planner__main">
        <div className="cre-planner__inner">
          <div className="cre-planner__top">
            <div>
              <h1>{PLANNER_TITLE}</h1>
              <p className="cre-planner__meta">
                {PLANNER_META_LEAD} · Exam <b>{fmtLong(exam)}</b>
              </p>
            </div>
          </div>

          <section className="cre-planner__bar" aria-label="Your plan">
            <div className="cre-planner__row">
              <div className="cre-planner__f">
                <div className="k">Your exam</div>
                <div className="v">{fmtShort(exam)}</div>
                <div className="s">{daysAway(today, exam)} days away</div>
              </div>
              <div className="cre-planner__f">
                <div className="k">Your pace</div>
                <div className="v">{pace}</div>
                <div className="s">{weekly ? `${fmtHM(weekly)} a week` : 'no study time set'}</div>
              </div>
              <div className="cre-planner__f cre-planner__f--lead">
                <div className="k">Course finishes</div>
                <div className="v">{readback.finish}</div>
                <div className={`s s--${readback.tone}`} role="status" aria-live="polite">
                  {readback.status}
                </div>
              </div>
              {editOpen && dirty ? null : (
                <button type="button" className="cre-planner__btn-out" onClick={toggleEdit}>
                  {editOpen ? 'Done' : 'Change pace'}
                </button>
              )}
            </div>

            {editOpen ? (
              <div className="cre-planner__edit">
                <p className="cre-planner__lbl">Pick a pace</p>
                <div className="cre-planner__paces" role="group" aria-label="Pick a pace">
                  {PLANNER_PACES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={p.name === pace}
                      onClick={() => setPace(p.id)}
                    >
                      <span className="pn">{p.name}</span>
                      <span className="ph">{fmtHM(weeklyMinutes(p.mins))} a week</span>
                    </button>
                  ))}
                </div>
                <p className="cre-planner__lbl">
                  Spread it across your week
                  <span className="sub">weekends can be different from weekdays</span>
                  <span className="tot">{weekly ? `${fmtHM(weekly)} a week` : 'nothing set'}</span>
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
                        value={dayMins[n]}
                        aria-label={`${dn} study time`}
                        aria-valuetext={dayMins[n] ? fmtHM(dayMins[n]) : 'none'}
                        onChange={(e) => setDay(n, Number(e.target.value))}
                      />
                      <span className={`dv${dayMins[n] ? '' : ' dv--zero'}`}>{fmtHM(dayMins[n])}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {weekly && weekly < PLANNER_NORM_MINUTES ? (
              <NormNote rubi={rubi} weekly={weekly} />
            ) : null}

            {toast ? (
              <p className="cre-planner__toast" role="status">
                {toast}
              </p>
            ) : null}
            {editOpen && dirty ? (
              <div className="cre-planner__save">
                <span className="m">You've changed your pace.</span>
                <button type="button" className="go" onClick={savePlan}>
                  Save plan
                </button>
                <button type="button" className="undo" onClick={undoChanges}>
                  Undo changes
                </button>
              </div>
            ) : null}
          </section>

          <div className="cre-planner__ctl">
            <h2>{periodLabel(view, cursor)}</h2>
            <div className="cre-planner__arrows">
              <button type="button" onClick={() => setCursor((c) => stepCursor(view, c, -1))} aria-label="Previous">
                <ChevronLeft size={15} aria-hidden />
              </button>
              <button type="button" onClick={() => setCursor((c) => stepCursor(view, c, 1))} aria-label="Next">
                <ChevronRight size={15} aria-hidden />
              </button>
            </div>
            <div className="cre-planner__vtoggle" role="group" aria-label="Calendar view">
              <button type="button" aria-pressed={view === 'month'} onClick={() => changeView('month')}>
                Month
              </button>
              <button type="button" aria-pressed={view === 'week'} onClick={() => changeView('week')}>
                Week
              </button>
            </div>
          </div>

          <p className="cre-planner__howto">{PLANNER_HOWTO}</p>
          <div className="cre-planner__dow" aria-hidden>
            {DOW_SHORT.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className={`cre-planner__grid${view === 'week' ? ' cre-planner__grid--week' : ''}`}>
            {cells.map(({ date, pad }) => {
              const key = dayKey(date)
              const isExam = sameDay(date, exam)
              const isToday = sameDay(date, today)
              const past = midnight(date) < midnight(today)
              const plan = sched.map[key]
              const blocked = off.has(key)
              const offDay =
                !past &&
                !isExam &&
                !plan &&
                (blocked || (sched.finish != null && midnight(date) <= midnight(sched.finish)))
              const cls = ['cre-planner__day']
              if (pad) cls.push('cre-planner__day--pad')
              if (past) cls.push('cre-planner__day--past')
              if (isToday) cls.push('cre-planner__day--today')
              if (isExam) cls.push('cre-planner__day--exam')
              else if (offDay) cls.push('cre-planner__day--off')
              if (flash.has(key)) cls.push('cre-planner__day--changed')
              const body = isExam ? (
                <span className="cre-planner__chip cre-planner__chip--exam">Exam day</span>
              ) : plan ? (
                <>
                  <span className="cre-planner__chip cre-planner__chip--sess">{plan.topic}</span>
                  <span className="cre-planner__mins">{fmtHM(plan.mins)}</span>
                  {plan.review ? (
                    <span className="cre-planner__chip cre-planner__chip--rev">Spaced review</span>
                  ) : null}
                </>
              ) : offDay && !pad ? (
                <span className="cre-planner__offmark">Off</span>
              ) : null
              const clickable = !past && !isExam && !pad
              const aria =
                `${DOW_SHORT[date.getDay()]} ${fmtShort(date)}` +
                (plan
                  ? `, ${plan.topic}, ${fmtHM(plan.mins)}${plan.review ? ', plus spaced review' : ''}`
                  : offDay
                    ? ', day off'
                    : '')
              return clickable ? (
                <button
                  key={key}
                  type="button"
                  className={cls.join(' ')}
                  aria-pressed={offDay}
                  aria-label={aria}
                  onClick={(e) => toggleDay(key, e.shiftKey)}
                >
                  <span className="num">{date.getDate()}</span>
                  {body}
                </button>
              ) : (
                <div key={key} className={cls.join(' ')}>
                  <span className="num">{date.getDate()}</span>
                  {body}
                </div>
              )
            })}
          </div>

          <div className="cre-planner__legend" aria-label="Legend">
            {PLANNER_LEGEND.map((l) => (
              <span className="li" key={l.id}>
                <span className={`sw sw--${l.id}`} aria-hidden>
                  {l.id === 'off' ? '14' : null}
                </span>
                {l.label}
              </span>
            ))}
          </div>
        </div>
      </main>

      {rubi ? (
        <aside className="cre-planner__rubi" aria-label="Rubi">
          <div className="cre-planner__rhead">
            <RubiMark width={30} aria-hidden />
            <div>
              <div className="nm">{PLANNER_RUBI_HEAD.name}</div>
              <div className="tg">{PLANNER_RUBI_HEAD.tagline}</div>
            </div>
          </div>
          <div className="cre-planner__rscroll" ref={scrollRef} role="log" aria-label="Conversation">
            {lines.map((line) =>
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
                    <button
                      type="button"
                      className="cre-planner__undo"
                      onClick={undoRubi}
                      aria-label={`Undo: ${line.text}`}
                    >
                      Undo
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className={`cre-planner__msg cre-planner__msg--${line.kind}`} key={`m-${line.id}`}>
                  <p className="tx">{line.text}</p>
                </div>
              ),
            )}
          </div>
          <div className="cre-planner__rfoot">
            {startersUsed ? null : (
              <div className="cre-planner__pills">
                {PLANNER_STARTERS.map((s) => (
                  <button type="button" key={s.id} onClick={() => runStarter(s.id)}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
            <div className="cre-planner__rinp">
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

/* What learners on this course usually do. It is context, not a rule — the
   learner is free to ignore it, so it never blocks saving and never nags. Only
   drawn under the norm; Average (7h 30m) sits above it, so a fresh page shows
   nothing here. */
function NormNote({ rubi, weekly }: { rubi: boolean; weekly: number }) {
  const mine = fmtHM(weekly)
  return (
    <div className={`cre-planner__norm${rubi ? ' cre-planner__norm--rubi' : ''}`}>
      {rubi ? (
        <>
          <span className="who">
            <RubiMark width={13} aria-hidden />
            Rubi
          </span>{' '}
          — you're at {mine} a week. Most people taking Life &amp; Health settle around 7 hours.{' '}
          <span className="aside">Yours still works if that is what your week allows.</span>
        </>
      ) : (
        <>
          <span className="who">Good to know</span> — most people taking Life &amp; Health study about 7
          hours a week. <span className="aside">You're at {mine}.</span>
        </>
      )}
    </div>
  )
}
