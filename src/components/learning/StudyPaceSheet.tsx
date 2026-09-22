import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { X } from '@/icons'
import {
  studyPace,
  defaultPreset,
  formatEvening,
  formatEveningSpoken,
  formatPaceDate,
  isoFromDate,
  daysUntil,
  STYLE_FACTORS,
  WEEKDAY_LABELS,
  defaultWeekdays,
  type PacePreset,
  type PresetId,
  type StudyStyle,
  simulateSchedule,
  scheduleStanding,
  scheduleAdvice,
  hoursPerDayWithin,
  evenWeek,
  activeDays,
  formatHours,
  type ScheduleSim,
  type ScheduleStanding,
} from '@/lib/studyPace'

/**
 * The Adjust sheet — everything the Study Pace tile deliberately does not carry.
 *
 * FOUR GROUPS, in this order, and the order is the argument:
 *
 *   1. **What are you aiming at** — the three finish dates as radio rows. A
 *      preset is a DATE, not a weekly quota; the evening it costs is shown
 *      beside it as a consequence, not as the thing being chosen.
 *   2. **How many days a week** — the only lever that changes the shape of the
 *      week without moving the date.
 *   3. **Your state exam** — optional. TWO CEILINGS can bind (access expiry, and
 *      the exam minus its review buffer) and the sheet SAYS which one is doing
 *      the work. A pace that silently switched ceilings is how a learner stops
 *      believing the number.
 *   4. **Create a study plan** — a switch. Off by default.
 *
 * **The weekday picker exists only under 4**, and that is the one structural
 * decision worth not undoing: days-a-week is all the PACE needs, so that is all
 * groups 1–3 ask for. A calendar cannot be built without real weekdays and a
 * time, so those questions arrive with the thing that needs them — and from
 * then on ticking days is authoritative and re-prices the evening, rather than
 * letting the count and the calendar quietly disagree.
 *
 * ─── REBUILT 2026-09-21 ──────────────────────────────────────────────────
 *
 * The four groups, the binding note, the weekday rule, `presetLabel`'s
 * conditional word, the dated session preview and every `data-*` hook are
 * unchanged — they are why this component exists. What changed:
 *
 *   • **IT CLIPPED ITS OWN FOOTER.** The sheet rendered two children into a
 *     panel that is `display:flex; column; overflow:hidden`, so the content
 *     grew past the panel edge and Save was unreachable with the plan open.
 *     It is now header / scroll body / footer, and `min-height: 0` on the body
 *     is the line that actually fixes it.
 *   • **THE SAVE CONTRACT IS SETTLED** — see `PaceSheetBody`. It used to write
 *     preset/nights/exam straight through while `plan` waited for the button,
 *     so "Save pace" was already true of three of the four fields and a Cancel
 *     would have restored nothing.
 *   • **STYLES ARE CLASSES** (`cre-pace-sheet__*` in `tokens.css`). Inline
 *     `CSSProperties` cannot carry `:focus-visible` or a theme selector, which
 *     is why the sheet had no visible focus ring and two of its grounds assumed
 *     a light background.
 *   • Type floor of `--text-body-sm`; roving tabindex on both radio groups;
 *     `aria-disabled` on the row that cannot be chosen; spoken durations.
 *
 * `Sheet` itself is untouched (its missing focus trap is ticketed separately).
 * Everything here is done from INSIDE the children, which its flex column
 * makes possible.
 */

export type PaceApproach = 'sprint' | 'evenings' | 'blocks' | 'custom'

export type PaceChoices = {
  /** `null` ⇒ the learner has not chosen; the model's Recommended stands. */
  presetId: PresetId | null
  nights: number | null
  /** ISO yyyy-mm-dd. */
  examDate: string | null
  style: StudyStyle
  /** Which shaped answer the learner came through, or `null` for Recommended.
   *  Kept so re-opening the sheet returns to the screen they built on rather
   *  than to the chooser — a plan you cannot get back to is a plan you rebuild. */
  approach: PaceApproach | null
  /** Seven HOURS, Monday-first — the week the learner actually built, and the
   *  input {@link simulateSchedule} walks. `null` ⇒ no schedule, the derived
   *  pace stands. */
  schedule: number[] | null
  /** Set once a study plan is built — weekdays are 0=Mon … 6=Sun. */
  plan: { weekdays: number[]; startTime: string } | null
}

/* MOVED to `@/lib/studyPace` on 2026-09-21 — the `presets` card draws the
   same strip, and two surfaces deriving "which nights" apart from each other is
   how one comes to shade Mon–Thu while the plan behind it builds Mon–Wed + Fri. */
const WEEKDAYS = WEEKDAY_LABELS
/** The time of day the calendar proposes before the learner changes it. An
 *  evening default assumes a working adult, which is who buys this course. */
const DEFAULT_START_TIME = '19:00'

const RECOMMENDED: PaceChoices = {
  presetId: null,
  nights: null,
  examDate: null,
  style: 'average',
  approach: null,
  schedule: null,
  plan: null,
}

/** Weeknight evening lengths the Evenings screen offers, in hours. Stops at 3:
 *  past that it is not an evening, it is the `blocks` screen. */
const EVENING_CHOICES = [1, 1.5, 2, 2.5, 3] as const
/** Sprint windows, in days. */
const SPRINT_WINDOWS = [7, 10, 14] as const
/** The most any single day may be set to. Eight hours is a working day, and a
 *  learner who genuinely has more than that does not need this screen. */
