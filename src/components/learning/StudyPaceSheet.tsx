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
  presetLabel,
  isoFromDate,
  daysUntil,
  NIGHT_OPTIONS,
  STYLE_FACTORS,
  WEEKDAY_LABELS,
  defaultWeekdays,
  type PacePreset,
  type PresetId,
  type StudyStyle,
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

export type PaceChoices = {
  /** `null` ⇒ the learner has not chosen; the model's Recommended stands. */
  presetId: PresetId | null
  nights: number | null
  /** ISO yyyy-mm-dd. */
  examDate: string | null
  style: StudyStyle
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
  plan: null,
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
 * All four now live here and `onChange` fires ONCE, from Save. Cancel, Escape
 * and a scrim click are the same path — they unmount this component and the
 * draft goes with it, which is why discarding needs no handler of its own.
 *
 * WHAT IT COSTS, and it is a real loss: the tile no longer re-prices live
 * behind the open sheet. The sheet's own figures still move on every keystroke
 * (the aim rows, the segments, the session preview all read `draft`), so the
 * feedback the live model gave is still there — it is just inside the panel the
 * learner is looking at. The sub-line's "everything below re-prices as you
 * change it" went with the change, because a Save button beside that sentence
 * is the product contradicting itself.
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
  const [draft, setDraft] = useState<PaceChoices>(choices)
  const [planOn, setPlanOn] = useState(choices.plan != null)
  const [weekdays, setWeekdays] = useState<number[] | null>(choices.plan?.weekdays ?? null)
  const [startTime, setStartTime] = useState(choices.plan?.startTime ?? DEFAULT_START_TIME)

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
  const selected =
    (draft.presetId && model.presets.find((p) => p.id === draft.presetId)) || defaultPreset(model)
  const days = weekdays ?? defaultWeekdays(selected.nights)
  const set = (patch: Partial<PaceChoices>) => setDraft((d) => ({ ...d, ...patch }))

  /* THE CONTROL REFLECTS WHAT IT SETS. `Segment` used to compare against
     `selected.nights` — the MODEL's derived value — while setting
     `draft.nights`. Until the learner picked one they differed, so the
     highlighted segment was the model's suggestion and clicking it wrote a
     value that had not been there before. It reads the draft first and falls
     back to the suggestion only while there is nothing to read. */
  const nightsShown = draft.nights ?? selected.nights
  /** Ticking weekdays is authoritative once the calendar is on — so group 2 is
   *  being driven from group 4, and says so rather than jumping silently. */
  const nightsFromPlan = planOn && weekdays != null

  return (
    <div className="cre-pace-sheet" style={sheetShell}>
      {/* ── HEADER ───────────────────────────────────────────────────────
          `aria-hidden` on the visible title: `Sheet` already renders an sr-only
          one for its `aria-labelledby`, and two copies of the same string give
          the dialog a doubled accessible name. */}
      <header className="cre-pace-sheet__header">
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

      {/* ── SCROLL BODY ─────────────────────────────────────────────────── */}
      <div className="cre-pace-sheet__body">
        <p className="cre-pace-sheet__hint">
          {Math.round(hoursRemaining)} hours left{courseTitle ? ` of ${courseTitle}` : ''}.
        </p>

        {/* 1 · AIM */}
        <Group label="What are you aiming at?">
          <RadioGroup
            label="Finish date"
            orientation="vertical"
            className="cre-pace-sheet__aims"
            count={model.presets.length}
            activeIndex={Math.max(0, model.presets.findIndex((p) => p.id === selected.id))}
            onMove={(i) => {
              const next = model.presets[i]
              if (next && next.state !== 'no') set({ presetId: next.id })
            }}
          >
            {(itemProps) =>
              model.presets.map((p, i) => (
                <AimRow
                  key={p.id}
                  preset={p}
                  checked={p.id === selected.id}
                  recommended={p.id === 'recommended'}
                  onSelect={() => set({ presetId: p.id })}
                  {...itemProps(i)}
                />
              ))
            }
          </RadioGroup>
          <BindingNote model={model} today={today} accessExpiresAt={accessExpiresAt} examDate={draft.examDate} />
        </Group>

        {/* 2 · DAYS A WEEK */}
        <Group label="How many days a week?">
          <RadioGroup
            label="Days a week"
            orientation="horizontal"
            className="cre-pace-sheet__segments"
            count={NIGHT_OPTIONS.length}
            activeIndex={Math.max(0, NIGHT_OPTIONS.indexOf(nightsShown as (typeof NIGHT_OPTIONS)[number]))}
            onMove={(i) => {
              set({ nights: NIGHT_OPTIONS[i] })
              setWeekdays(null)
            }}
          >
            {(itemProps) =>
              NIGHT_OPTIONS.map((n, i) => (
                <Segment
                  key={n}
                  checked={n === nightsShown}
                  onSelect={() => {
                    set({ nights: n })
                    setWeekdays(null)
                  }}
                  {...itemProps(i)}
                >
                  {n}
                </Segment>
              ))
            }
          </RadioGroup>
          {/* THE JUMP, MADE VISIBLE. Ticking a weekday in group 4 rewrites this
              group, correctly and — until now — silently. `aria-live` because
              the change happens two groups away from where the learner is
              looking. */}
          <p className="cre-pace-sheet__hint" aria-live="polite">
            {nightsFromPlan
              ? 'Set by the days you picked below.'
              : 'Fewer days means longer evenings, not less work.'}
          </p>
        </Group>

        {/* 3 · EXAM DATE — HIDDEN 2026-09-21, the direct ask ("hide"), pointed
            at this group.

            ⚠ THE EXAM DATE IS NOT GONE, and that is the only reason hiding the
            field is survivable. It has a SECOND and better home: the Schedule
            State Exam card's own capture ("Already scheduled? Enter the exam
            date and we'll use it to help you prep"), which writes
            `examDateStore`. That store reaches this sheet — the band threads it
            to `StudyPaceTile`, which seeds `choices.examDate` from it — so the
            model still switches ceilings and `BindingNote` above still names
            which one is doing the work and what it beat. This removed a SECOND
            entry point for one fact, not the fact.

            WHAT WENT WITH IT, and it is worth knowing rather than discovering:
            the exam-BUFFER sentence ("coursework finishes 7 days before you
            sit … whichever comes first sets your pace") lived in this group and
            went too. `BindingNote`'s exam message still states the consequence
            — "coursework has to be done by <date>" — but the RULE behind the
            number is no longer written down anywhere on this surface. Putting
            that one sentence under the binding note would restore it without
            bringing the field back.

            Deleted rather than commented out: the field, its Clear button and
            the hint are all reconstructible from this note and from git, and a
            block of dead JSX is the thing that rots. */}

        {/* 4 · THE STUDY PLAN */}
        <Group label="Put it on a calendar">
          <SwitchRow
            checked={planOn}
            onToggle={() => {
              const next = !planOn
              setPlanOn(next)
              if (next && !weekdays) setWeekdays(defaultWeekdays(selected.nights))
              if (!next) {
                setWeekdays(null)
                set({ plan: null })
              }
            }}
            title="Create a study plan"
            body={
              selected.state === 'no'
                ? 'Once there is a pace that fits.'
                : 'Puts each session on your Study Plan.'
            }
          />
          {planOn && selected.state !== 'no' ? (
            <>
              <span className="cre-pace-sheet__group-label">Which days, and when?</span>
              <div role="group" aria-label="Study days" className="cre-pace-sheet__days">
                {WEEKDAYS.map((d, i) => (
                  <DayToggle
                    key={d}
                    label={d}
                    pressed={days.includes(i)}
                    onToggle={() => {
                      const next = days.includes(i) ? days.filter((x) => x !== i) : [...days, i].sort((a, b) => a - b)
                      if (!next.length) return
                      setWeekdays(next)
                      // Ticking a day is AUTHORITATIVE once the calendar is on —
                      // the pace follows the days, rather than the two disagreeing.
                      set({ nights: next.length })
                    }}
                  />
                ))}
              </div>
              <Field label="Usual start time" htmlFor="pace-time">
                <input
                  id="pace-time"
                  type="time"
                  className="cre-pace-sheet__input"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value || DEFAULT_START_TIME)}
                />
              </Field>
              <SessionPreview today={today} preset={selected} weekdays={days} startTime={startTime} />
            </>
          ) : null}
        </Group>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────────
          A SIBLING of the scroll body, not the last thing inside it — which is
          the whole point: pinned, always reachable, and the reason the panel
          can no longer clip it. */}
      <footer className="cre-pace-sheet__footer">
        <Button
          onClick={() => {
            onChange({
              ...draft,
              plan: planOn && selected.state !== 'no' ? { weekdays: days, startTime } : null,
            })
            onClose()
          }}
        >
          {/* "Save pace & plan", not "Save pace & build my plan". The long form
              measured 210px of a 420px footer and pushed Reset onto a second
              row — 44px of height in the panel whose height is the whole bug.
              The short form keeps both nouns (the pace is saved, the plan is
              built) and holds one row. The no-plan label stays EXACTLY
              "Save pace"; tests pin that one. */}
          {planOn ? 'Save pace & plan' : 'Save pace'}
        </Button>
        <button type="button" onClick={onClose} className="cre-pace-sheet__text-button">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(RECOMMENDED)
            setPlanOn(false)
            setWeekdays(null)
            setStartTime(DEFAULT_START_TIME)
          }}
          className="cre-pace-sheet__text-button cre-pace-sheet__reset"
        >
          Reset to recommended
        </button>
      </footer>
    </div>
  )
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