const MAX_DAY_HOURS = 8

/** Mon-first index of a `Date`'s weekday — `getDay()` is Sunday-first, and the
 *  whole module is Monday-first. Written once and used everywhere here. */
function weekdayOf(d: Date): number {
  return (d.getDay() + 6) % 7
}

export function StudyPaceSheet(props: {
  open: boolean
  onClose: () => void
  today: Date
  hoursRemaining: number
  accessExpiresAt?: string
  courseTitle?: string
  choices: PaceChoices
  onChange: (next: PaceChoices) => void
}) {
  return (
    <Sheet open={props.open} onClose={props.onClose} title="Adjust your pace" width={460}>
      {/* MOUNTED ONLY WHILE OPEN, and that is what seeds the draft. `Sheet`
          returns null when closed but THIS component stays mounted, so state
          held out here would survive a close and a re-open — a discarded draft
          coming back the next time the sheet opens. An inner component that
          unmounts with the panel gets fresh `useState` initialisers from
          `choices` every time, with no effect to synchronise and no
          `set-state-in-effect` lint to argue with. */}
      {props.open ? <PaceSheetBody {...props} /> : null}
    </Sheet>
  )
}

/**
 * THE SAVE CONTRACT: **everything in this sheet is a draft.**
 *
 * It used to be neither one thing nor the other — `set()` wrote preset, nights
 * and exam date straight to the parent on every click while `plan` alone waited
 * for the button. So the tile re-priced behind an open sheet, "Save pace"
 * described one field in four, and a Cancel button would have had nothing to
 * restore.
 *
 * Everything now lives here and `onChange` fires ONCE, from Save. Cancel,
 * Escape and a scrim click are the same path — they unmount this component and
 * the draft goes with it, which is why discarding needs no handler of its own.
 *
 * ⚠ THE SCREEN IS PART OF THE DRAFT TOO. Moving between the chooser and a style
 * screen changes nothing the learner has saved; `approach` only reaches the
 * parent on Save, so backing out of "Finish fast" leaves the pace they arrived
 * with rather than a half-built one.
 */
function PaceSheetBody({
  onClose,
  today,
  hoursRemaining,
  accessExpiresAt,
  courseTitle,
  choices,
  onChange,
}: {
  onClose: () => void
  today: Date
  hoursRemaining: number
  accessExpiresAt?: string
  courseTitle?: string
  choices: PaceChoices
  onChange: (next: PaceChoices) => void
}) {
  /* RE-OPENS WHERE THEY LEFT OFF. A learner who built an evenings plan and
     comes back to nudge Thursday should land on the evenings screen, not be
     made to re-choose the style they already chose. */
  const [screen, setScreen] = useState<PaceApproach | null>(choices.approach)
  /** Read-only here: nothing on these screens edits the exam date or the
   *  style, and Save spreads this to keep them. Kept as the draft rather than
   *  read from `choices` so the save contract has one source. */
  const [draft] = useState<PaceChoices>(choices)
  const [startTime, setStartTime] = useState(choices.plan?.startTime ?? DEFAULT_START_TIME)
  const [addToCalendar, setAddToCalendar] = useState(choices.plan != null)

  const model = useMemo(
    () =>
      studyPace({
        today,
        hoursRemaining,
        accessExpiresAt,
        examDate: draft.examDate ?? undefined,
        nights: draft.nights ?? undefined,
        style: draft.style,
      }),
    [today, hoursRemaining, accessExpiresAt, draft.examDate, draft.nights, draft.style],
  )
  const recommended = defaultPreset(model)

  /* THE FOUR SCREENS' OWN STATE, seeded from the saved schedule where it can be
     read back and from sensible starts where it cannot. Held together rather
     than per-screen so that flipping between two styles to compare them does
     not wipe the one you just left. */
  const seed = choices.schedule
  const [sprint, setSprint] = useState({
    windowDays: 10 as number,
    weekdays: seed ? activeDays(seed) : [0, 1, 2, 3, 4, 5, 6],
  })
  const [evenings, setEvenings] = useState({
    hours: 2,
    weeknights: seed ? activeDays(seed).filter((d) => d <= 4) : [0, 1, 2, 3, 4],
    sat: seed?.[5] ?? 0,
    sun: seed?.[6] ?? 0,
  })
  const [blocks, setBlocks] = useState<number[]>(
    seed ?? [0, 0, 0, 2, 0, 6, 6],
  )
  const [custom, setCustom] = useState({
    mode: 'date' as 'date' | 'hours',
    finishIso: recommended.finishIso,
    weekdays: seed ? activeDays(seed) : defaultWeekdays(recommended.nights),
    hours: 2,
    perDay: false,
    per: seed ?? [2, 2, 2, 2, 2, 3, 3],
  })

  /** The week the current screen describes — the ONE value every outcome, badge,
   *  calendar and summary on this sheet reads. Each screen's job is to produce
   *  it; nothing downstream knows which screen it came from. */
  const week: number[] | null = useMemo(() => {
    if (screen === 'sprint') {
      const perDay = hoursPerDayWithin({
        today,
        hoursRemaining,
        weekdays: sprint.weekdays,
        windowDays: sprint.windowDays,
      })
      return perDay ? evenWeek(sprint.weekdays, perDay) : evenWeek(sprint.weekdays, 0)
    }
    if (screen === 'evenings') {
      const w = evenWeek(evenings.weeknights, evenings.hours)
      w[5] = evenings.sat
      w[6] = evenings.sun
      return w
    }
    if (screen === 'blocks') return blocks
    if (screen === 'custom') {
      if (custom.mode === 'date') {
        const span = Math.max(1, daysUntil(custom.finishIso, today) ?? 1)
        const perDay = hoursPerDayWithin({
          today,
          hoursRemaining,
          weekdays: custom.weekdays,
          windowDays: span + 1,
        })
        return evenWeek(custom.weekdays, perDay)
      }
      return custom.perDay
        ? custom.per.map((h, i) => (custom.weekdays.includes(i) ? h : 0))
        : evenWeek(custom.weekdays, custom.hours)
    }
    return null
  }, [screen, today, hoursRemaining, sprint, evenings, blocks, custom])

  const sim = useMemo(
    () =>
      week
        ? simulateSchedule({ today, hoursRemaining, hoursByWeekday: week, hardEndIso: model.hardEndIso })
        : null,
    [week, today, hoursRemaining, model.hardEndIso],
  )
  const standing = scheduleStanding(sim, model.binding)
  const advice = scheduleAdvice(sim)

  /** What the dashboard will say if this is saved — shown in the footer BEFORE
   *  the learner commits, which is the prototype's best idea: the consequence
   *  of the button is written next to the button. */
  const summary = sim
    ? `${formatHours(sim.hoursPerWeek)} a week over ${sim.daysPerWeek} ${
        sim.daysPerWeek === 1 ? 'day' : 'days'
      }, finishing around ${formatPaceDate(sim.finishIso)}.`
    : null

  const save = () => {
    const days = week ? activeDays(week) : []
    onChange({
      ...draft,
      approach: screen,
      schedule: week,
      nights: days.length || null,
      plan: addToCalendar && days.length ? { weekdays: days, startTime } : null,
    })
    onClose()
  }

  return (
    <div className="cre-pace-sheet" style={sheetShell}>
      <header className="cre-pace-sheet__header">
        {/* `aria-hidden` on the visible title: `Sheet` already renders an
            sr-only one for its `aria-labelledby`, and two copies of the same
            string give the dialog a doubled accessible name. */}
        <h2 className="cre-pace-sheet__title" aria-hidden>
          Adjust your pace
        </h2>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="cre-pace-sheet__text-button"
          style={{ textDecoration: 'none' }}
        >
          <X size={18} aria-hidden />
        </button>
      </header>

      <div className="cre-pace-sheet__body">
        <p className="cre-pace-sheet__hint">
          {Math.round(hoursRemaining)} hours left{courseTitle ? ` of ${courseTitle}` : ''}
          {accessExpiresAt ? ` · access ends ${formatPaceDate(accessExpiresAt)}` : ''}.
        </p>

        {screen == null ? (
          <Chooser recommended={recommended} model={model} onPick={setScreen} />
        ) : (
          <>
            <button
              type="button"
              onClick={() => setScreen(null)}
              className="cre-pace-sheet__text-button cre-pace-sheet__back"
            >
              ‹ All pace styles
            </button>

            {screen === 'sprint' && (
              <SprintScreen today={today} state={sprint} onChange={setSprint} />
            )}
            {screen === 'evenings' && <EveningsScreen state={evenings} onChange={setEvenings} />}
            {screen === 'blocks' && <BlocksScreen hours={blocks} onChange={setBlocks} />}
            {screen === 'custom' && (
              <CustomScreen
                today={today}
                hardEndIso={model.hardEndIso}
                state={custom}
                onChange={setCustom}
              />
            )}

            {/* ONE OUTCOME BOX, whichever screen produced the week. Four screens
                each rendering their own verdict is four places for the rule to
                drift, and the rule is the thing this sheet is for. */}
            <Outcome sim={sim} standing={standing} advice={advice} />
            <BindingNote
              model={model}
              today={today}
              accessExpiresAt={accessExpiresAt}
              examDate={draft.examDate}
            />
            <PlanCalendar today={today} sim={sim} hardEndIso={model.hardEndIso} />

            <Group label="Put it on a calendar">
              <SwitchRow
                checked={addToCalendar}
                onToggle={() => setAddToCalendar((v) => !v)}
                title="Add each session to my Study Plan"
                body={
                  sim
                    ? 'Writes every session above onto your Study Plan.'
                    : 'Once there is a pace that fits.'
                }
              />
              {addToCalendar && sim ? (
                <>
                  <Field label="Usual start time" htmlFor="pace-time">
                    <input
                      id="pace-time"
                      type="time"
                      className="cre-pace-sheet__input"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value || DEFAULT_START_TIME)}
                    />
                  </Field>
                  <SessionPreview
                    today={today}
                    preset={recommended}
                    weekdays={week ? activeDays(week) : []}
                    startTime={startTime}
                  />
                </>
              ) : null}
            </Group>
          </>
        )}
      </div>

      {/* A SIBLING of the scroll body, not the last thing inside it — pinned,
          always reachable, and the reason the panel can no longer clip it. */}
      <footer className="cre-pace-sheet__footer">
        {screen == null ? (
          <>
            <Button
              onClick={() => {
                onChange({ ...RECOMMENDED, examDate: draft.examDate })
                onClose()
              }}
            >
              Keep recommended
            </Button>
            <button type="button" onClick={onClose} className="cre-pace-sheet__text-button">
              Cancel
            </button>
          </>
        ) : (
          <>
            {/* THE CONSEQUENCE BESIDE THE BUTTON. A learner should not have to
                press Save to learn what Save does to the card they came from. */}
            <p className="cre-pace-sheet__summary" aria-live="polite">
              {summary ? (
                <>
                  <b>Your dashboard will show:</b> {summary}
                </>
              ) : (
                <>Add some study time to see what this changes.</>
              )}
            </p>
            <Button onClick={save} disabled={!sim}>
              {addToCalendar ? 'Save pace & plan' : 'Save pace'}
            </Button>
            <button type="button" onClick={onClose} className="cre-pace-sheet__text-button">
              Cancel
            </button>
          </>
        )}
      </footer>
    </div>
  )
}