function AimRow({
  preset,
  checked,
  recommended,
  onSelect,
  tabIndex,
  ref,
}: {
  preset: PacePreset
  checked: boolean
  recommended: boolean
  onSelect: () => void
  tabIndex: number
  ref: (el: HTMLButtonElement | null) => void
}) {
  const unfittable = preset.state === 'no'
  const reasonId = `pace-aim-${preset.id}-why`
  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={checked}
      /* `aria-disabled`, NOT `disabled` — see the class's own note. A disabled
         button drops out of the tab order and out of most screen-reader element
         lists, so the one row that most needs to explain itself would be the
         one a keyboard user cannot reach. The click is refused in the handler
         instead. */
      aria-disabled={unfittable || undefined}
      aria-describedby={unfittable ? reasonId : undefined}
      tabIndex={tabIndex}
      onClick={() => {
        if (!unfittable) onSelect()
      }}
      data-preset={preset.id}
      className="cre-pace-sheet__aim"
    >
      <span aria-hidden className="cre-pace-sheet__radio" />
      <span style={{ minWidth: 0 }}>
        <span className="cre-pace-sheet__aim-name">
          {/* `presetLabel`, not the raw name: "Relaxed" is only kept while the
              evening is genuinely light. On a long course the same date is
              described as what it is. */}
          {presetLabel(preset)}
          {recommended ? <span className="cre-pace-sheet__chip">Recommended</span> : null}
        </span>
        <span className="cre-pace-sheet__hint" style={{ display: 'block' }}>
          Finish by {formatPaceDate(preset.finishIso)}
        </span>
        {unfittable ? (
          <span id={reasonId} className="cre-pace-sheet__hint" style={{ display: 'block' }}>
            There is not enough time left for this pace.
          </span>
        ) : null}
      </span>
      <span style={{ textAlign: 'right' }}>
        <span className="cre-pace-sheet__aim-evening" data-state={preset.state}>
          {/* SHOWN as the glyph, SPOKEN as words. `formatEvening` returns `1¾
              hours`, which a screen reader may render as "three quarters",
              "3/4" or nothing — on the one figure this sheet exists to convey.
              Both come from the same rounding; see `formatEveningSpoken`. */}
          <span aria-hidden>{unfittable ? '—' : formatEvening(preset.minsPerNight)}</span>
          {unfittable ? null : (
            <span className="cre-sr-only">{formatEveningSpoken(preset.minsPerNight)}</span>
          )}
        </span>
        <span className="cre-pace-sheet__hint" style={{ display: 'block' }}>
          {unfittable ? 'won’t fit' : 'a night'}
        </span>
      </span>
    </button>
  )
}

/**
 * Which ceiling is doing the work, in words.
 *
 * This is the half of the two-ceiling rule that makes it honest. The model
 * picks the sooner one silently; this says so, and names the other date, so the
 * learner can see why their pace moved when they typed an exam date in.
 */
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