/* ── SCREEN 0 · THE CHOOSER ──────────────────────────────────────────────── */

const APPROACHES: { id: PaceApproach; title: string; body: string }[] = [
  {
    id: 'sprint',
    title: 'Finish fast',
    body: 'I have most of the day free and want to be done in a week or two.',
  },
  {
    id: 'evenings',
    title: 'Evenings only',
    body: 'My days are busy. I will set what I can manage on a weeknight.',
  },
  {
    id: 'blocks',
    title: 'Long sessions on free days',
    body: 'My week changes. I would rather do long sessions on the days I am free.',
  },
  {
    id: 'custom',
    title: 'Build my own',
    body: 'None of these fit. I will set my own days, hours or finish date.',
  },
]

/**
 * Recommended first, then the four shapes.
 *
 * THE ORDER IS THE ARGUMENT, and it is the prototype's: most learners should
 * take the recommendation, so it is stated as an answer rather than offered as
 * an option — the footer's primary button accepts it. The four styles are for
 * the learner whose week the recommendation does not fit, and they are phrased
 * as LIVES ("my days are busy"), not as settings, because the learner knows
 * their week and does not know our vocabulary for it.
 */
function Chooser({
  recommended,
  model,
  onPick,
}: {
  recommended: PacePreset
  model: ReturnType<typeof studyPace>
  onPick: (a: PaceApproach) => void
}) {
  const fits = recommended.state !== 'no'
  return (
    <>
      <div className="cre-pace-sheet__recommend">
        <span className="cre-pace-sheet__group-label">Recommended for you</span>
        {fits ? (
          <>
            <span className="cre-pace-sheet__outcome-figure">
              {formatEvening(recommended.minsPerNight)} a night, {recommended.nights} days a week
            </span>
            <span className="cre-pace-sheet__hint">
              Finishing around{' '}
              <b className="cre-pace-sheet__strong">{formatPaceDate(recommended.finishIso)}</b>.
              <span className="cre-sr-only">
                {' '}
                That is {formatEveningSpoken(recommended.minsPerNight)} on each study evening.
              </span>
            </span>
          </>
        ) : (
          /* NO FIGURE when nothing fits — the same rule the tile keeps. A pace
             past the ceiling has no honest number, and the answer is more time
             or fewer lessons rather than a bigger one. */
          <span className="cre-pace-sheet__hint">
            There is no pace we would recommend for the time left. Building your own week below
            will show you what it would actually take.
          </span>
        )}
      </div>

      <Group label="Or pick the style that fits your life">
        {APPROACHES.map((a) => (
          <button
            key={a.id}
            type="button"
            data-shape={a.id}
            className="cre-pace-sheet__option"
            onClick={() => onPick(a.id)}
          >
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="cre-pace-sheet__option-title">{a.title}</span>
              <span className="cre-pace-sheet__option-body">{a.body}</span>
            </span>
            <span aria-hidden style={{ alignSelf: 'center', opacity: 0.6 }}>
              ›
            </span>
          </button>
        ))}
      </Group>

      <p className="cre-pace-sheet__hint" data-binding={model.binding}>
        {model.binding === 'exam'
          ? 'Whichever you pick is measured against your exam date, not just your access.'
          : 'Whichever you pick is measured against the day your access ends.'}
      </p>
    </>
  )
}

/* ── SCREEN 1 · FINISH FAST ──────────────────────────────────────────────── */

function SprintScreen({
  today,
  state,
  onChange,
}: {
  today: Date
  state: { windowDays: number; weekdays: number[] }
  onChange: (s: { windowDays: number; weekdays: number[] }) => void
}) {
  return (
    <>
      <Group label="When do you want to be done?">
        <RadioGroup
          label="Finish within"
          orientation="horizontal"
          className="cre-pace-sheet__segments"
          count={SPRINT_WINDOWS.length}
          activeIndex={Math.max(0, SPRINT_WINDOWS.indexOf(state.windowDays as 7))}
          onMove={(i) => onChange({ ...state, windowDays: SPRINT_WINDOWS[i] })}
        >
          {(itemProps) =>
            SPRINT_WINDOWS.map((n, i) => (
              <Segment
                key={n}
                checked={n === state.windowDays}
                onSelect={() => onChange({ ...state, windowDays: n })}
                {...itemProps(i)}
              >
                {n} days
              </Segment>
            ))
          }
        </RadioGroup>
        <p className="cre-pace-sheet__hint">
          By {formatPaceDate(isoFromDate(addDays(today, state.windowDays - 1)))}.
        </p>
      </Group>
      <WeekdayGroup
        label="Which days can you study?"
        selected={state.weekdays}
        onChange={(weekdays) => onChange({ ...state, weekdays })}
      />
    </>
  )
}

/* ── SCREEN 2 · EVENINGS ONLY ────────────────────────────────────────────── */

function EveningsScreen({
  state,
  onChange,
}: {
  state: { hours: number; weeknights: number[]; sat: number; sun: number }
  onChange: (s: { hours: number; weeknights: number[]; sat: number; sun: number }) => void
}) {
  return (
    <>
      <Group label="How much time do you have on a weeknight?">
        <RadioGroup
          label="Hours on a weeknight"
          orientation="horizontal"
          className="cre-pace-sheet__segments"
          count={EVENING_CHOICES.length}
          activeIndex={Math.max(0, EVENING_CHOICES.indexOf(state.hours as 1))}
          onMove={(i) => onChange({ ...state, hours: EVENING_CHOICES[i] })}
        >
          {(itemProps) =>
            EVENING_CHOICES.map((h, i) => (
              <Segment
                key={h}
                checked={h === state.hours}
                onSelect={() => onChange({ ...state, hours: h })}
                {...itemProps(i)}
              >
                {formatHours(h)}
              </Segment>
            ))
          }
        </RadioGroup>
      </Group>
      <WeekdayGroup
        label="Which weeknights?"
        only={[0, 1, 2, 3, 4]}
        selected={state.weeknights}
        onChange={(weeknights) => onChange({ ...state, weeknights })}
      />
      <Group label="Add weekend time">
        <p className="cre-pace-sheet__hint">
          A little at the weekend means shorter weeknights — not a longer course.
        </p>
        <Stepper
          label="Saturday"
          hours={state.sat}
          onChange={(sat) => onChange({ ...state, sat })}
        />
        <Stepper
          label="Sunday"
          hours={state.sun}
          onChange={(sun) => onChange({ ...state, sun })}
        />
      </Group>
    </>
  )
}

/* ── SCREEN 3 · LONG SESSIONS ────────────────────────────────────────────── */

function BlocksScreen({ hours, onChange }: { hours: number[]; onChange: (h: number[]) => void }) {
  return (
    <Group label="Hours for each day of a typical week">
      <p className="cre-pace-sheet__hint">Leave a day at zero if you are busy.</p>
      {WEEKDAYS.map((d, i) => (
        <Stepper
          key={d}
          label={d}
          hours={hours[i] ?? 0}
          onChange={(h) => onChange(hours.map((x, j) => (j === i ? h : x)))}
        />
      ))}
    </Group>
  )
}

/* ── SCREEN 4 · BUILD MY OWN ─────────────────────────────────────────────── */

type CustomState = {
  mode: 'date' | 'hours'
  finishIso: string
  weekdays: number[]
  hours: number
  perDay: boolean
  per: number[]
}

function CustomScreen({
  today,
  hardEndIso,
  state,
  onChange,
}: {
  today: Date
  hardEndIso: string
  state: CustomState
  onChange: (s: CustomState) => void
}) {
  const MODES = [
    { id: 'date' as const, label: 'Finish date' },
    { id: 'hours' as const, label: 'Hours a day' },
  ]
  return (
    <>
      <Group label="What do you want to set?">
        <RadioGroup
          label="Set my plan by"
          orientation="horizontal"
          className="cre-pace-sheet__segments"
          count={MODES.length}
          activeIndex={MODES.findIndex((m) => m.id === state.mode)}
          onMove={(i) => onChange({ ...state, mode: MODES[i].id })}
        >
          {(itemProps) =>
            MODES.map((m, i) => (
              <Segment
                key={m.id}
                checked={m.id === state.mode}
                onSelect={() => onChange({ ...state, mode: m.id })}
                {...itemProps(i)}
              >
                {m.label}
              </Segment>
            ))
          }
        </RadioGroup>
      </Group>

      {state.mode === 'date' ? (
        <Field label="I want to finish by" htmlFor="pace-finish">
          <input
            id="pace-finish"
            type="date"
            className="cre-pace-sheet__input"
            value={state.finishIso}
            min={isoFromDate(addDays(today, 1))}
            /* CAPPED AT THE CEILING, not at access expiry: an exam date that
               binds earlier makes any later finish a date the sheet would have
               to immediately call late. The control should not offer it. */
            max={hardEndIso}
            onChange={(e) => e.target.value && onChange({ ...state, finishIso: e.target.value })}
          />
        </Field>
      ) : null}

      <WeekdayGroup
        label="Which days?"
        selected={state.weekdays}
        onChange={(weekdays) => onChange({ ...state, weekdays })}
      />

      {state.mode === 'hours' ? (
        <Group label="Hours per study day">
          <SwitchRow
            checked={state.perDay}
            onToggle={() => onChange({ ...state, perDay: !state.perDay })}
            title="Different each day"
            body="Set each study day on its own instead of one figure for all."
          />
          {state.perDay ? (
            WEEKDAYS.map((d, i) =>
              state.weekdays.includes(i) ? (
                <Stepper
                  key={d}
                  label={d}
                  hours={state.per[i] ?? 0}
                  onChange={(h) =>
                    onChange({ ...state, per: state.per.map((x, j) => (j === i ? h : x)) })
                  }
                />
              ) : null,
            )
          ) : (
            <Stepper
              label="Every study day"
              hours={state.hours}
              min={0.5}
              onChange={(hours) => onChange({ ...state, hours })}
            />
          )}
        </Group>
      ) : null}
    </>
  )
}

/* ── SHARED PIECES ───────────────────────────────────────────────────────── */

/** The seven day toggles. One selected day is the floor — a week with nothing
 *  in it is not a plan, and silently emptying it would make the whole screen
 *  read as broken rather than as empty. */
function WeekdayGroup({
  label,
  selected,
  onChange,
  only,
}: {
  label: string
  selected: number[]
  onChange: (next: number[]) => void
  only?: number[]
}) {
  return (
    <Group label={label}>
      <div role="group" aria-label={label} className="cre-pace-sheet__days">
        {WEEKDAYS.map((d, i) =>
          only && !only.includes(i) ? null : (
            <DayToggle
              key={d}
              label={d}
              pressed={selected.includes(i)}
              onToggle={() => {
                const next = selected.includes(i)
                  ? selected.filter((x) => x !== i)
                  : [...selected, i].sort((a, b) => a - b)
                if (!next.length) return
                onChange(next)
              }}
            />
          ),
        )}
      </div>
    </Group>
  )
}

/** A −/+ pair around an hours figure. Quarter-hour steps below two hours and
 *  half-hour above: the difference between 45 minutes and an hour matters to a
 *  weeknight, the difference between 6 and 6¼ hours does not. */
function Stepper({
  label,
  hours,
  onChange,
  min = 0,
}: {
  label: string
  hours: number
  onChange: (h: number) => void
  min?: number
}) {
  const step = hours < 2 ? 0.25 : 0.5
  const clamp = (h: number) => Math.max(min, Math.min(MAX_DAY_HOURS, Math.round(h * 4) / 4))
  return (
    <div className="cre-pace-sheet__step">
      <span className="cre-pace-sheet__step-label">{label}</span>
      <button
        type="button"
        className="cre-pace-sheet__stepper"
        disabled={hours <= min}
        aria-label={`Less time on ${label}`}
        onClick={() => onChange(clamp(hours - step))}
      >
        −
      </button>
      {/* `aria-live` on the VALUE, because pressing − and + does not move focus:
          without it a screen-reader user hears nothing change. */}
      <span className="cre-pace-sheet__step-value" data-off={hours === 0} aria-live="polite">
        {hours > 0 ? formatHours(hours) : 'Off'}
        <span className="cre-sr-only">{hours > 0 ? ` on ${label}` : ` — ${label} is off`}</span>
      </span>
      <button
        type="button"
        className="cre-pace-sheet__stepper"
        disabled={hours >= MAX_DAY_HOURS}
        aria-label={`More time on ${label}`}
        onClick={() => onChange(clamp(hours + step))}
      >
        +
      </button>
    </div>
  )
}

/**
 * One pace, one verdict, one piece of advice.
 *
 * THE BADGE NEVER CARRIES THE MESSAGE ALONE. Its tone is a fill, and a fill is
 * not readable to everyone — so `standing.message` is a sentence that works
 * with the colour removed, which is also why the model returns prose rather
 * than a severity for the UI to caption.
 */
function Outcome({
  sim,
  standing,
  advice,
}: {
  sim: ScheduleSim | null
  standing: ScheduleStanding
  advice: string | null
}) {
  return (
    <div className="cre-pace-sheet__outcome" aria-live="polite">
      <span className="cre-pace-sheet__group-label">Your pace</span>
      {sim ? (
        <>
          {/* `formatHours` CARRIES ITS OWN UNIT — "8½ hours", "45 minutes" — so
              the sentence must not add one. It read "10 hours hours a week"
              until the browser said so out loud. */}
          <span className="cre-pace-sheet__outcome-figure">
            {formatHours(sim.hoursPerWeek)} a week
          </span>
          <span className="cre-pace-sheet__hint">
            Over {sim.daysPerWeek} {sim.daysPerWeek === 1 ? 'day' : 'days'} · longest day{' '}
            {formatHours(sim.longestDayHours)}
          </span>
        </>
      ) : null}
      <span className="cre-pace-sheet__badge" data-tone={standing.tone}>
        {standing.message}
      </span>
      {advice ? <p className="cre-pace-sheet__advice">{advice}</p> : null}
    </div>
  )
}

/**
 * Four weeks from the Monday on or before today, with the study days, the
 * finish and the deadline marked.
 *
 * `aria-hidden`, and deliberately: every fact it draws is stated in words by
 * `Outcome` directly above it, and a screen-reader user walking 28 numbered
 * cells to reconstruct "finishes May 27" learns nothing the sentence did not
 * already tell them. The same call the tile's week strip makes.
 */
function PlanCalendar({
  today,
  sim,
  hardEndIso,
}: {
  today: Date
  sim: ScheduleSim | null
  hardEndIso: string
}) {
  const first = addDays(today, -weekdayOf(today))
  const studied = new Set(sim?.studyDays ?? [])
  const cells = Array.from({ length: 28 }, (_, i) => {
    const date = addDays(first, i)
    const offset = Math.round((date.getTime() - startOfDay(today).getTime()) / 86_400_000)
    const iso = isoFromDate(date)
    return {
      iso,
      day: date.getDate(),
      out: offset < 0 || iso > hardEndIso,
      study: studied.has(offset),
      finish: sim != null && iso === sim.finishIso,
      end: iso === hardEndIso,
    }
  })
  return (
    <Group label="Your plan">
      <div className="cre-pace-sheet__cal" aria-hidden>
        {WEEKDAYS.map((d) => (
          <span key={d} className="cre-pace-sheet__cal-head">
            {d.slice(0, 1)}
          </span>
        ))}
        {cells.map((c) => (
          <span
            key={c.iso}
            className="cre-pace-sheet__cal-cell"
            data-out={c.out}
            data-study={c.study}
            data-finish={c.finish}
            data-end={c.end}
          >
            {c.day}
          </span>
        ))}
      </div>
      <div className="cre-pace-sheet__legend" aria-hidden>
        <span>
          <i
            className="cre-pace-sheet__swatch"
            style={{ background: 'var(--color-primary-100)', border: '1px solid var(--color-primary-300)' }}
          />
          Study day
        </span>
        <span>
          <i className="cre-pace-sheet__swatch" style={{ background: 'var(--color-primary-500)' }} />
          Finish
        </span>
        <span>
          <i
            className="cre-pace-sheet__swatch"
            style={{ boxShadow: 'inset 0 -3px 0 var(--color-error-500)', border: '1px solid var(--color-border-subtle)' }}
          />
          Last usable day
        </span>
      </div>
    </Group>
  )
}

/** Midnight local, so day arithmetic cannot be thrown by the time of day. */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** `d` + n whole days, built from local parts — never from an ISO string, per
 *  `courseExpiry`'s UTC off-by-one rule. */
function addDays(d: Date, n: number): Date {
  const x = startOfDay(d)
  x.setDate(x.getDate() + n)
  return x
}

/* The shell fills the panel so its three children can divide it. Inline because
   it is three declarations describing this component's relationship to `Sheet`,
   not a reusable treatment. */
const sheetShell = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  flex: 1,
} as const

/* ─── pieces ─────────────────────────────────────────────────────────── */

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="cre-pace-sheet__group">
      <span className="cre-pace-sheet__group-label">{label}</span>
      {children}
    </section>
  )
}

/**
 * A radio group with ROVING TABINDEX — one tab stop, arrows to move.
 *
 * Both groups in this sheet were lists of `role="radio"` buttons, every one of
 * them tabbable and none of them reachable by arrow key: seven tab stops to
 * cross the sheet, and the keyboard interaction the role promises simply absent.
 * A native radio group is one stop and arrows select within it, and a custom
 * one has to be built to match or it should not claim the role.
 *
 * `onMove` both MOVES AND SELECTS, which is the native behaviour for a radio
 * group (unlike a tablist, where selection can follow focus optionally). Home
 * and End jump to the ends.
 */
function RadioGroup({
  label,
  orientation,
  className,
  count,
  activeIndex,
  onMove,
  children,
}: {
  label: string
  orientation: 'vertical' | 'horizontal'
  className: string
  count: number
  activeIndex: number
  onMove: (index: number) => void
  children: (itemProps: (i: number) => { tabIndex: number; ref: (el: HTMLButtonElement | null) => void }) => ReactNode
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const prev = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft'
  const next = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight'

  const go = (i: number) => {
    const clamped = (i + count) % count
    onMove(clamped)
    refs.current[clamped]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={className}
      onKeyDown={(e) => {
        if (e.key === prev) {
          e.preventDefault()
          go(activeIndex - 1)
        } else if (e.key === next) {
          e.preventDefault()
          go(activeIndex + 1)
        } else if (e.key === 'Home') {
          e.preventDefault()
          go(0)
        } else if (e.key === 'End') {
          e.preventDefault()
          go(count - 1)
        }
      }}
    >
      {children((i) => ({
        /* ONE STOP PER GROUP: the active option is tabbable, the rest are
           reachable only by arrow — which is what makes this a single stop in
           the sheet's tab order rather than four. */
        tabIndex: i === activeIndex ? 0 : -1,
        ref: (el: HTMLButtonElement | null) => {
          refs.current[i] = el
        },
      }))}
    </div>
  )
}

/* REMOVED 2026-09-22 — `AimRow`, the three-preset radio row (Relaxed /
   Recommended / Focused). The presets did not go: Recommended is stated on the
   chooser and accepted by its primary button, and "pick a finish date" is now
   the `custom` screen's date mode, which does the same job against a real
   calendar instead of three fixed options. The row itself is reconstructible
   from git; a block of dead JSX is the thing that rots. Its `.cre-pace-sheet__aim*`
   CSS is left in `tokens.css` for the same reason the file keeps other unused
   rules — it is the restore path, and it costs nothing at rest. */

function BindingNote({
  model,
  today,
  accessExpiresAt,
  examDate,
}: {
  model: ReturnType<typeof studyPace>
  today: Date
  accessExpiresAt?: string
  examDate: string | null
}) {
  const accessLeft = daysUntil(accessExpiresAt, today)
  if (!examDate) {
    return (
      <p className="cre-pace-sheet__hint cre-pace-sheet__binding" data-binding="access">
        {accessExpiresAt && accessLeft != null ? (
          <>
            These come from your course access, which ends{' '}
            <b className="cre-pace-sheet__strong">{formatPaceDate(accessExpiresAt)}</b>.
          </>
        ) : (
          <>These come from the time you have left on this course.</>
        )}
      </p>
    )
  }
  return (
    <p className="cre-pace-sheet__hint cre-pace-sheet__binding" data-binding={model.binding}>
      {model.binding === 'exam' ? (
        <>
          <b className="cre-pace-sheet__strong">Your exam date is the one doing the work.</b> Sitting on{' '}
          {formatPaceDate(examDate)} means coursework has to be done by {formatPaceDate(model.hardEndIso)}
          {accessExpiresAt ? <> — sooner than your access ends on {formatPaceDate(accessExpiresAt)}</> : null}.
        </>
      ) : model.binding === 'both' ? (
        <>
          <b className="cre-pace-sheet__strong">Both dates land on the same day.</b> Your exam buffer and the
          end of your access agree for once.
        </>
      ) : (
        <>
          <b className="cre-pace-sheet__strong">Your access is still the one doing the work.</b> It ends{' '}
          {accessExpiresAt ? formatPaceDate(accessExpiresAt) : 'first'}, before your exam on{' '}
          {formatPaceDate(examDate)} would require.
        </>
      )}
    </p>
  )
}

function SwitchRow({
  checked,
  onToggle,
  title,
  body,
}: {
  checked: boolean
  onToggle: () => void
  title: string
  body: string
}) {
  return (
    <div className="cre-pace-sheet__switch-row" data-on={checked}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={onToggle}
        className="cre-pace-sheet__switch"
      >
        <span aria-hidden className="cre-pace-sheet__switch-knob" />
      </button>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span className="cre-pace-sheet__switch-title">{title}</span>
        <span className="cre-pace-sheet__hint" style={{ display: 'block' }}>
          {body}
        </span>
      </span>
    </div>
  )
}

function DayToggle({ label, pressed, onToggle }: { label: string; pressed: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      data-weekday={label}
      className="cre-pace-sheet__day"
    >
      {/* The letter is a label, not the name: the accessible name has to survive
          the abbreviation, which is the same rule the collapsible rail landed on. */}
      <span aria-hidden>{label.slice(0, 1)}</span>
      <span className="cre-sr-only">{label}</span>
    </button>
  )
}

/**
 * The first four dated sessions — the honest preview of what is about to be
 * written. Dates are real, so a learner can see that "4 nights a week" means
 * Monday, Tuesday, Wednesday and Thursday of THIS week, not an abstraction.
 */
function SessionPreview({
  today,
  preset,
  weekdays,
  startTime,
}: {
  today: Date
  preset: PacePreset
  weekdays: number[]
  startTime: string
}) {
  const sessions: string[] = []
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  for (let i = 0; i < 40 && sessions.length < 4; i += 1) {
    cursor.setDate(cursor.getDate() + 1)
    const monFirst = (cursor.getDay() + 6) % 7
    if (weekdays.includes(monFirst) && isoFromDate(cursor) <= preset.finishIso) {
      sessions.push(isoFromDate(cursor))
    }
  }
  if (!sessions.length)
    return <p className="cre-pace-sheet__hint">No sessions fall before your finish date.</p>
  const perNight = preset.minsPerWeek / weekdays.length
  return (
    <div className="cre-pace-sheet__sessions">
      {sessions.map((iso) => (
        <div key={iso} data-session={iso} className="cre-pace-sheet__session">
          <span className="cre-pace-sheet__session-date">{longDate(iso)}</span>
          <span className="cre-pace-sheet__session-time">
            {clock(startTime)} – {clock(startTime, perNight)}
          </span>
        </div>
      ))}
      <div className="cre-pace-sheet__sessions-foot">
        …repeating until {formatPaceDate(preset.finishIso)}
      </div>
    </div>
  )
}

/* ─── small helpers ──────────────────────────────────────────────────── */


function longDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return iso
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

/** "7pm" / "9:35pm". `addMins` shifts it, for a session's end. */
function clock(time: string, addMins = 0): string {
  const [h, m] = time.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return time
  const total = h * 60 + m + Math.round(addMins)
  const hh = Math.floor((total / 60) % 24)
  const mm = total % 60
  const suffix = hh < 12 ? 'am' : 'pm'
  const h12 = hh % 12 || 12
  return mm ? `${h12}:${mm < 10 ? '0' : ''}${mm}${suffix}` : `${h12}${suffix}`
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <span className="cre-pace-sheet__field">
      <label htmlFor={htmlFor} className="cre-pace-sheet__field-label">
        {label}
      </label>
      {children}
    </span>
  )
}

function Segment({
  checked,
  onSelect,
  children,
  tabIndex,
  ref,
}: {
  checked: boolean
  onSelect: () => void
  children: ReactNode
  tabIndex: number
  ref: (el: HTMLButtonElement | null) => void
}) {
  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={checked}
      tabIndex={tabIndex}
      onClick={onSelect}
      data-nights={String(children)}
      className="cre-pace-sheet__segment"
    >
      {children}
    </button>
  )
}

/** Re-exported so a caller can offer the style axis without a second import. */
export { STYLE_FACTORS }
